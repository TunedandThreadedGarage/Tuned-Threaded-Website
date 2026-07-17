import { decideChannels, eventKeyForNotificationType } from "@/lib/email/channelDecision";
import { lookupUserEmail, createAdminClient } from "@/lib/supabase/admin";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

export type ChannelDecision = {
  inApp: boolean;
  email: boolean;
  push: boolean;
  frequency: "instant" | "daily" | "weekly" | "never";
};

const FALLBACK: ChannelDecision = {
  inApp: true,
  email: true,
  push: false,
  frequency: "instant",
};

export async function getChannelDecision(
  supabase: AnySupabase,
  userId: string,
  notificationType: string,
  opts?: { force?: boolean },
): Promise<ChannelDecision> {
  if (opts?.force) {
    return decideChannels({ force: true, masterEnabled: true });
  }

  const eventKey = eventKeyForNotificationType(notificationType);

  try {
    const [{ data: settings }, { data: channel }] = await Promise.all([
      supabase
        .from("communication_settings")
        .select("master_enabled, email_frequency")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("notification_channel_preferences")
        .select("email_enabled, in_app_enabled, push_enabled")
        .eq("user_id", userId)
        .eq("event_key", eventKey)
        .maybeSingle(),
    ]);

    // Tables not migrated yet — keep prior behavior.
    if (!settings && !channel) return FALLBACK;

    const decision = decideChannels({
      masterEnabled: settings?.master_enabled,
      emailFrequency: settings?.email_frequency,
      emailEnabled: channel?.email_enabled,
      inAppEnabled: channel?.in_app_enabled,
      pushEnabled: channel?.push_enabled,
    });

    console.info(
      `[notify:prefs] type=${notificationType} eventKey=${eventKey} userId=${userId} email=${decision.email} inApp=${decision.inApp} frequency=${decision.frequency} channelRow=${channel ? "yes" : "no"}`,
    );

    return decision;
  } catch (e) {
    console.warn(
      `[notify:prefs:error] type=${notificationType} userId=${userId} error=${e instanceof Error ? e.message : "unknown"}`,
    );
    return FALLBACK;
  }
}

/**
 * Resolve recipient email for notification delivery.
 * Order: service-role admin API → secure RPC (NOTIFY_LOOKUP_SECRET) → null.
 */
export async function resolveRecipientEmail(
  userId: string,
  supabase?: AnySupabase,
): Promise<string | null> {
  // 1) Service role admin API (preferred when configured)
  const viaAdmin = await lookupUserEmail(userId);
  if (viaAdmin) {
    console.info(`[notify:recipient] source=admin userId=${userId}`);
    return viaAdmin;
  }

  // 2) Secure RPC backed by private.user_emails
  const secret = process.env.NOTIFY_LOOKUP_SECRET;
  if (!secret) {
    console.error(
      `[notify:recipient:fail] userId=${userId} reason=missing_NOTIFY_LOOKUP_SECRET_and_SERVICE_ROLE`,
    );
    return null;
  }

  const client = supabase ?? createAdminClient();
  if (!client) {
    console.error(
      `[notify:recipient:fail] userId=${userId} reason=no_supabase_client`,
    );
    return null;
  }

  try {
    const { data, error } = await client.rpc("get_notification_email", {
      p_user_id: userId,
      p_secret: secret,
    });
    if (error) {
      console.error(
        `[notify:recipient:fail] userId=${userId} source=rpc error=${error.message}`,
      );
      return null;
    }
    if (typeof data === "string" && data.includes("@")) {
      console.info(`[notify:recipient] source=rpc userId=${userId}`);
      return data;
    }
    console.error(
      `[notify:recipient:fail] userId=${userId} source=rpc reason=empty_result`,
    );
    return null;
  } catch (e) {
    console.error(
      `[notify:recipient:fail] userId=${userId} source=rpc error=${e instanceof Error ? e.message : "unknown"}`,
    );
    return null;
  }
}

export { decideChannels, eventKeyForNotificationType };
