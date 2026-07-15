"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  Build,
  BuildComment,
  BuildGoals,
  BuildPart,
  BuildPerformance,
  BuildPhoto,
  BuildTimelineEntry,
  BuildVideo,
  Modification,
  Profile,
  Vehicle,
  VehicleDynoResult,
  VehicleQuarterMileTime,
} from "@/types/database";
import type { BuildsTab } from "@/features/builds-hub/constants";

export type ActionResult = { error?: string; success?: boolean; id?: string };

export type ShowcaseAuthor = Pick<
  Profile,
  "id" | "username" | "display_name" | "avatar_url" | "reputation_cached"
>;

export type ShowcaseVehicle = Pick<
  Vehicle,
  | "id"
  | "year"
  | "make"
  | "model"
  | "trim"
  | "photo_url"
  | "nickname"
  | "engine"
  | "current_hp"
  | "target_hp"
  | "build_stage"
>;

export type ShowcaseBuild = Build & {
  author: ShowcaseAuthor | null;
  vehicle: ShowcaseVehicle | null;
  coverUrl: string | null;
  likeCount: number;
  commentCount: number;
  followerCount: number;
  liked: boolean;
  followingBuild: boolean;
  garageFollowers: number;
};

export type ShowcaseComment = BuildComment & {
  author: ShowcaseAuthor | null;
  liked: boolean;
  replies?: ShowcaseComment[];
};

export type BuildShowcaseBundle = {
  build: ShowcaseBuild;
  photos: BuildPhoto[];
  videos: BuildVideo[];
  timeline: (BuildTimelineEntry & { liked: boolean })[];
  parts: BuildPart[];
  garageMods: Modification[];
  dyno: VehicleDynoResult[];
  quarterMile: VehicleQuarterMileTime[];
  performance: BuildPerformance[];
  goals: BuildGoals | null;
  comments: ShowcaseComment[];
  isOwner: boolean;
  followingOwner: boolean;
};

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return { supabase, user };
}

function normalizeBuild(raw: Build): Build {
  return {
    ...raw,
    progress_pct: raw.progress_pct ?? 0,
    tags: raw.tags ?? [],
    view_count: raw.view_count ?? 0,
    is_featured: raw.is_featured ?? false,
    is_staff_pick: raw.is_staff_pick ?? false,
    cover_photo_url: raw.cover_photo_url ?? null,
    labor_hours_cached: raw.labor_hours_cached ?? null,
    invested_cents_cached: raw.invested_cents_cached ?? null,
  };
}

async function notifyBuildFollowers(
  buildId: string,
  ownerId: string,
  actorId: string,
  type: string,
  message: string,
  action?: string,
  thumbnailUrl?: string | null,
) {
  const supabase = await createClient();
  const { data: followers } = await supabase
    .from("build_followers")
    .select("user_id")
    .eq("build_id", buildId);
  const targets = new Set(
    (followers ?? []).map((f) => f.user_id).filter((id) => id !== actorId),
  );
  if (ownerId !== actorId) targets.add(ownerId);
  if (targets.size === 0) return;
  const { createNotifications } = await import("@/lib/notify");
  await createNotifications(
    supabase,
    [...targets].map((userId) => ({
      userId,
      actorId,
      type,
      entityType: "build",
      entityId: buildId,
      message,
      action: action ?? null,
      href: `/builds/${buildId}`,
      thumbnailUrl: thumbnailUrl ?? null,
    })),
  );
}

