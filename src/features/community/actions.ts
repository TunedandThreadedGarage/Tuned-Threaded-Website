"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  CommunityComment,
  CommunityPost,
  CommunityPostType,
  Profile,
  Vehicle,
} from "@/types/database";
import type { CommunityTab } from "@/features/community/constants";
import { createNotification } from "@/lib/notify";
import { NOTIFICATION_ACTION_LABEL } from "@/features/notifications/constants";

export type ActionResult = { error?: string; success?: boolean; id?: string };

export type FeedAuthor = Pick<
  Profile,
  | "id"
  | "username"
  | "display_name"
  | "avatar_url"
  | "skill_level"
  | "reputation_cached"
  | "location"
>;

export type FeedVehicle = Pick<
  Vehicle,
  "id" | "year" | "make" | "model" | "trim" | "photo_url" | "nickname"
>;

export type FeedPost = CommunityPost & {
  author: FeedAuthor | null;
  vehicle: FeedVehicle | null;
  liked: boolean;
  saved: boolean;
  badgeKeys: string[];
};

export type FeedComment = CommunityComment & {
  author: FeedAuthor | null;
  liked: boolean;
  replies?: FeedComment[];
};

export type FeedBuildRef = {
  id: string;
  title: string;
  username: string | null;
};

export type FeedVehicleCard = FeedVehicle & {
  username: string | null;
  user_id: string;
};

export type CommunityNotificationRow = {
  id: string;
  type: string;
  message: string | null;
  post_id: string | null;
  read_at: string | null;
  created_at: string;
  actor: Pick<Profile, "username" | "display_name" | "avatar_url"> | null;
};

