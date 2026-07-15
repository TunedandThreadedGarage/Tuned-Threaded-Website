import { TYPE_TO_EVENT_KEY } from "@/features/settings/constants";
import { lookupUserEmail } from "@/lib/supabase/admin";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

export type ChannelDecision = {
  inApp: boolean;
  email: boolean;
  push: boolean;
  frequency: "instant" | "daily" | "weekly" | "never";
};

const DEFAULT: ChannelDecision = {
  inApp: true,
  email: true,
  push: false,
  frequency: "instant",
};

export async function getChannelDecision(
  supabase: AnySupabase,
  userId: string,
  notificationType: string,
): Promise<ChannelDecision> {
  const eventKey = TYPE_TO_EVENT_KEY[notificationType] ?? notificationType;

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
  if (!settings && !channel) return DEFAULT;
  if (settings && !settings.master_enabled) {
    return { inApp: false, email: false, push: false, frequency: "never" };
  }

  const frequency = (settings?.email_frequency ??
    "instant") as ChannelDecision["frequency"];
  const inApp = channel?.in_app_enabled ?? true;
  const emailEnabled = channel?.email_enabled ?? true;
  const push = channel?.push_enabled ?? false;
  const email = emailEnabled && frequency === "instant";

  return { inApp, email, push, frequency };
}

export async function resolveRecipientEmail(
  userId: string,
): Promise<string | null> {
  return lookupUserEmail(userId);
}
