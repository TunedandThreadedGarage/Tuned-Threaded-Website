"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE } from "@/features/notifications/constants";
import type { NotificationFeedItem } from "@/features/notifications/types";

export type ActionResult = { error?: string; success?: boolean };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return { supabase, user };
}

async function hydrateActors(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: {
    id: string;
    user_id: string;
    actor_id: string | null;
    type: string;
    entity_type: string | null;
    entity_id: string | null;
    message: string;
    action: string | null;
    href: string | null;
    thumbnail_url: string | null;
    read_at: string | null;
    created_at: string;
  }[],
): Promise<NotificationFeedItem[]> {
  const actorIds = [
    ...new Set(rows.map((n) => n.actor_id).filter(Boolean) as string[]),
  ];
  const { data: actors } = actorIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", actorIds)
    : { data: [] as {
        id: string;
        username: string | null;
        display_name: string | null;
        avatar_url: string | null;
      }[] };

  const actorMap = new Map((actors ?? []).map((a) => [a.id, a]));

  return rows.map((row) => {
    const actor = row.actor_id ? actorMap.get(row.actor_id) : null;
    return {
      id: row.id,
      userId: row.user_id,
      actorId: row.actor_id,
      type: row.type,
      entityType: row.entity_type,
      entityId: row.entity_id,
      message: row.message,
      action: row.action,
      href: row.href,
      thumbnailUrl: row.thumbnail_url,
      readAt: row.read_at,
      createdAt: row.created_at,
      actor: actor
        ? {
            id: actor.id,
            username: actor.username,
            displayName: actor.display_name,
            avatarUrl: actor.avatar_url,
          }
        : null,
    };
  });
}

export async function loadNotificationsPage(input?: {
  cursor?: string | null;
  limit?: number;
}): Promise<{
  items: NotificationFeedItem[];
  nextCursor: string | null;
  error?: string;
}> {
  try {
    const { supabase, user } = await requireUser();
    const limit = Math.min(input?.limit ?? PAGE_SIZE, 40);

    let query = supabase
      .from("notifications")
      .select(
        "id, user_id, actor_id, type, entity_type, entity_id, message, action, href, thumbnail_url, read_at, created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (input?.cursor) {
      query = query.lt("created_at", input.cursor);
    }

    const { data, error } = await query;
    if (error) return { items: [], nextCursor: null, error: error.message };

    const rows = data ?? [];
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const items = await hydrateActors(supabase, page);

    return {
      items,
      nextCursor: hasMore ? page[page.length - 1]?.created_at ?? null : null,
    };
  } catch (e) {
    return {
      items: [],
      nextCursor: null,
      error: e instanceof Error ? e.message : "Failed to load notifications.",
    };
  }
}

export async function getUnreadNotificationCount(): Promise<{
  count: number;
  error?: string;
}> {
  try {
    const { supabase, user } = await requireUser();
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null);
    if (error) return { count: 0, error: error.message };
    return { count: count ?? 0 };
  } catch {
    return { count: 0 };
  }
}

export async function markNotificationRead(id: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
    revalidatePath("/notifications");
    revalidatePath("/garage/notifications");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);
    if (error) return { error: error.message };
    revalidatePath("/notifications");
    revalidatePath("/garage/notifications");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function deleteNotification(id: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
    revalidatePath("/notifications");
    revalidatePath("/garage/notifications");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function loadNotificationById(
  id: string,
): Promise<{ item: NotificationFeedItem | null; error?: string }> {
  try {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase
      .from("notifications")
      .select(
        "id, user_id, actor_id, type, entity_type, entity_id, message, action, href, thumbnail_url, read_at, created_at",
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) return { item: null, error: error.message };
    if (!data) return { item: null };
    const [item] = await hydrateActors(supabase, [data]);
    return { item: item ?? null };
  } catch (e) {
    return {
      item: null,
      error: e instanceof Error ? e.message : "Failed.",
    };
  }
}
