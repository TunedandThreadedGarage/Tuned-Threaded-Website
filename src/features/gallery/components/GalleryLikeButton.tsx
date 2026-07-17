"use client";

import { useState, useTransition } from "react";
import { toggleGalleryPhotoLike } from "@/features/gallery/actions";

export function GalleryLikeButton({
  photoId,
  initialLiked = false,
}: {
  photoId: string;
  initialLiked?: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        start(async () => {
          const res = await toggleGalleryPhotoLike(photoId);
          if (!res.error) setLiked(res.liked);
        });
      }}
      className="bg-black/60 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-white transition-colors hover:text-accent disabled:opacity-60"
      aria-pressed={liked}
    >
      {liked ? "Liked" : "Like"}
    </button>
  );
}
