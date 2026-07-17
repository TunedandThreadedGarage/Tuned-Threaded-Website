"use server";

import { createClient } from "@/lib/supabase/server";

export type FollowListMember = {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  skillLevel: string | null;
  /** Viewer currently follows this member. */
  isFollowing: boolean;
  /** This member follows the viewer. */
  followsYou: boolean;
  /** Mutual follow relationship. */
  isMutual: boolean;
  isSelf: boolean;
};

const PAGE_SIZE = 30;

export async function loadFollowList(input: {
  username: string;
  mode: "followers" | "following";
  q?: string;
  offset?: number;
  limit?: number;
}): Promise<{
  members: FollowListMember[];
  hasMore: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const limit = Math.min(input.limit ?? PAGE_SIZE, 50);
    const offset = Math.max(0, input.offset ?? 0);

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("username", input.username.toLowerCase())
      .maybeSingle();

    if (!profile) return { members: [], hasMore: false, error: "Garage not found." };

    let ids: string[] = [];
    if (input.mode === "followers") {
      const { data: follows, error: followsError } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", profile.id);
      if (followsError) return { members: [], hasMore: false, error: followsError.message };
      ids = (follows ?? []).map((f) => f.follower_id);
    } else {
      const { data: follows, error: followsError } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", profile.id);
      if (followsError) return { members: [], hasMore: false, error: followsError.message };
      ids = (follows ?? []).map((f) => f.following_id);
    }

    if (!ids.length) return { members: [], hasMore: false };

    let query = supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, skill_level")
      .in("id", ids)
      .order("display_name", { ascending: true, nullsFirst: false })
      .range(offset, offset + limit - 1);

    const q = input.q?.trim();
    if (q) {
      const safe = q.replace(/%/g, "").replace(/,/g, "");
      query = query.or(
        `username.ilike.%${safe}%,display_name.ilike.%${safe}%`,
      );
    }

    const { data: profiles, error } = await query;
    if (error) return { members: [], hasMore: false, error: error.message };

    const memberIds = (profiles ?? []).map((p) => p.id);

    let followingSet = new Set<string>();
    let followerSet = new Set<string>();

    if (user && memberIds.length) {
      const [{ data: iFollow }, { data: theyFollow }] = await Promise.all([
        supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id)
          .in("following_id", memberIds),
        supabase
          .from("follows")
          .select("follower_id")
          .eq("following_id", user.id)
          .in("follower_id", memberIds),
      ]);
      followingSet = new Set((iFollow ?? []).map((r) => r.following_id));
      followerSet = new Set((theyFollow ?? []).map((r) => r.follower_id));
    }

    const members: FollowListMember[] = (profiles ?? []).map((p) => {
      const isSelf = user?.id === p.id;
      const isFollowing = followingSet.has(p.id);
      const followsYou = followerSet.has(p.id);
      return {
        id: p.id,
        username: p.username,
        displayName: p.display_name,
        avatarUrl: p.avatar_url,
        skillLevel: p.skill_level,
        isFollowing,
        followsYou,
        isMutual: isFollowing && followsYou,
        isSelf,
      };
    });

    return {
      members,
      hasMore: (profiles ?? []).length >= limit,
    };
  } catch (e) {
    return {
      members: [],
      hasMore: false,
      error: e instanceof Error ? e.message : "Failed to load list.",
    };
  }
}
