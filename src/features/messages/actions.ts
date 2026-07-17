"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notify";
import { actorLabel } from "@/lib/notify";
import { flagContentIfNeeded } from "@/lib/moderation/behaviorScanner";
import type { DmConversationStatus, DmMessage } from "@/types/database";

export type ActionResult = {
  error?: string;
  success?: boolean;
  id?: string;
};

export type ConversationListItem = {
  id: string;
  status: DmConversationStatus;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  peer: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  };
  unread: boolean;
  peerLastReadAt: string | null;
};

export type ThreadMessage = DmMessage & {
  seen: boolean;
};

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return { supabase, user };
}

async function areMutual(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  a: string,
  b: string,
) {
  const [{ data: ab }, { data: ba }] = await Promise.all([
    supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", a)
      .eq("following_id", b)
      .maybeSingle(),
    supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", b)
      .eq("following_id", a)
      .maybeSingle(),
  ]);
  return Boolean(ab) && Boolean(ba);
}

async function isBlocked(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  a: string,
  b: string,
) {
  const [{ data: ab }, { data: ba }] = await Promise.all([
    supabase
      .from("user_blocks")
      .select("blocker_id")
      .eq("blocker_id", a)
      .eq("blocked_id", b)
      .maybeSingle(),
    supabase
      .from("user_blocks")
      .select("blocker_id")
      .eq("blocker_id", b)
      .eq("blocked_id", a)
      .maybeSingle(),
  ]);
  return Boolean(ab || ba);
}

async function findExistingConversation(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  peerId: string,
) {
  const { data: mine } = await supabase
    .from("dm_participants")
    .select("conversation_id")
    .eq("user_id", userId);
  const myIds = (mine ?? []).map(
    (r: { conversation_id: string }) => r.conversation_id,
  );
  if (!myIds.length) return null;

  const { data: peer } = await supabase
    .from("dm_participants")
    .select("conversation_id")
    .eq("user_id", peerId)
    .in("conversation_id", myIds)
    .limit(1)
    .maybeSingle();

  return peer?.conversation_id ?? null;
}

