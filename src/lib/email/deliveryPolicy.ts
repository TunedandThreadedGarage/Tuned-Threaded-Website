/**
 * Presence-aware email delivery policy.
 *
 * Online   → in-app only, never email.
 * Away     → email after a grace delay (cancel if the user returns/reads).
 * Offline  → email after a shorter delay (they're gone; bring them back).
 *
 * Security / auth / order mail bypasses this policy entirely.
 */

export type PresenceState = "online" | "away" | "offline";

/** Presence row is stale-checked: a crashed browser can't stay "online" forever. */
export const ONLINE_FRESH_MS = 2 * 60 * 1000;
export const AWAY_FRESH_MS = 10 * 60 * 1000;

export function resolvePresence(
  row: { status?: string | null; last_seen_at?: string | null } | null | undefined,
  nowMs: number = Date.now(),
): PresenceState {
  if (!row?.last_seen_at) return "offline";
  const age = nowMs - new Date(row.last_seen_at).getTime();
  if (Number.isNaN(age) || age > AWAY_FRESH_MS) return "offline";
  if (row.status === "online" && age <= ONLINE_FRESH_MS) return "online";
  if (row.status === "offline") return "offline";
  return "away";
}

const MESSAGE_TYPES = new Set(["message", "message_request"]);

export const EMAIL_DELAY_SECONDS = {
  message: { away: 5 * 60, offline: 2 * 60 },
  social: { away: 10 * 60, offline: 5 * 60 },
} as const;

/**
 * Returns the queue delay in seconds, or null when no email should be
 * scheduled (recipient is online).
 */
export function emailDelaySeconds(
  notificationType: string,
  presence: PresenceState,
): number | null {
  if (presence === "online") return null;
  const kind = MESSAGE_TYPES.has(notificationType) ? "message" : "social";
  return EMAIL_DELAY_SECONDS[kind][presence];
}