async function resolveBuildRefs(
  builds: { id: string; title: string; user_id: string }[],
): Promise<FeedBuildRef[]> {
  if (builds.length === 0) return [];
  const supabase = await createClient();
  const userIds = [...new Set(builds.map((b) => b.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", userIds);
  const map = new Map((profiles ?? []).map((p) => [p.id, p.username]));
  return builds.map((b) => ({
    id: b.id,
    title: b.title,
    username: map.get(b.user_id) ?? null,
  }));
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return { supabase, user };
}

function numOrNull(raw: string): number | null {
  if (!raw.trim()) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

async function attachAuthorsAndState(
  posts: CommunityPost[],
  userId: string | null,
): Promise<FeedPost[]> {
  if (posts.length === 0) return [];
  const supabase = await createClient();
  const userIds = [...new Set(posts.map((p) => p.user_id))];
  const vehicleIds = [
    ...new Set(posts.map((p) => p.vehicle_id).filter(Boolean) as string[]),
  ];
  const postIds = posts.map((p) => p.id);

  const [
    { data: profiles },
    { data: vehicles },
    { data: badges },
    { data: likes },
    { data: saves },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, username, display_name, avatar_url, skill_level, reputation_cached, location",
      )
      .in("id", userIds),
    vehicleIds.length
      ? supabase
          .from("vehicles")
          .select("id, year, make, model, trim, photo_url, nickname")
          .in("id", vehicleIds)
      : Promise.resolve({ data: [] as FeedVehicle[] }),
    supabase
      .from("profile_badges")
      .select("profile_id, badge_key")
      .in("profile_id", userIds),
    userId
      ? supabase
          .from("community_likes")
          .select("post_id")
          .eq("user_id", userId)
          .in("post_id", postIds)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
    userId
      ? supabase
          .from("community_saved_posts")
          .select("post_id")
          .eq("user_id", userId)
          .in("post_id", postIds)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p as FeedAuthor]));
  const vehicleMap = new Map(
    ((vehicles ?? []) as FeedVehicle[]).map((v) => [v.id, v]),
  );
  const badgeMap = new Map<string, string[]>();
  for (const row of badges ?? []) {
    const list = badgeMap.get(row.profile_id) ?? [];
    list.push(row.badge_key);
    badgeMap.set(row.profile_id, list);
  }
  const likedSet = new Set((likes ?? []).map((l) => l.post_id));
  const savedSet = new Set((saves ?? []).map((s) => s.post_id));

  return posts.map((post) => ({
    ...post,
    media_urls: post.media_urls ?? [],
    tags: post.tags ?? [],
    author: profileMap.get(post.user_id) ?? null,
    vehicle: post.vehicle_id ? vehicleMap.get(post.vehicle_id) ?? null : null,
    liked: likedSet.has(post.id),
    saved: savedSet.has(post.id),
    badgeKeys: badgeMap.get(post.user_id) ?? [],
  }));
}

export async function loadCommunityFeed(input: {
  tab: CommunityTab;
  tag?: string | null;
  cursor?: string | null;
  limit?: number;
  nearbyState?: string | null;
}): Promise<{ posts: FeedPost[]; nextCursor: string | null; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const limit = Math.min(input.limit ?? 12, 30);

    let query = supabase
      .from("community_posts")
      .select("*")
      .eq("is_public", true);

    if (input.tag) {
      query = query.contains("tags", [input.tag]);
    }

    if (input.tab === "following") {
      if (!user) return { posts: [], nextCursor: null };
      const { data: following } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);
      const ids = (following ?? []).map((f) => f.following_id);
      if (ids.length === 0) return { posts: [], nextCursor: null };
      query = query.in("user_id", ids).order("created_at", { ascending: false });
    } else if (input.tab === "trending") {
      query = query
        .order("like_count", { ascending: false })
        .order("comment_count", { ascending: false })
        .order("created_at", { ascending: false });
    } else if (input.tab === "nearby") {
      const state = input.nearbyState?.trim();
      if (state) {
        query = query.ilike("state", state);
      } else if (user) {
        const { data: me } = await supabase
          .from("profiles")
          .select("location")
          .eq("id", user.id)
          .maybeSingle();
        if (me?.location) {
          query = query.ilike("location", `%${me.location}%`);
        }
      }
      query = query.order("created_at", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    if (input.cursor) {
      query = query.lt("created_at", input.cursor);
    }

    const { data, error } = await query.limit(limit);
    if (error) return { posts: [], nextCursor: null, error: error.message };

    const rows = (data ?? []) as CommunityPost[];
    const posts = await attachAuthorsAndState(rows, user?.id ?? null);
    const nextCursor =
      rows.length === limit ? rows[rows.length - 1]?.created_at ?? null : null;
    return { posts, nextCursor };
  } catch (e) {
    return {
      posts: [],
      nextCursor: null,
      error: e instanceof Error ? e.message : "Failed to load feed.",
    };
  }
}

export async function loadTrendingBundle(): Promise<{
  topPosts: FeedPost[];
  mostCommented: FeedPost[];
  popularGarages: FeedAuthor[];
  newestBuilds: FeedBuildRef[];
  popularVehicles: FeedVehicleCard[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: likedPosts },
    { data: commentedPosts },
    { data: garages },
    { data: builds },
    { data: vehicles },
  ] = await Promise.all([
    supabase
      .from("community_posts")
      .select("*")
      .eq("is_public", true)
      .order("like_count", { ascending: false })
      .limit(5),
    supabase
      .from("community_posts")
      .select("*")
      .eq("is_public", true)
      .order("comment_count", { ascending: false })
      .limit(5),
    supabase
      .from("profiles")
      .select(
        "id, username, display_name, avatar_url, skill_level, reputation_cached, location",
      )
      .eq("onboarding_completed", true)
      .not("username", "is", null)
      .order("reputation_cached", { ascending: false })
      .limit(6),
    supabase
      .from("builds")
      .select("id, title, user_id")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("vehicles")
      .select("id, year, make, model, trim, photo_url, nickname, user_id")
      .not("photo_url", "is", null)
      .order("updated_at", { ascending: false })
      .limit(8),
  ]);

  const [topPosts, mostCommented] = await Promise.all([
    attachAuthorsAndState((likedPosts ?? []) as CommunityPost[], user?.id ?? null),
    attachAuthorsAndState(
      (commentedPosts ?? []) as CommunityPost[],
      user?.id ?? null,
    ),
  ]);

  const newestBuilds = await resolveBuildRefs(
    (builds ?? []) as { id: string; title: string; user_id: string }[],
  );

  const vehicleRows = (vehicles ?? []) as (FeedVehicle & {
    user_id: string;
  })[];
  const ownerIds = [...new Set(vehicleRows.map((v) => v.user_id))];
  const { data: owners } = ownerIds.length
    ? await supabase.from("profiles").select("id, username").in("id", ownerIds)
    : { data: [] as { id: string; username: string | null }[] };
  const ownerMap = new Map((owners ?? []).map((o) => [o.id, o.username]));
  const popularVehicles: FeedVehicleCard[] = vehicleRows.map((v) => ({
    id: v.id,
    year: v.year,
    make: v.make,
    model: v.model,
    trim: v.trim,
    photo_url: v.photo_url,
    nickname: v.nickname,
    user_id: v.user_id,
    username: ownerMap.get(v.user_id) ?? null,
  }));

  return {
    topPosts,
    mostCommented,
    popularGarages: (garages ?? []) as FeedAuthor[],
    newestBuilds,
    popularVehicles,
  };
}

