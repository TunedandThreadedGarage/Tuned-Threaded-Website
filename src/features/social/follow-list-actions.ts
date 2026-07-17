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

export async function loadFollowList(input: {
  username: string;
  mode: "followers" | "following";
  q?: string;
}): Promise<{ members: FollowListMember[]; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("username", input.username.toLowerCase())
      .maybeSingle();

    if (!profile) return { members: [], error: "Garage not found." };

    const { data: follows } =
      input.mode === "followers"
        ? await supabase
            .from("follows")
            .select("follower_id")
            .eq("following_id", profile.id)
        : await supabase
            .from("follows")
            .select("following_id")
            .eq("follower_id", profile.id);

    const ids =
      input.mode === "followers"
        ? (follows ?? []).map((f) => f.follower_id)
        : (follows ?? []).map((f) => f.following_id);

    if (!ids.length) return { members: [] };

    let query = supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, skill_level")
      .in("id", ids);

    const q = input.q?.trim();
    if (q) {
      const safe = q.replace(/%/g, "").replace(/,/g, "");
      query = query.or(
        `username.ilike.%${safe}%,display_name.ilike.%${safe}%`,
      );
    }

    const { data: profiles, error } = await query;
    if (error) return { members: [], error: error.message };

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

    members.sort((a, b) =>
      (a.displayName || a.username || "").localeCompare(
        b.displayName || b.username || "",
      ),
    );

    return { members };
  } catch (e) {
    return {
      members: [],
      error: e instanceof Error ? e.message : "Failed to load list.",
    };
  }
}
