"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  evaluateAndAwardBadges,
  refreshReputationCache,
} from "@/lib/garage-badges";

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

    await supabase.from("notifications").insert({
      user_id: followingId,
      actor_id: user.id,
      type: "follow",
      entity_type: "profile",
      entity_id: user.id,
      message: `${me?.display_name ?? me?.username ?? "Someone"} started following you.`,
    });

    await evaluateAndAwardBadges(supabase, followingId);
    await refreshReputationCache(supabase, followingId);
    revalidatePath("/garage");
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
        const { data: me } = await supabase
          .from("profiles")
          .select("display_name, username")
          .eq("id", user.id)
          .single();
        await supabase.from("notifications").insert({
          user_id: build.user_id,
          actor_id: user.id,
          type: "like",
          entity_type: "build",
          entity_id: buildId,
          message: `${me?.display_name ?? me?.username ?? "Someone"} liked your build “${build.title}”.`,
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
      const { data: me } = await supabase
        .from("profiles")
        .select("display_name, username")
        .eq("id", user.id)
        .single();
      await supabase.from("notifications").insert({
        user_id: build.user_id,
        actor_id: user.id,
        type: "comment",
        entity_type: "build",
        entity_id: buildId,
        message: `${me?.display_name ?? me?.username ?? "Someone"} commented on “${build.title}”.`,
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
  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
    revalidatePath("/garage/notifications");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
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
    }
    revalidatePath(`/garage/builds/${buildId}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}
