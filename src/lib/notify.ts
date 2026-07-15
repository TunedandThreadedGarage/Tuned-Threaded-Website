import type { NotificationType } from "@/features/notifications/constants";
import { getChannelDecision } from "@/lib/email/preferences";
import { dispatchNotificationEmail } from "@/lib/email/dispatch";

// Server actions pass the typed Supabase server client; keep this flexible.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

export type NotifyInput = {
  userId: string;
  actorId?: string | null;
  type: NotificationType | string;
  message: string;
  action?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  href?: string | null;
  thumbnailUrl?: string | null;
};

/** Insert a notification for a recipient. Never notifies the actor themselves. */
export async function createNotification(
  supabase: AnySupabase,
  input: NotifyInput,
): Promise<void> {
  if (input.actorId && input.actorId === input.userId) return;

  let decision: Awaited<ReturnType<typeof getChannelDecision>> = {
    inApp: true,
    email: false,
    push: false,
    frequency: "instant",
  };
  try {
    decision = await getChannelDecision(supabase, input.userId, input.type);
  } catch {
    // Preferences table may be unavailable — keep in-app behavior.
  }

  if (decision.inApp) {
    await supabase.from("notifications").insert({
      user_id: input.userId,
      actor_id: input.actorId ?? null,
      type: input.type,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      message: input.message,
      action: input.action ?? null,
      href: input.href ?? null,
      thumbnail_url: input.thumbnailUrl ?? null,
    });
  }

  if (decision.email) {
    let actorName: string | null = null;
    if (input.actorId) {
      actorName = await actorLabel(supabase, input.actorId);
    }
    try {
      await dispatchNotificationEmail(supabase, {
        userId: input.userId,
        type: input.type,
        message: input.message,
        href: input.href,
        actorName,
      });
    } catch {
      // Email is best-effort; never fail the primary action.
    }
  }
}

export async function createNotifications(
  supabase: AnySupabase,
  inputs: NotifyInput[],
): Promise<void> {
  for (const input of inputs) {
    await createNotification(supabase, input);
  }
}

export async function actorLabel(
  supabase: AnySupabase,
  actorId: string,
): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("id", actorId)
    .maybeSingle();
  return data?.display_name ?? data?.username ?? "Someone";
}
