"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error?: string; success?: boolean; id?: string };

export type JournalFeedItem = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  entry_date: string;
  visibility: "public" | "private";
  status: "draft" | "published";
  category: string | null;
  media_urls: string[];
  build_id: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  liked: boolean;
  author: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  build_title: string | null;
};

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return { supabase, user };
}

function parseMedia(formData: FormData): string[] {
  const raw = String(formData.get("media_urls") ?? "").trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((u) => String(u).trim())
      .filter(Boolean)
      .slice(0, 12);
  } catch {
    return raw
      .split(/\n|,/)
      .map((u) => u.trim())
      .filter(Boolean)
      .slice(0, 12);
  }
}

export async function upsertJournalEntry(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const id = String(formData.get("id") ?? "").trim();
    const title = String(formData.get("title") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    const entry_date =
      String(formData.get("entry_date") ?? "").trim() ||
      new Date().toISOString().slice(0, 10);
    const visibility =
      String(formData.get("visibility") ?? "private") === "public"
        ? "public"
        : "private";
    const status =
      String(formData.get("status") ?? "published") === "draft"
        ? "draft"
        : "published";
    const category = String(formData.get("category") ?? "").trim() || null;
    const build_id = String(formData.get("build_id") ?? "").trim() || null;
    const media_urls = parseMedia(formData);

    if (!title) return { error: "Title is required." };

    const payload = {
      user_id: user.id,
      title,
      body: body || null,
      entry_date,
      visibility,
      status,
      category,
      build_id,
      media_urls,
    };

    if (id) {
      const { error } = await supabase
        .from("journal_entries")
        .update(payload)
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) return { error: error.message };
      const { flagContentIfNeeded } = await import(
        "@/lib/moderation/behaviorScanner"
      );
      await flagContentIfNeeded(supabase, {
        sourceType: "journal_entry",
        sourceId: id,
        userId: user.id,
        body: `${title}\n${body}`,
      });
      revalidatePath("/journal");
      return { success: true, id };
    }

    const { data, error } = await supabase
      .from("journal_entries")
      .insert(payload)
      .select("id")
      .single();
    if (error) return { error: error.message };
    const { flagContentIfNeeded } = await import(
      "@/lib/moderation/behaviorScanner"
    );
    await flagContentIfNeeded(supabase, {
      sourceType: "journal_entry",
      sourceId: data.id,
      userId: user.id,
      body: `${title}\n${body}`,
    });
    revalidatePath("/journal");
    return { success: true, id: data.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function deleteJournalHubEntry(id: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from("journal_entries")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
    revalidatePath("/journal");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function toggleJournalLike(journalId: string): Promise<{
  liked: boolean;
  likeCount: number;
  error?: string;
}> {
  try {
    const { supabase, user } = await requireUser();
    const { data: existing } = await supabase
      .from("journal_likes")
      .select("journal_id")
      .eq("journal_id", journalId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("journal_likes")
        .delete()
        .eq("journal_id", journalId)
        .eq("user_id", user.id);
    } else {
      await supabase.from("journal_likes").insert({
        journal_id: journalId,
        user_id: user.id,
      });
    }

    const { count } = await supabase
      .from("journal_likes")
      .select("*", { count: "exact", head: true })
      .eq("journal_id", journalId);

    revalidatePath("/journal");
    return { liked: !existing, likeCount: count ?? 0 };
  } catch (e) {
    return {
      liked: false,
      likeCount: 0,
      error: e instanceof Error ? e.message : "Failed.",
    };
  }
}

export async function addJournalComment(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const journal_id = String(formData.get("journal_id") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    if (!journal_id || !body) return { error: "Comment required." };

    const { data: inserted, error } = await supabase
      .from("journal_comments")
      .insert({
        journal_id,
        user_id: user.id,
        body,
      })
      .select("id")
      .single();
    if (error) return { error: error.message };

    const { flagContentIfNeeded } = await import(
      "@/lib/moderation/behaviorScanner"
    );
    await flagContentIfNeeded(supabase, {
      sourceType: "comment",
      sourceId: inserted.id,
      userId: user.id,
      body,
    });

    revalidatePath("/journal");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function loadJournalFeed(input?: {
  q?: string;
  category?: string;
  scope?: "public" | "mine" | "drafts";
}): Promise<{ items: JournalFeedItem[]; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const scope = input?.scope ?? "public";
    let query = supabase
      .from("journal_entries")
      .select("*")
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(60);

    if (scope === "mine") {
      if (!user) return { items: [], error: "Sign in to view your journal." };
      query = query.eq("user_id", user.id).eq("status", "published");
    } else if (scope === "drafts") {
      if (!user) return { items: [], error: "Sign in to view drafts." };
      query = query.eq("user_id", user.id).eq("status", "draft");
    } else {
      query = query.eq("visibility", "public").eq("status", "published");
    }

    if (input?.category) {
      query = query.eq("category", input.category);
    }
    if (input?.q) {
      const q = input.q.replace(/%/g, "");
      query = query.or(`title.ilike.%${q}%,body.ilike.%${q}%`);
    }

    const { data: rows, error } = await query;
    if (error) return { items: [], error: error.message };

    const entries = rows ?? [];
    const userIds = [...new Set(entries.map((e) => e.user_id))];
    const buildIds = [
      ...new Set(entries.map((e) => e.build_id).filter(Boolean)),
    ] as string[];

    const [{ data: profiles }, { data: builds }, { data: likes }] =
      await Promise.all([
        userIds.length
          ? supabase
              .from("profiles")
              .select("id, username, display_name, avatar_url")
              .in("id", userIds)
          : Promise.resolve({ data: [] as never[] }),
        buildIds.length
          ? supabase.from("builds").select("id, title").in("id", buildIds)
          : Promise.resolve({ data: [] as never[] }),
        user && entries.length
          ? supabase
              .from("journal_likes")
              .select("journal_id")
              .eq("user_id", user.id)
              .in(
                "journal_id",
                entries.map((e) => e.id),
              )
          : Promise.resolve({ data: [] as { journal_id: string }[] }),
      ]);

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.id, p] as const),
    );
    const buildMap = new Map((builds ?? []).map((b) => [b.id, b] as const));
    const likedSet = new Set((likes ?? []).map((l) => l.journal_id));

    const items: JournalFeedItem[] = entries.map((e) => {
      const author = profileMap.get(e.user_id);
      return {
        id: e.id,
        user_id: e.user_id,
        title: e.title,
        body: e.body,
        entry_date: e.entry_date,
        visibility: (e.visibility as "public" | "private") ?? "private",
        status: (e.status as "draft" | "published") ?? "published",
        category: e.category ?? null,
        media_urls: Array.isArray(e.media_urls) ? e.media_urls : [],
        build_id: e.build_id ?? null,
        like_count: e.like_count ?? 0,
        comment_count: e.comment_count ?? 0,
        created_at: e.created_at,
        updated_at: e.updated_at,
        liked: likedSet.has(e.id),
        author: author
          ? {
              username: author.username,
              display_name: author.display_name,
              avatar_url: author.avatar_url,
            }
          : null,
        build_title: e.build_id
          ? (buildMap.get(e.build_id)?.title ?? null)
          : null,
      };
    });

    return { items };
  } catch (e) {
    return {
      items: [],
      error: e instanceof Error ? e.message : "Failed to load journal.",
    };
  }
}

export async function loadJournalComments(journalId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("journal_comments")
    .select("id, body, created_at, user_id")
    .eq("journal_id", journalId)
    .order("created_at", { ascending: true });

  const comments = data ?? [];
  const userIds = [...new Set(comments.map((c) => c.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", userIds)
    : { data: [] };

  const map = new Map((profiles ?? []).map((p) => [p.id, p] as const));
  return comments.map((c) => ({
    ...c,
    author: map.get(c.user_id) ?? null,
  }));
}