export async function createCommunityPost(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const post_type = (String(formData.get("post_type") ?? "status") ||
      "status") as CommunityPostType;
    const body = String(formData.get("body") ?? "").trim();
    const title = String(formData.get("title") ?? "").trim() || null;
    if (!body && !title && !formData.getAll("media_urls").length) {
      return { error: "Add some text or media." };
    }

    const tagsRaw = String(formData.get("tags") ?? "");
    const tags = tagsRaw
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const mediaFromForm = formData
      .getAll("media_urls")
      .map(String)
      .map((u) => u.trim())
      .filter(Boolean);

    const vehicleId = String(formData.get("vehicle_id") ?? "").trim() || null;
    let manufacturer =
      String(formData.get("manufacturer") ?? "").trim() || null;
    let engine = String(formData.get("engine") ?? "").trim() || null;
    let transmission =
      String(formData.get("transmission") ?? "").trim() || null;
    let horsepower = numOrNull(String(formData.get("horsepower") ?? ""));

    if (vehicleId) {
      const { data: vehicle } = await supabase
        .from("vehicles")
        .select("make, engine, transmission, current_hp")
        .eq("id", vehicleId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (vehicle) {
        manufacturer = manufacturer || vehicle.make || null;
        engine = engine || vehicle.engine || null;
        transmission = transmission || vehicle.transmission || null;
        horsepower = horsepower ?? vehicle.current_hp ?? null;
      }
    }

    const { data, error } = await supabase
      .from("community_posts")
      .insert({
        user_id: user.id,
        post_type,
        title,
        body: body || null,
        media_urls: mediaFromForm,
        video_url: String(formData.get("video_url") ?? "").trim() || null,
        youtube_url: String(formData.get("youtube_url") ?? "").trim() || null,
        vehicle_id: vehicleId,
        tags,
        manufacturer,
        engine,
        transmission,
        horsepower,
        state: String(formData.get("state") ?? "").trim() || null,
        location: String(formData.get("location") ?? "").trim() || null,
        is_public: true,
      })
      .select("id")
      .single();

    if (error) return { error: error.message };

    // Soft community reputation badges (additive; never fails the post)
    const badgeKeys: string[] = ["beginner"];
    if (post_type === "quarter_mile" || post_type === "dyno") {
      badgeKeys.push("track_veteran");
    }
    if (post_type === "build_update" || post_type === "maintenance") {
      badgeKeys.push("fabricator");
    }
    for (const badge_key of badgeKeys) {
      try {
        await supabase.from("profile_badges").upsert(
          { profile_id: user.id, badge_key },
          { onConflict: "profile_id,badge_key", ignoreDuplicates: true },
        );
      } catch {
        // Badge catalog may not be migrated yet; ignore.
      }
    }

    revalidatePath("/community");
    return { success: true, id: data.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to post." };
  }
}

export async function toggleCommunityLike(
  postId: string,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { data: existing } = await supabase
      .from("community_likes")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("community_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);
    } else {
      await supabase.from("community_likes").insert({
        post_id: postId,
        user_id: user.id,
      });
      const { data: post } = await supabase
        .from("community_posts")
        .select("user_id, media_urls")
        .eq("id", postId)
        .maybeSingle();
      if (post && post.user_id !== user.id) {
        const { data: me } = await supabase
          .from("profiles")
          .select("username, display_name")
          .eq("id", user.id)
          .maybeSingle();
        const who = me?.display_name ?? me?.username ?? "Someone";
        const thumb = post.media_urls?.[0] ?? null;
        await supabase.from("community_notifications").insert({
          user_id: post.user_id,
          actor_id: user.id,
          type: "like",
          post_id: postId,
          message: `${who} liked your post.`,
        });
        await createNotification(supabase, {
          userId: post.user_id,
          actorId: user.id,
          type: "post_like",
          entityType: "community_post",
          entityId: postId,
          action: NOTIFICATION_ACTION_LABEL.post_like,
          message: `${who} liked your post.`,
          href: `/community?post=${postId}`,
          thumbnailUrl: thumb,
        });
      }
    }
    revalidatePath("/community");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function toggleCommunitySave(
  postId: string,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { data: existing } = await supabase
      .from("community_saved_posts")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (existing) {
      await supabase
        .from("community_saved_posts")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);
    } else {
      await supabase.from("community_saved_posts").insert({
        post_id: postId,
        user_id: user.id,
      });
    }
    revalidatePath("/community");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function addCommunityComment(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const postId = String(formData.get("post_id") ?? "");
    const body = String(formData.get("body") ?? "").trim();
    const parentId = String(formData.get("parent_id") ?? "").trim() || null;
    if (!postId || !body) return { error: "Comment required." };

    const { data, error } = await supabase
      .from("community_comments")
      .insert({
        post_id: postId,
        user_id: user.id,
        parent_id: parentId,
        body,
        image_url: String(formData.get("image_url") ?? "").trim() || null,
      })
      .select("id")
      .single();
    if (error) return { error: error.message };

    const { flagContentIfNeeded } = await import(
      "@/lib/moderation/behaviorScanner"
    );
    await flagContentIfNeeded(supabase, {
      sourceType: "comment",
      sourceId: data.id,
      userId: user.id,
      body,
    });

    const { data: post } = await supabase
      .from("community_posts")
      .select("user_id")
      .eq("id", postId)
      .maybeSingle();
    const { data: me } = await supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", user.id)
      .maybeSingle();

    const who = me?.display_name ?? me?.username ?? "Someone";
    if (post && post.user_id !== user.id) {
      const kind = parentId ? "reply" : "comment";
      await supabase.from("community_notifications").insert({
        user_id: post.user_id,
        actor_id: user.id,
        type: kind,
        post_id: postId,
        comment_id: data.id,
        message: `${who} ${parentId ? "replied to" : "commented on"} your post.`,
      });
      await createNotification(supabase, {
        userId: post.user_id,
        actorId: user.id,
        type: kind,
        entityType: "community_post",
        entityId: postId,
        action: NOTIFICATION_ACTION_LABEL[kind],
        message: `${who} ${parentId ? "replied to" : "commented on"} your post.`,
        href: `/community?post=${postId}`,
      });
    }

    if (parentId) {
      const { data: parent } = await supabase
        .from("community_comments")
        .select("user_id")
        .eq("id", parentId)
        .maybeSingle();
      if (
        parent &&
        parent.user_id !== user.id &&
        parent.user_id !== post?.user_id
      ) {
        await createNotification(supabase, {
          userId: parent.user_id,
          actorId: user.id,
          type: "reply",
          entityType: "community_post",
          entityId: postId,
          action: NOTIFICATION_ACTION_LABEL.reply,
          message: `${who} replied to your comment.`,
          href: `/community?post=${postId}`,
        });
      }
    }

    const mentionMatches = body.match(/@([a-z0-9_]+)/gi) ?? [];
    for (const raw of mentionMatches.slice(0, 5)) {
      const username = raw.slice(1).toLowerCase();
      const { data: mentioned } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();
      if (mentioned && mentioned.id !== user.id) {
        await supabase.from("community_notifications").insert({
          user_id: mentioned.id,
          actor_id: user.id,
          type: "mention",
          post_id: postId,
          comment_id: data.id,
          message: `${who} mentioned you.`,
        });
        await createNotification(supabase, {
          userId: mentioned.id,
          actorId: user.id,
          type: "mention",
          entityType: "community_post",
          entityId: postId,
          action: NOTIFICATION_ACTION_LABEL.mention,
          message: `${who} mentioned you.`,
          href: `/community?post=${postId}`,
        });
      }
    }

    revalidatePath("/community");
    return { success: true, id: data.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function loadPostComments(
  postId: string,
): Promise<{ comments: FeedComment[]; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("community_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    if (error) return { comments: [], error: error.message };

    const rows = (data ?? []) as CommunityComment[];
    if (rows.length === 0) return { comments: [] };

    const userIds = [...new Set(rows.map((c) => c.user_id))];
    const commentIds = rows.map((c) => c.id);
    const [{ data: profiles }, { data: likes }] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id, username, display_name, avatar_url, skill_level, reputation_cached, location",
        )
        .in("id", userIds),
      user
        ? supabase
            .from("community_comment_likes")
            .select("comment_id")
            .eq("user_id", user.id)
            .in("comment_id", commentIds)
        : Promise.resolve({ data: [] as { comment_id: string }[] }),
    ]);
    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.id, p as FeedAuthor]),
    );
    const likedSet = new Set((likes ?? []).map((l) => l.comment_id));

    const mapped: FeedComment[] = rows.map((c) => ({
      ...c,
      author: profileMap.get(c.user_id) ?? null,
      liked: likedSet.has(c.id),
      replies: [],
    }));

    const roots: FeedComment[] = [];
    const byId = new Map(mapped.map((c) => [c.id, c]));
    for (const c of mapped) {
      if (c.parent_id && byId.has(c.parent_id)) {
        byId.get(c.parent_id)!.replies!.push(c);
      } else {
        roots.push(c);
      }
    }
    return { comments: roots };
  } catch (e) {
    return {
      comments: [],
      error: e instanceof Error ? e.message : "Failed.",
    };
  }
}

