import type { NotificationType } from "@/features/notifications/constants";

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

export async function createNotifications(
  supabase: AnySupabase,
  inputs: NotifyInput[],
): Promise<void> {
  const rows = inputs
    .filter((i) => !i.actorId || i.actorId !== i.userId)
    .map((input) => ({
      user_id: input.userId,
      actor_id: input.actorId ?? null,
      type: input.type,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      message: input.message,
      action: input.action ?? null,
      href: input.href ?? null,
      thumbnail_url: input.thumbnailUrl ?? null,
    }));
  if (rows.length === 0) return;
  await supabase.from("notifications").insert(rows);
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
