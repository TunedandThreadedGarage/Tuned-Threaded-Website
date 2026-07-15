"use client";

import { useState, useTransition } from "react";
import { followUser, unfollowUser } from "@/features/social/actions";

export function FollowButton({
  followingId,
  initiallyFollowing,
}: {
  followingId: string;
  initiallyFollowing: boolean;
}) {
  const [following, setFollowing] = useState(initiallyFollowing);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          if (following) {
            await unfollowUser(followingId);
            setFollowing(false);
          } else {
            await followUser(followingId);
            setFollowing(true);
          }
        });
      }}
      className={`px-4 py-2 text-sm transition-colors ${
        following
          ? "border border-border text-text-muted hover:text-text"
          : "bg-white text-bg hover:bg-white/90"
      }`}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
