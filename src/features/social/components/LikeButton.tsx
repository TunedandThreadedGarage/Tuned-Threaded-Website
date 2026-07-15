"use client";

import { useTransition } from "react";
import { toggleBuildLike } from "@/features/social/actions";

export function LikeButton({
  buildId,
  liked,
  count,
  disabled,
}: {
  buildId: string;
  liked: boolean;
  count: number;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={() => startTransition(() => void toggleBuildLike(buildId))}
      className={`text-sm transition-colors ${
        liked ? "text-accent" : "text-text-muted hover:text-text"
      } disabled:opacity-50`}
    >
      {liked ? "Liked" : "Like"} · {count}
    </button>
  );
}