async function attachShowcaseMeta(
  builds: Build[],
  userId: string | null,
): Promise<ShowcaseBuild[]> {
  if (builds.length === 0) return [];
  const supabase = await createClient();
  const buildIds = builds.map((b) => b.id);
  const userIds = [...new Set(builds.map((b) => b.user_id))];
  const vehicleIds = [
    ...new Set(builds.map((b) => b.vehicle_id).filter(Boolean) as string[]),
  ];

  const [
    { data: profiles },
    { data: vehicles },
    { data: photos },
    { data: likes },
    { data: comments },
    { data: followers },
    { data: myLikes },
    { data: myFollows },
    { data: garageFollowRows },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, reputation_cached")
      .in("id", userIds),
    vehicleIds.length
      ? supabase
          .from("vehicles")
          .select(
            "id, year, make, model, trim, photo_url, nickname, engine, current_hp, target_hp, build_stage",
          )
          .in("id", vehicleIds)
      : Promise.resolve({ data: [] as ShowcaseVehicle[] }),
    supabase
      .from("build_photos")
      .select("build_id, url, sort_order")
      .in("build_id", buildIds)
      .order("sort_order", { ascending: true }),
    supabase.from("build_likes").select("build_id").in("build_id", buildIds),
    supabase.from("build_comments").select("build_id").in("build_id", buildIds),
    supabase
      .from("build_followers")
      .select("build_id")
      .in("build_id", buildIds),
    userId
      ? supabase
          .from("build_likes")
          .select("build_id")
          .eq("user_id", userId)
          .in("build_id", buildIds)
      : Promise.resolve({ data: [] as { build_id: string }[] }),
    userId
      ? supabase
          .from("build_followers")
          .select("build_id")
          .eq("user_id", userId)
          .in("build_id", buildIds)
      : Promise.resolve({ data: [] as { build_id: string }[] }),
    supabase
      .from("follows")
      .select("following_id")
      .in("following_id", userIds),
  ]);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p as ShowcaseAuthor]),
  );
  const vehicleMap = new Map(
    ((vehicles ?? []) as ShowcaseVehicle[]).map((v) => [v.id, v]),
  );
  const coverMap = new Map<string, string>();
  for (const p of photos ?? []) {
    if (!coverMap.has(p.build_id)) coverMap.set(p.build_id, p.url);
  }
  const likeCount = new Map<string, number>();
  for (const l of likes ?? []) {
    likeCount.set(l.build_id, (likeCount.get(l.build_id) ?? 0) + 1);
  }
  const commentCount = new Map<string, number>();
  for (const c of comments ?? []) {
    commentCount.set(c.build_id, (commentCount.get(c.build_id) ?? 0) + 1);
  }
  const followerCount = new Map<string, number>();
  for (const f of followers ?? []) {
    followerCount.set(f.build_id, (followerCount.get(f.build_id) ?? 0) + 1);
  }
  const garageFollowers = new Map<string, number>();
  for (const f of garageFollowRows ?? []) {
    garageFollowers.set(
      f.following_id,
      (garageFollowers.get(f.following_id) ?? 0) + 1,
    );
  }
  const likedSet = new Set((myLikes ?? []).map((l) => l.build_id));
  const followSet = new Set((myFollows ?? []).map((f) => f.build_id));

  return builds.map((raw) => {
    const b = normalizeBuild(raw);
    return {
      ...b,
      author: profileMap.get(b.user_id) ?? null,
      vehicle: b.vehicle_id ? vehicleMap.get(b.vehicle_id) ?? null : null,
      coverUrl: b.cover_photo_url || coverMap.get(b.id) || null,
      likeCount: likeCount.get(b.id) ?? 0,
      commentCount: commentCount.get(b.id) ?? 0,
      followerCount: followerCount.get(b.id) ?? 0,
      liked: likedSet.has(b.id),
      followingBuild: followSet.has(b.id),
      garageFollowers: garageFollowers.get(b.user_id) ?? 0,
    };
  });
}