export async function toggleCommentLike(
  commentId: string,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { data: existing } = await supabase
      .from("community_comment_likes")
      .select("*")
      .eq("comment_id", commentId)
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: comment } = await supabase
      .from("community_comments")
      .select("like_count")
      .eq("id", commentId)
      .maybeSingle();
    const current = comment?.like_count ?? 0;

    if (existing) {
      await supabase
        .from("community_comment_likes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", user.id);
      await supabase
        .from("community_comments")
        .update({ like_count: Math.max(0, current - 1) })
        .eq("id", commentId);
    } else {
      await supabase.from("community_comment_likes").insert({
        comment_id: commentId,
        user_id: user.id,
      });
      await supabase
        .from("community_comments")
        .update({ like_count: current + 1 })
        .eq("id", commentId);
    }
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function searchCommunity(q: string): Promise<{
  users: FeedAuthor[];
  vehicles: FeedVehicleCard[];
  builds: FeedBuildRef[];
  posts: FeedPost[];
}> {
  const term = q.trim();
  if (!term) {
    return { users: [], vehicles: [], builds: [], posts: [] };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const like = `%${term}%`;
  const tagKey = term.toLowerCase().replace(/\s+/g, "_");
  const hp = Number(term);
  const hpFilter = Number.isFinite(hp) && term.length <= 5;

  const [{ data: users }, { data: vehicles }, { data: builds }, postsQuery] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id, username, display_name, avatar_url, skill_level, reputation_cached, location",
        )
        .or(
          `username.ilike.${like},display_name.ilike.${like},favorite_manufacturer.ilike.${like},favorite_engine.ilike.${like},location.ilike.${like}`,
        )
        .limit(12),
      supabase
        .from("vehicles")
        .select("id, year, make, model, trim, photo_url, nickname, user_id")
        .or(
          `make.ilike.${like},model.ilike.${like},engine.ilike.${like},transmission.ilike.${like},nickname.ilike.${like}`,
        )
        .limit(12),
      supabase
        .from("builds")
        .select("id, title, user_id")
        .ilike("title", like)
        .eq("is_public", true)
        .limit(12),
      (async () => {
        let query = supabase
          .from("community_posts")
          .select("*")
          .eq("is_public", true)
          .or(
            `title.ilike.${like},body.ilike.${like},manufacturer.ilike.${like},engine.ilike.${like},transmission.ilike.${like},state.ilike.${like},location.ilike.${like}`,
          )
          .order("created_at", { ascending: false })
          .limit(12);
        if (hpFilter) {
          query = supabase
            .from("community_posts")
            .select("*")
            .eq("is_public", true)
            .eq("horsepower", hp)
            .order("created_at", { ascending: false })
            .limit(12);
        }
        const { data } = await query;
        const tagged = await supabase
          .from("community_posts")
          .select("*")
          .eq("is_public", true)
          .contains("tags", [tagKey])
          .order("created_at", { ascending: false })
          .limit(12);
        const byId = new Map<string, CommunityPost>();
        for (const row of [
          ...((data ?? []) as CommunityPost[]),
          ...((tagged.data ?? []) as CommunityPost[]),
        ]) {
          byId.set(row.id, row);
        }
        return [...byId.values()].slice(0, 12);
      })(),
    ]);

  const feedPosts = await attachAuthorsAndState(
    postsQuery,
    user?.id ?? null,
  );

  const vehicleRows = (vehicles ?? []) as (FeedVehicle & {
    user_id: string;
  })[];
  const ownerIds = [...new Set(vehicleRows.map((v) => v.user_id))];
  const { data: owners } = ownerIds.length
    ? await supabase.from("profiles").select("id, username").in("id", ownerIds)
    : { data: [] as { id: string; username: string | null }[] };
  const ownerMap = new Map((owners ?? []).map((o) => [o.id, o.username]));

  return {
    users: (users ?? []) as FeedAuthor[],
    vehicles: vehicleRows.map((v) => ({
      ...v,
      username: ownerMap.get(v.user_id) ?? null,
    })),
    builds: await resolveBuildRefs(
      (builds ?? []) as { id: string; title: string; user_id: string }[],
    ),
    posts: feedPosts,
  };
}