export async function startConversation(
  peerUserId: string,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    if (peerUserId === user.id) return { error: "Cannot message yourself." };

    if (await isBlocked(supabase, user.id, peerUserId)) {
      return { error: "Messaging is unavailable with this user." };
    }

    const { data: prefs } = await supabase
      .from("communication_settings")
      .select("allow_messages_from")
      .eq("user_id", peerUserId)
      .maybeSingle();

    const allow = prefs?.allow_messages_from ?? "everyone";
    if (allow === "none") {
      return { error: "This user is not accepting messages." };
    }
    if (allow === "followers") {
      const { data: followsPeer } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", user.id)
        .eq("following_id", peerUserId)
        .maybeSingle();
      if (!followsPeer) {
        return { error: "Only followers can message this user." };
      }
    }

    const existing = await findExistingConversation(
      supabase,
      user.id,
      peerUserId,
    );
    if (existing) {
      await supabase
        .from("dm_participants")
        .update({ deleted_at: null })
        .eq("conversation_id", existing)
        .eq("user_id", user.id);
      return { success: true, id: existing };
    }

    const mutual = await areMutual(supabase, user.id, peerUserId);
    const status: DmConversationStatus = mutual ? "inbox" : "request";

    const { data: conv, error: convErr } = await supabase
      .from("dm_conversations")
      .insert({ status })
      .select("id")
      .single();
    if (convErr || !conv) return { error: convErr?.message ?? "Failed." };

    const { error: partErr } = await supabase.from("dm_participants").insert([
      { conversation_id: conv.id, user_id: user.id },
      { conversation_id: conv.id, user_id: peerUserId },
    ]);
    if (partErr) return { error: partErr.message };

    revalidatePath("/messages");
    return { success: true, id: conv.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

async function enrichConversations(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  rows: {
    conversation_id: string;
    last_read_at: string | null;
    dm_conversations: {
      id: string;
      status: DmConversationStatus;
      last_message_at: string | null;
      last_message_preview: string | null;
    } | null;
  }[],
): Promise<ConversationListItem[]> {
  const convIds = rows
    .map((r) => r.dm_conversations?.id)
    .filter(Boolean) as string[];
  if (!convIds.length) return [];

  const { data: peers } = await supabase
    .from("dm_participants")
    .select("conversation_id, user_id, last_read_at")
    .in("conversation_id", convIds)
    .neq("user_id", userId);

  const peerByConv = new Map<
    string,
    { user_id: string; last_read_at: string | null }
  >();
  for (const p of peers ?? []) {
    peerByConv.set(p.conversation_id, {
      user_id: p.user_id,
      last_read_at: p.last_read_at,
    });
  }

  const peerIds = [...new Set([...(peers ?? [])].map((p) => p.user_id))];
  type PeerProfile = {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  const { data: profiles } = peerIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", peerIds)
    : { data: [] as PeerProfile[] };

  const profileMap = new Map<string, PeerProfile>(
    ((profiles ?? []) as PeerProfile[]).map((p) => [p.id, p]),
  );

  const items: ConversationListItem[] = [];
  for (const row of rows) {
    const conv = row.dm_conversations;
    if (!conv) continue;
    const peerMeta = peerByConv.get(conv.id);
    if (!peerMeta) continue;
    const profile = profileMap.get(peerMeta.user_id);
    if (!profile) continue;
    const unread = Boolean(
      conv.last_message_at &&
        (!row.last_read_at ||
          new Date(conv.last_message_at) > new Date(row.last_read_at)),
    );
    items.push({
      id: conv.id,
      status: conv.status,
      lastMessageAt: conv.last_message_at,
      lastMessagePreview: conv.last_message_preview,
      peer: {
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
      },
      unread,
      peerLastReadAt: peerMeta.last_read_at,
    });
  }

  items.sort((a, b) => {
    const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return bt - at;
  });

  return items;
}

function normalizeConv(
  raw: unknown,
): {
  id: string;
  status: DmConversationStatus;
  last_message_at: string | null;
  last_message_preview: string | null;
} | null {
  if (!raw) return null;
  const row = Array.isArray(raw) ? raw[0] : raw;
  if (!row || typeof row !== "object") return null;
  const c = row as {
    id: string;
    status: DmConversationStatus;
    last_message_at: string | null;
    last_message_preview: string | null;
  };
  if (!c.id) return null;
  return c;
}

export async function loadInbox(q?: string): Promise<{
  items: ConversationListItem[];
  error?: string;
}> {
  try {
    const { supabase, user } = await requireUser();
    const { data: parts, error } = await supabase
      .from("dm_participants")
      .select(
        "conversation_id, last_read_at, dm_conversations(id, status, last_message_at, last_message_preview)",
      )
      .eq("user_id", user.id)
      .is("deleted_at", null);

    if (error) return { items: [], error: error.message };

    const inboxRows = (parts ?? [])
      .map((p) => ({
        conversation_id: p.conversation_id as string,
        last_read_at: p.last_read_at as string | null,
        dm_conversations: normalizeConv(p.dm_conversations),
      }))
      .filter((p) => p.dm_conversations?.status === "inbox");

    let items = await enrichConversations(supabase, user.id, inboxRows);
    const query = q?.trim().toLowerCase();
    if (query) {
      items = items.filter(
        (i) =>
          i.peer.username?.toLowerCase().includes(query) ||
          i.peer.displayName?.toLowerCase().includes(query) ||
          i.lastMessagePreview?.toLowerCase().includes(query),
      );
    }
    return { items };
  } catch (e) {
    return {
      items: [],
      error: e instanceof Error ? e.message : "Failed.",
    };
  }
}

export async function loadMessageRequests(): Promise<{
  items: ConversationListItem[];
  error?: string;
}> {
  try {
    const { supabase, user } = await requireUser();
    const { data: parts, error } = await supabase
      .from("dm_participants")
      .select(
        "conversation_id, last_read_at, dm_conversations(id, status, last_message_at, last_message_preview)",
      )
      .eq("user_id", user.id)
      .is("deleted_at", null);

    if (error) return { items: [], error: error.message };

    const requestRows = (parts ?? [])
      .map((p) => ({
        conversation_id: p.conversation_id as string,
        last_read_at: p.last_read_at as string | null,
        dm_conversations: normalizeConv(p.dm_conversations),
      }))
      .filter((p) => p.dm_conversations?.status === "request");

    const items = await enrichConversations(supabase, user.id, requestRows);
    return { items };
  } catch (e) {
    return {
      items: [],
      error: e instanceof Error ? e.message : "Failed.",
    };
  }
}

export async function loadThread(
  conversationId: string,
  cursor?: string | null,
): Promise<{
  messages: ThreadMessage[];
  peerLastReadAt: string | null;
  status: DmConversationStatus | null;
  peer: ConversationListItem["peer"] | null;
  nextCursor: string | null;
  error?: string;
}> {
  try {
    const { supabase, user } = await requireUser();
    const { data: part } = await supabase
      .from("dm_participants")
      .select("conversation_id, deleted_at")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!part || part.deleted_at) {
      return {
        messages: [],
        peerLastReadAt: null,
        status: null,
        peer: null,
        nextCursor: null,
        error: "Conversation not found.",
      };
    }

    const { data: conv } = await supabase
      .from("dm_conversations")
      .select("status")
      .eq("id", conversationId)
      .single();

    const { data: peerPart } = await supabase
      .from("dm_participants")
      .select("user_id, last_read_at")
      .eq("conversation_id", conversationId)
      .neq("user_id", user.id)
      .maybeSingle();

    let peer: ConversationListItem["peer"] | null = null;
    if (peerPart) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .eq("id", peerPart.user_id)
        .maybeSingle();
      if (profile) {
        peer = {
          id: profile.id,
          username: profile.username,
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url,
        };
      }
    }

    let query = supabase
      .from("dm_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(40);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: rows, error } = await query;
    if (error) {
      return {
        messages: [],
        peerLastReadAt: null,
        status: null,
        peer: null,
        nextCursor: null,
        error: error.message,
      };
    }

    const peerRead = peerPart?.last_read_at
      ? new Date(peerPart.last_read_at).getTime()
      : 0;
    const messages: ThreadMessage[] = (rows ?? []).map((m) => ({
      ...m,
      seen:
        m.sender_id === user.id &&
        peerRead > 0 &&
        new Date(m.created_at).getTime() <= peerRead,
    }));

    const nextCursor =
      (rows ?? []).length >= 40
        ? (rows![rows!.length - 1]?.created_at ?? null)
        : null;

    return {
      messages: messages.reverse(),
      peerLastReadAt: peerPart?.last_read_at ?? null,
      status: (conv?.status as DmConversationStatus) ?? null,
      peer,
      nextCursor,
    };
  } catch (e) {
    return {
      messages: [],
      peerLastReadAt: null,
      status: null,
      peer: null,
      nextCursor: null,
      error: e instanceof Error ? e.message : "Failed.",
    };
  }
}

export async function sendMessage(input: {
  conversationId: string;
  body: string;
  imageUrl?: string | null;
}): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const body = input.body.trim();
    const imageUrl = input.imageUrl?.trim() || null;
    if (!body && !imageUrl) return { error: "Message cannot be empty." };

    const { data: part } = await supabase
      .from("dm_participants")
      .select("conversation_id")
      .eq("conversation_id", input.conversationId)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .maybeSingle();
    if (!part) return { error: "Conversation not found." };

    const { data: conv } = await supabase
      .from("dm_conversations")
      .select("status")
      .eq("id", input.conversationId)
      .single();
    if (conv?.status === "declined") {
      return { error: "This conversation was declined." };
    }

    const { data: peerPart } = await supabase
      .from("dm_participants")
      .select("user_id")
      .eq("conversation_id", input.conversationId)
      .neq("user_id", user.id)
      .maybeSingle();

    if (peerPart && (await isBlocked(supabase, user.id, peerPart.user_id))) {
      return { error: "Messaging is unavailable with this user." };
    }

    // Spam: count identical recent messages
    let recentIdentical = 0;
    if (body) {
      const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: recent } = await supabase
        .from("dm_messages")
        .select("body")
        .eq("sender_id", user.id)
        .eq("body", body)
        .gte("created_at", since);
      recentIdentical = (recent ?? []).length;
    }

    const { count: flagCount } = await supabase
      .from("moderation_flags")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "open")
      .gte(
        "created_at",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      );

    const { data: msg, error } = await supabase
      .from("dm_messages")
      .insert({
        conversation_id: input.conversationId,
        sender_id: user.id,
        body: body || "",
        image_url: imageUrl,
      })
      .select("id")
      .single();
    if (error || !msg) return { error: error?.message ?? "Failed." };

    const preview = body
      ? body.slice(0, 120)
      : imageUrl
        ? "Sent a photo"
        : "";

    await supabase
      .from("dm_conversations")
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: preview,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.conversationId);

    await supabase
      .from("dm_participants")
      .update({ last_read_at: new Date().toISOString(), deleted_at: null })
      .eq("conversation_id", input.conversationId)
      .eq("user_id", user.id);

    if (peerPart) {
      await supabase
        .from("dm_participants")
        .update({ deleted_at: null })
        .eq("conversation_id", input.conversationId)
        .eq("user_id", peerPart.user_id);
    }

    await flagContentIfNeeded(supabase, {
      sourceType: "dm_message",
      sourceId: msg.id,
      userId: user.id,
      body,
      recentIdenticalCount: recentIdentical,
      recentFlagCount: flagCount ?? 0,
    });

    if (peerPart) {
      const name = await actorLabel(supabase, user.id);
      const isRequest = conv?.status === "request";
      await createNotification(supabase, {
        userId: peerPart.user_id,
        actorId: user.id,
        type: isRequest ? "message_request" : "message",
        message: isRequest
          ? `${name} sent you a message request`
          : `${name} sent you a message`,
        action: isRequest ? "Review request" : "Open conversation",
        entityType: "dm_conversation",
        entityId: input.conversationId,
        href: isRequest
          ? "/messages/requests"
          : `/messages/${input.conversationId}`,
      });
    }

    revalidatePath("/messages");
    revalidatePath(`/messages/${input.conversationId}`);
    return { success: true, id: msg.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function markConversationRead(
  conversationId: string,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from("dm_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function deleteConversation(
  conversationId: string,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from("dm_participants")
      .update({ deleted_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
    revalidatePath("/messages");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function acceptMessageRequest(
  conversationId: string,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { data: part } = await supabase
      .from("dm_participants")
      .select("conversation_id")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!part) return { error: "Not found." };

    const { error } = await supabase
      .from("dm_conversations")
      .update({ status: "inbox", updated_at: new Date().toISOString() })
      .eq("id", conversationId)
      .eq("status", "request");
    if (error) return { error: error.message };
    revalidatePath("/messages");
    revalidatePath("/messages/requests");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function declineMessageRequest(
  conversationId: string,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from("dm_conversations")
      .update({ status: "declined", updated_at: new Date().toISOString() })
      .eq("id", conversationId)
      .eq("status", "request");
    if (error) return { error: error.message };

    await supabase
      .from("dm_participants")
      .update({ deleted_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id);

    revalidatePath("/messages/requests");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function blockUser(blockedId: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    if (blockedId === user.id) return { error: "Cannot block yourself." };
    const { error } = await supabase.from("user_blocks").upsert({
      blocker_id: user.id,
      blocked_id: blockedId,
    });
    if (error) return { error: error.message };

    // Soft-delete shared conversations for blocker
    const existing = await findExistingConversation(
      supabase,
      user.id,
      blockedId,
    );
    if (existing) {
      await supabase
        .from("dm_participants")
        .update({ deleted_at: new Date().toISOString() })
        .eq("conversation_id", existing)
        .eq("user_id", user.id);
      await supabase
        .from("dm_conversations")
        .update({ status: "declined" })
        .eq("id", existing);
    }

    revalidatePath("/messages");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function unblockUser(blockedId: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from("user_blocks")
      .delete()
      .eq("blocker_id", user.id)
      .eq("blocked_id", blockedId);
    if (error) return { error: error.message };
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}