export async function loadBuildsCatalog(input: {
  tab?: BuildsTab;
  tag?: string | null;
  q?: string | null;
  limit?: number;
}): Promise<{ builds: ShowcaseBuild[]; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const limit = Math.min(input.limit ?? 24, 48);
    const tab = input.tab ?? "newest";

    let query = supabase.from("builds").select("*").eq("is_public", true);

    if (tab === "completed") query = query.eq("status", "completed");
    if (tab === "in_progress") query = query.in("status", ["active", "paused"]);
    if (input.tag) query = query.contains("tags", [input.tag]);

    if (tab === "trending" || tab === "most_liked") {
      query = query.order("updated_at", { ascending: false });
    } else if (tab === "newest") {
      query = query.order("created_at", { ascending: false });
    } else {
      query = query.order("updated_at", { ascending: false });
    }

    const { data, error } = await query.limit(limit);
    if (error) return { builds: [], error: error.message };

    let builds = await attachShowcaseMeta(
      (data ?? []) as Build[],
      user?.id ?? null,
    );

    const q = input.q?.trim().toLowerCase();
    if (q) {
      const hp = Number(q);
      builds = builds.filter((b) => {
        const hay = [
          b.title,
          b.author?.username,
          b.author?.display_name,
          b.vehicle?.make,
          b.vehicle?.model,
          b.vehicle?.engine,
          String(b.vehicle?.current_hp ?? ""),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (hay.includes(q)) return true;
        if (Number.isFinite(hp) && b.vehicle?.current_hp === hp) return true;
        return false;
      });
    }

    if (tab === "most_liked") {
      builds = [...builds].sort((a, b) => b.likeCount - a.likeCount);
    } else if (tab === "trending") {
      builds = [...builds].sort(
        (a, b) =>
          b.likeCount + b.commentCount + b.followerCount -
          (a.likeCount + a.commentCount + a.followerCount),
      );
    }

    return { builds };
  } catch (e) {
    return {
      builds: [],
      error: e instanceof Error ? e.message : "Failed to load builds.",
    };
  }
}

export async function loadFeaturedBundles(): Promise<{
  featured: ShowcaseBuild[];
  trending: ShowcaseBuild[];
  newest: ShowcaseBuild[];
  mostViewed: ShowcaseBuild[];
  staffPicks: ShowcaseBuild[];
  recentlyUpdated: ShowcaseBuild[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: featured },
    { data: newest },
    { data: mostViewed },
    { data: staff },
    { data: updated },
  ] = await Promise.all([
    supabase
      .from("builds")
      .select("*")
      .eq("is_public", true)
      .eq("is_featured", true)
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("builds")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("builds")
      .select("*")
      .eq("is_public", true)
      .order("view_count", { ascending: false })
      .limit(6),
    supabase
      .from("builds")
      .select("*")
      .eq("is_public", true)
      .eq("is_staff_pick", true)
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("builds")
      .select("*")
      .eq("is_public", true)
      .order("updated_at", { ascending: false })
      .limit(6),
  ]);

  const uid = user?.id ?? null;
  const [featuredB, newestB, viewedB, staffB, updatedB] = await Promise.all([
    attachShowcaseMeta((featured ?? []) as Build[], uid),
    attachShowcaseMeta((newest ?? []) as Build[], uid),
    attachShowcaseMeta((mostViewed ?? []) as Build[], uid),
    attachShowcaseMeta((staff ?? []) as Build[], uid),
    attachShowcaseMeta((updated ?? []) as Build[], uid),
  ]);

  const trendingPool = await attachShowcaseMeta(
    (updated ?? []) as Build[],
    uid,
  );
  const trending = [...trendingPool]
    .sort(
      (a, b) =>
        b.likeCount + b.commentCount - (a.likeCount + a.commentCount),
    )
    .slice(0, 6);

  return {
    featured: featuredB,
    trending,
    newest: newestB,
    mostViewed: viewedB,
    staffPicks: staffB,
    recentlyUpdated: updatedB,
  };
}

