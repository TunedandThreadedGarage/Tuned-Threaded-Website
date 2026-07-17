import { decideChannels, eventKeyForNotificationType } from "@/lib/email/channelDecision";
import { lookupUserEmail } from "@/lib/supabase/admin";

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

    return decideChannels({
      masterEnabled: settings?.master_enabled,
      emailFrequency: settings?.email_frequency,
      emailEnabled: channel?.email_enabled,
      inAppEnabled: channel?.in_app_enabled,
      pushEnabled: channel?.push_enabled,
    });
  } catch {
    return FALLBACK;
  }
}

export async function resolveRecipientEmail(
  userId: string,
): Promise<string | null> {
  return lookupUserEmail(userId);
}

export { decideChannels, eventKeyForNotificationType };
