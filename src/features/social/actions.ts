"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  evaluateAndAwardBadges,
  refreshReputationCache,
} from "@/lib/garage-badges";
import { actorLabel, createNotification } from "@/lib/notify";
import { NOTIFICATION_ACTION_LABEL } from "@/features/notifications/constants";

export type ActionResult = { error?: string; success?: boolean };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return { supabase, user };
}

export async function followUser(followingId: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    if (user.id === followingId) return { error: "Cannot follow yourself." };

    const { error } = await supabase.from("follows").insert({
      follower_id: user.id,
      following_id: followingId,
    });
    if (error) return { error: error.message };

    const { data: me } = await supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", user.id)
      .single();
    const who = me?.display_name ?? me?.username ?? "Someone";

    await createNotification(supabase, {
      userId: followingId,
      actorId: user.id,
      type: "garage_follow",
      entityType: "profile",
      entityId: user.id,
      action: NOTIFICATION_ACTION_LABEL.garage_follow,
      message: `${who} started following you.`,
      href: me?.username ? `/garage/${me.username}` : "/garage",
    });

    await supabase.from("community_notifications").insert({
      user_id: followingId,
      actor_id: user.id,
      type: "follow",
      message: `${who} started following you.`,
    });

    await evaluateAndAwardBadges(supabase, followingId);
    await refreshReputationCache(supabase, followingId);
    revalidatePath("/garage");
    revalidatePath("/community");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function unfollowUser(followingId: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", followingId);
    if (error) return { error: error.message };
    revalidatePath("/garage");
    revalidatePath("/community");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function toggleBuildLike(buildId: string): Promise<ActionResult> {
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
        .single();

      if (build && build.user_id !== user.id) {
        const who = await actorLabel(supabase, user.id);
        const { data: cover } = await supabase
          .from("build_photos")
          .select("url")
          .eq("build_id", buildId)
          .order("sort_order", { ascending: true })
          .limit(1)
          .maybeSingle();
        await createNotification(supabase, {
          userId: build.user_id,
          actorId: user.id,
          type: "build_like",
          entityType: "build",
          entityId: buildId,
          action: NOTIFICATION_ACTION_LABEL.build_like,
          message: `${who} liked your build “${build.title}”.`,
          href: `/builds/${buildId}`,
          thumbnailUrl: cover?.url ?? null,
        });
      }
    }

    revalidatePath(`/garage/builds/${buildId}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function addBuildComment(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const buildId = String(formData.get("build_id") ?? "");
    const body = String(formData.get("body") ?? "").trim();
    if (!buildId || !body) return { error: "Comment cannot be empty." };

    const { error } = await supabase.from("build_comments").insert({
      build_id: buildId,
      user_id: user.id,
      body,
    });
    if (error) return { error: error.message };

    const { data: build } = await supabase
      .from("builds")
      .select("user_id, title")
      .eq("id", buildId)
      .single();

    if (build && build.user_id !== user.id) {
      const who = await actorLabel(supabase, user.id);
      await createNotification(supabase, {
        userId: build.user_id,
        actorId: user.id,
        type: "comment",
        entityType: "build",
        entityId: buildId,
        action: NOTIFICATION_ACTION_LABEL.comment,
        message: `${who} commented on “${build.title}”.`,
        href: `/builds/${buildId}`,
      });
    }

    await evaluateAndAwardBadges(supabase, user.id);
    revalidatePath(`/garage/builds/${buildId}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function markNotificationRead(id: string): Promise<ActionResult> {
  const { markNotificationRead: mark } = await import(
    "@/features/notifications/actions"
  );
  return mark(id);
}

export async function toggleTimelineLike(entryId: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { data: existing } = await supabase
      .from("timeline_entry_likes")
      .select("*")
      .eq("entry_id", entryId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("timeline_entry_likes")
        .delete()
        .eq("entry_id", entryId)
        .eq("user_id", user.id);
    } else {
      await supabase.from("timeline_entry_likes").insert({
        entry_id: entryId,
        user_id: user.id,
      });
    }
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function addTimelineComment(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const entryId = String(formData.get("entry_id") ?? "");
    const body = String(formData.get("body") ?? "").trim();
    if (!entryId || !body) return { error: "Comment cannot be empty." };

    const { error } = await supabase.from("timeline_entry_comments").insert({
      entry_id: entryId,
      user_id: user.id,
      body,
    });
    if (error) return { error: error.message };
    await evaluateAndAwardBadges(supabase, user.id);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function toggleSaveBuild(buildId: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { data: existing } = await supabase
      .from("saved_builds")
      .select("*")
      .eq("build_id", buildId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("saved_builds")
        .delete()
        .eq("build_id", buildId)
        .eq("user_id", user.id);
    } else {
      await supabase.from("saved_builds").insert({
        build_id: buildId,
        user_id: user.id,
      });
      const { data: build } = await supabase
        .from("builds")
        .select("user_id, title")
        .eq("id", buildId)
        .maybeSingle();
      if (build && build.user_id !== user.id) {
        const who = await actorLabel(supabase, user.id);
        const { data: cover } = await supabase
          .from("build_photos")
          .select("url")
          .eq("build_id", buildId)
          .order("sort_order", { ascending: true })
          .limit(1)
          .maybeSingle();
        await createNotification(supabase, {
          userId: build.user_id,
          actorId: user.id,
          type: "build_save",
          entityType: "build",
          entityId: buildId,
          action: NOTIFICATION_ACTION_LABEL.build_save,
          message: `${who} saved your build “${build.title}”.`,
          href: `/builds/${buildId}`,
          thumbnailUrl: cover?.url ?? null,
        });
      }
    }
    revalidatePath(`/garage/builds/${buildId}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}