export async function loadBuildShowcase(
  buildId: string,
): Promise<{ bundle: BuildShowcaseBundle | null; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: raw, error } = await supabase
      .from("builds")
      .select("*")
      .eq("id", buildId)
      .maybeSingle();
    if (error) return { bundle: null, error: error.message };
    if (!raw) return { bundle: null };
    if (!raw.is_public && raw.user_id !== user?.id) {
      return { bundle: null };
    }

    const [attached] = await attachShowcaseMeta(
      [raw as Build],
      user?.id ?? null,
    );
    if (!attached) return { bundle: null };

    const [
      { data: photos },
      { data: videos },
      { data: timeline },
      { data: parts },
      { data: goals },
      { data: performance },
      { data: comments },
      { data: timelineLikes },
      modsResult,
      dynoResult,
      qmResult,
      followOwner,
    ] = await Promise.all([
      supabase
        .from("build_photos")
        .select("*")
        .eq("build_id", buildId)
        .order("sort_order"),
      supabase
        .from("build_videos")
        .select("*")
        .eq("build_id", buildId)
        .order("sort_order"),
      supabase
        .from("build_timeline_entries")
        .select("*")
        .eq("build_id", buildId)
        .order("entry_date", { ascending: false }),
      supabase
        .from("build_parts")
        .select("*")
        .eq("build_id", buildId)
        .order("priority", { ascending: false }),
      supabase
        .from("build_goals")
        .select("*")
        .eq("build_id", buildId)
        .maybeSingle(),
      supabase
        .from("build_performance")
        .select("*")
        .eq("build_id", buildId)
        .order("result_date", { ascending: false }),
      supabase
        .from("build_comments")
        .select("*")
        .eq("build_id", buildId)
        .order("created_at", { ascending: true }),
      user
        ? supabase
            .from("build_timeline_likes")
            .select("entry_id")
            .eq("user_id", user.id)
        : Promise.resolve({ data: [] as { entry_id: string }[] }),
      attached.vehicle_id
        ? supabase
            .from("modifications")
            .select("*")
            .eq("vehicle_id", attached.vehicle_id)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] as Modification[] }),
      attached.vehicle_id
        ? supabase
            .from("vehicle_dyno_results")
            .select("*")
            .eq("vehicle_id", attached.vehicle_id)
            .order("result_date", { ascending: true })
        : Promise.resolve({ data: [] as VehicleDynoResult[] }),
      attached.vehicle_id
        ? supabase
            .from("vehicle_quarter_mile_times")
            .select("*")
            .eq("vehicle_id", attached.vehicle_id)
            .order("result_date", { ascending: false })
        : Promise.resolve({ data: [] as VehicleQuarterMileTime[] }),
      user
        ? supabase
            .from("follows")
            .select("*")
            .eq("follower_id", user.id)
            .eq("following_id", attached.user_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const likedTimeline = new Set((timelineLikes ?? []).map((l) => l.entry_id));
    const commentRows = (comments ?? []) as BuildComment[];
    const commentUserIds = [...new Set(commentRows.map((c) => c.user_id))];
    const [{ data: commentProfiles }, { data: commentLikes }] =
      await Promise.all([
        commentUserIds.length
          ? supabase
              .from("profiles")
              .select(
                "id, username, display_name, avatar_url, reputation_cached",
              )
              .in("id", commentUserIds)
          : Promise.resolve({ data: [] as ShowcaseAuthor[] }),
        user && commentRows.length
          ? supabase
              .from("build_comment_likes")
              .select("comment_id")
              .eq("user_id", user.id)
              .in(
                "comment_id",
                commentRows.map((c) => c.id),
              )
          : Promise.resolve({ data: [] as { comment_id: string }[] }),
      ]);
    const authorMap = new Map(
      (commentProfiles ?? []).map((p) => [p.id, p as ShowcaseAuthor]),
    );
    const likedComments = new Set((commentLikes ?? []).map((c) => c.comment_id));
    const mapped: ShowcaseComment[] = commentRows.map((c) => ({
      ...c,
      parent_id: c.parent_id ?? null,
      image_url: c.image_url ?? null,
      like_count: c.like_count ?? 0,
      author: authorMap.get(c.user_id) ?? null,
      liked: likedComments.has(c.id),
      replies: [],
    }));
    const roots: ShowcaseComment[] = [];
    const byId = new Map(mapped.map((c) => [c.id, c]));
    for (const c of mapped) {
      if (c.parent_id && byId.has(c.parent_id)) {
        byId.get(c.parent_id)!.replies!.push(c);
      } else {
        roots.push(c);
      }
    }

    // Soft view bump (ignore errors)
    if (raw.is_public) {
      await supabase
        .from("builds")
        .update({ view_count: (raw.view_count ?? 0) + 1 })
        .eq("id", buildId);
    }

    return {
      bundle: {
        build: attached,
        photos: (photos ?? []) as BuildPhoto[],
        videos: (videos ?? []) as BuildVideo[],
        timeline: ((timeline ?? []) as BuildTimelineEntry[]).map((t) => ({
          ...t,
          photos: t.photos ?? [],
          liked: likedTimeline.has(t.id),
        })),
        parts: (parts ?? []) as BuildPart[],
        garageMods: (modsResult.data ?? []) as Modification[],
        dyno: (dynoResult.data ?? []) as VehicleDynoResult[],
        quarterMile: (qmResult.data ?? []) as VehicleQuarterMileTime[],
        performance: (performance ?? []) as BuildPerformance[],
        goals: (goals as BuildGoals | null) ?? null,
        comments: roots,
        isOwner: user?.id === attached.user_id,
        followingOwner: Boolean(followOwner.data),
      },
    };
  } catch (e) {
    return {
      bundle: null,
      error: e instanceof Error ? e.message : "Failed to load build.",
    };
  }
}