export async function loadCommunityNotifications(): Promise<{
  notifications: CommunityNotificationRow[];
  error?: string;
}> {
  try {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase
      .from("community_notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) return { notifications: [], error: error.message };

    const rows = data ?? [];
    const actorIds = [
      ...new Set(
        rows.map((n) => n.actor_id).filter(Boolean) as string[],
      ),
    ];
    const { data: actors } = actorIds.length
      ? await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", actorIds)
      : { data: [] as Pick<Profile, "id" | "username" | "display_name" | "avatar_url">[] };
    const actorMap = new Map((actors ?? []).map((a) => [a.id, a]));

    return {
      notifications: rows.map((n) => ({
        id: n.id,
        type: n.type,
        message: n.message,
        post_id: n.post_id,
        read_at: n.read_at,
        created_at: n.created_at,
        actor: n.actor_id
          ? {
              username: actorMap.get(n.actor_id)?.username ?? null,
              display_name: actorMap.get(n.actor_id)?.display_name ?? null,
              avatar_url: actorMap.get(n.actor_id)?.avatar_url ?? null,
            }
          : null,
      })),
    };
  } catch (e) {
    return {
      notifications: [],
      error: e instanceof Error ? e.message : "Failed.",
    };
  }
}

export async function markCommunityNotificationRead(
  id: string,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    await supabase
      .from("community_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);
    revalidatePath("/community");
    revalidatePath("/community/notifications");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function markAllCommunityNotificationsRead(): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    await supabase
      .from("community_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);
    revalidatePath("/community");
    revalidatePath("/community/notifications");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function loadPostById(
  postId: string,
): Promise<{ post: FeedPost | null; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("community_posts")
      .select("*")
      .eq("id", postId)
      .maybeSingle();
    if (error) return { post: null, error: error.message };
    if (!data) return { post: null };
    const [attached] = await attachAuthorsAndState(
      [data as CommunityPost],
      user?.id ?? null,
    );
    return { post: attached ?? null };
  } catch (e) {
    return {
      post: null,
      error: e instanceof Error ? e.message : "Failed.",
    };
  }
}

export async function getUserVehiclesForPost(): Promise<FeedVehicle[]> {
  try {
    const { supabase, user } = await requireUser();
    const { data } = await supabase
      .from("vehicles")
      .select("id, year, make, model, trim, photo_url, nickname")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    return (data ?? []) as FeedVehicle[];
  } catch {
    return [];
  }
}
