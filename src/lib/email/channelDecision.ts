import { TYPE_TO_EVENT_KEY } from "@/features/settings/constants";

export type ChannelDecision = {
  inApp: boolean;
  email: boolean;
  push: boolean;
  frequency: "instant" | "daily" | "weekly" | "never";
};

export type PreferenceInputs = {
  masterEnabled?: boolean | null;
  emailFrequency?: string | null;
  emailEnabled?: boolean | null;
  inAppEnabled?: boolean | null;
  pushEnabled?: boolean | null;
  /** When true, skip preference checks (security / auth mail). */
  force?: boolean;
};

/**
 * Pure preference resolver — used by runtime + unit tests.
 * In-app and email are independent; email also requires frequency === "instant"
 * (digests are handled separately).
 */
export function decideChannels(input: PreferenceInputs): ChannelDecision {
  if (input.force) {
    return {
      inApp: true,
      email: true,
      push: false,
      frequency: "instant",
    };
  }

  if (input.masterEnabled === false) {
    return {
      inApp: false,
      email: false,
      push: false,
      frequency: "never",
    };
  }

  const frequency = (input.emailFrequency ?? "instant") as ChannelDecision["frequency"];
  const inApp = input.inAppEnabled ?? true;
  const emailEnabled = input.emailEnabled ?? true;
  const push = input.pushEnabled ?? false;
  const email = emailEnabled && frequency === "instant";

  return { inApp, email, push, frequency };
}

export function eventKeyForNotificationType(notificationType: string): string {
  return TYPE_TO_EVENT_KEY[notificationType] ?? notificationType;
}