export async function toggleBuildFollow(buildId: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { data: existing } = await supabase
      .from("build_followers")
      .select("*")
      .eq("build_id", buildId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("build_followers")
        .delete()
        .eq("build_id", buildId)
        .eq("user_id", user.id);
    } else {
      await supabase.from("build_followers").insert({
        build_id: buildId,
        user_id: user.id,
      });
      const { data: build } = await supabase
        .from("builds")
        .select("user_id, title")
        .eq("id", buildId)
        .maybeSingle();
      const { data: me } = await supabase
        .from("profiles")
        .select("username, display_name")
        .eq("id", user.id)
        .maybeSingle();
      if (build && build.user_id !== user.id) {
        const { createNotification } = await import("@/lib/notify");
        const { NOTIFICATION_ACTION_LABEL } = await import(
          "@/features/notifications/constants"
        );
        const who = me?.display_name ?? me?.username ?? "Someone";
        await createNotification(supabase, {
          userId: build.user_id,
          actorId: user.id,
          type: "build_follow",
          entityType: "build",
          entityId: buildId,
          action: NOTIFICATION_ACTION_LABEL.build_follow,
          message: `${who} followed your build “${build.title}”.`,
          href: `/builds/${buildId}`,
        });
      }
    }
    revalidatePath("/builds");
    revalidatePath(`/builds/${buildId}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function toggleHubBuildLike(buildId: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { data: existing } = await supabase
      .from("build_likes")
      .select("*")
      .eq("build_id", buildId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (existing) {
      await supabase
        .from("build_likes")
        .delete()
        .eq("build_id", buildId)
        .eq("user_id", user.id);
    } else {
      await supabase.from("build_likes").insert({
        build_id: buildId,
        user_id: user.id,
      });
      const { data: build } = await supabase
        .from("builds")
        .select("user_id, title")
        .eq("id", buildId)
        .maybeSingle();
      const { data: me } = await supabase
        .from("profiles")
        .select("display_name, username")
        .eq("id", user.id)
        .maybeSingle();
      if (build && build.user_id !== user.id) {
        const { createNotification } = await import("@/lib/notify");
        const { NOTIFICATION_ACTION_LABEL } = await import(
          "@/features/notifications/constants"
        );
        const who = me?.display_name ?? me?.username ?? "Someone";
        await createNotification(supabase, {
          userId: build.user_id,
          actorId: user.id,
          type: "build_like",
          entityType: "build",
          entityId: buildId,
          action: NOTIFICATION_ACTION_LABEL.build_like,
          message: `${who} liked your build “${build.title}”.`,
          href: `/builds/${buildId}`,
        });
      }
    }
    revalidatePath("/builds");
    revalidatePath(`/builds/${buildId}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function addHubBuildComment(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const buildId = String(formData.get("build_id") ?? "");
    const body = String(formData.get("body") ?? "").trim();
    const parentId = String(formData.get("parent_id") ?? "").trim() || null;
    if (!buildId || !body) return { error: "Comment required." };

    const { data, error } = await supabase
      .from("build_comments")
      .insert({
        build_id: buildId,
        user_id: user.id,
        parent_id: parentId,
        body,
        image_url: String(formData.get("image_url") ?? "").trim() || null,
      })
      .select("id")
      .single();
    if (error) return { error: error.message };

    const { data: build } = await supabase
      .from("builds")
      .select("user_id, title")
      .eq("id", buildId)
      .maybeSingle();
    const { data: me } = await supabase
      .from("profiles")
      .select("display_name, username")
      .eq("id", user.id)
      .maybeSingle();
    const { createNotification } = await import("@/lib/notify");
    const { NOTIFICATION_ACTION_LABEL } = await import(
      "@/features/notifications/constants"
    );
    const who = me?.display_name ?? me?.username ?? "Someone";
    if (build && build.user_id !== user.id) {
      const kind = parentId ? "reply" : "comment";
      await createNotification(supabase, {
        userId: build.user_id,
        actorId: user.id,
        type: kind,
        entityType: "build",
        entityId: buildId,
        action: NOTIFICATION_ACTION_LABEL[kind],
        message: `${who} commented on “${build.title}”.`,
        href: `/builds/${buildId}`,
      });
    }

    const mentions = body.match(/@([a-z0-9_]+)/gi) ?? [];
    for (const raw of mentions.slice(0, 5)) {
      const username = raw.slice(1).toLowerCase();
      const { data: mentioned } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();
      if (mentioned && mentioned.id !== user.id) {
        await createNotification(supabase, {
          userId: mentioned.id,
          actorId: user.id,
          type: "mention",
          entityType: "build",
          entityId: buildId,
          action: NOTIFICATION_ACTION_LABEL.mention,
          message: `${who} mentioned you on a build.`,
          href: `/builds/${buildId}`,
        });
      }
    }

    revalidatePath(`/builds/${buildId}`);
    return { success: true, id: data.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function toggleHubCommentLike(
  commentId: string,
  buildId: string,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { data: existing } = await supabase
      .from("build_comment_likes")
      .select("*")
      .eq("comment_id", commentId)
      .eq("user_id", user.id)
      .maybeSingle();
    const { data: comment } = await supabase
      .from("build_comments")
      .select("like_count")
      .eq("id", commentId)
      .maybeSingle();
    const current = comment?.like_count ?? 0;
    if (existing) {
      await supabase
        .from("build_comment_likes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", user.id);
      await supabase
        .from("build_comments")
        .update({ like_count: Math.max(0, current - 1) })
        .eq("id", commentId);
    } else {
      await supabase.from("build_comment_likes").insert({
        comment_id: commentId,
        user_id: user.id,
      });
      await supabase
        .from("build_comments")
        .update({ like_count: current + 1 })
        .eq("id", commentId);
    }
    revalidatePath(`/builds/${buildId}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function toggleTimelineLike(
  entryId: string,
  buildId: string,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { data: existing } = await supabase
      .from("build_timeline_likes")
      .select("*")
      .eq("entry_id", entryId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (existing) {
      await supabase
        .from("build_timeline_likes")
        .delete()
        .eq("entry_id", entryId)
        .eq("user_id", user.id);
    } else {
      await supabase.from("build_timeline_likes").insert({
        entry_id: entryId,
        user_id: user.id,
      });
    }
    revalidatePath(`/builds/${buildId}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function addTimelineEntry(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const buildId = String(formData.get("build_id") ?? "");
    const title = String(formData.get("title") ?? "").trim();
    if (!buildId || !title) return { error: "Title required." };

    const { data: build } = await supabase
      .from("builds")
      .select("user_id, title")
      .eq("id", buildId)
      .maybeSingle();
    if (!build || build.user_id !== user.id) return { error: "Not allowed." };

    const photos = formData
      .getAll("photos")
      .map(String)
      .map((u) => u.trim())
      .filter(Boolean);

    const { data, error } = await supabase
      .from("build_timeline_entries")
      .insert({
        build_id: buildId,
        user_id: user.id,
        title,
        description: String(formData.get("description") ?? "").trim() || null,
        entry_date:
          String(formData.get("entry_date") ?? "").trim() ||
          new Date().toISOString().slice(0, 10),
        photos,
        video_url: String(formData.get("video_url") ?? "").trim() || null,
        parts_installed:
          String(formData.get("parts_installed") ?? "").trim() || null,
        cost_cents: (() => {
          const n = Number(formData.get("cost_cents") ?? "");
          return Number.isFinite(n) ? n : null;
        })(),
        hours_spent: (() => {
          const n = Number(formData.get("hours_spent") ?? "");
          return Number.isFinite(n) ? n : null;
        })(),
        stage: String(formData.get("stage") ?? "").trim() || null,
      })
      .select("id")
      .single();
    if (error) return { error: error.message };

    const { data: me } = await supabase
      .from("profiles")
      .select("display_name, username")
      .eq("id", user.id)
      .maybeSingle();
    await notifyBuildFollowers(
      buildId,
      build.user_id,
      user.id,
      "build_timeline",
      `${me?.display_name ?? me?.username ?? "Builder"} posted a timeline update on “${build.title}”.`,
    );

    revalidatePath(`/builds/${buildId}`);
    return { success: true, id: data.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function upsertBuildGoals(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const buildId = String(formData.get("build_id") ?? "");
    if (!buildId) return { error: "Build required." };
    const { data: build } = await supabase
      .from("builds")
      .select("user_id")
      .eq("id", buildId)
      .maybeSingle();
    if (!build || build.user_id !== user.id) return { error: "Not allowed." };

    const completion = Math.max(
      0,
      Math.min(100, Number(formData.get("completion_pct") ?? 0) || 0),
    );
    const { error } = await supabase.from("build_goals").upsert({
      build_id: buildId,
      user_id: user.id,
      current_goal: String(formData.get("current_goal") ?? "").trim() || null,
      next_goal: String(formData.get("next_goal") ?? "").trim() || null,
      long_term_goal:
        String(formData.get("long_term_goal") ?? "").trim() || null,
      budget_remaining_cents: (() => {
        const n = Number(formData.get("budget_remaining_cents") ?? "");
        return Number.isFinite(n) ? n : null;
      })(),
      completion_pct: completion,
    });
    if (error) return { error: error.message };
    revalidatePath(`/builds/${buildId}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function addBuildPart(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const buildId = String(formData.get("build_id") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    if (!buildId || !name) return { error: "Part name required." };
    const { data: build } = await supabase
      .from("builds")
      .select("user_id")
      .eq("id", buildId)
      .maybeSingle();
    if (!build || build.user_id !== user.id) return { error: "Not allowed." };

    const status = String(formData.get("status") ?? "installed") as
      | "installed"
      | "wishlist";
    const { error } = await supabase.from("build_parts").insert({
      build_id: buildId,
      user_id: user.id,
      name,
      brand: String(formData.get("brand") ?? "").trim() || null,
      price_cents: (() => {
        const n = Number(formData.get("price_cents") ?? "");
        return Number.isFinite(n) ? n : null;
      })(),
      purchase_url: String(formData.get("purchase_url") ?? "").trim() || null,
      install_date: String(formData.get("install_date") ?? "").trim() || null,
      status,
      priority: Number(formData.get("priority") ?? 0) || 0,
    });
    if (error) return { error: error.message };
    revalidatePath(`/builds/${buildId}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}
