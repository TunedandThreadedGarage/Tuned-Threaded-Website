"use client";

import Image from "next/image";
import { useState } from "react";
import type { BuildPhoto, BuildVideo } from "@/types/database";
import { relativeTime } from "@/features/builds-hub/constants";

type Item =
  | { kind: "photo"; id: string; url: string; caption?: string | null; date: string }
  | { kind: "video"; id: string; url: string; caption?: string | null; date: string };

export function BuildGallery({
  photos,
  videos,
}: {
  photos: BuildPhoto[];
  videos: BuildVideo[];
}) {
  const items: Item[] = [
    ...photos.map((p) => ({
      kind: "photo" as const,
      id: p.id,
      url: p.url,
      caption: null,
      date: p.created_at,
    })),
    ...videos.map((v) => ({
      kind: "video" as const,
      id: v.id,
      url: v.url,
      caption: v.caption,
      date: v.created_at,
    })),
  ];
  const [active, setActive] = useState<Item | null>(null);

  if (items.length === 0) {
    return (
      <p className="text-sm text-text-muted">No gallery media yet.</p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {items.map((item) => (
          <button
            key={`${item.kind}-${item.id}`}
            type="button"
            onClick={() => setActive(item)}
            className="group relative aspect-square overflow-hidden border border-border bg-surface-elevated text-left transition-colors hover:border-metal/40"
          >
            {item.kind === "photo" ? (
              <Image
                src={item.url}
                alt=""
                fill
                loading="lazy"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
                  Video
                </span>
                <span className="line-clamp-2 text-center text-xs text-text-muted">
                  {item.caption || item.url}
                </span>
              </div>
            )}
          </button>
        ))}
      </div>

      {active ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-bg/90 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setActive(null)}
          />
          <div className="relative z-10 w-full max-w-4xl border border-border bg-surface p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-metal">
                {active.caption || active.kind} · {relativeTime(active.date)}
              </p>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="text-sm text-text-muted hover:text-text"
              >
                Close
              </button>
            </div>
            {active.kind === "photo" ? (
              <div className="relative aspect-video w-full overflow-hidden bg-bg">
                <Image
                  src={active.url}
                  alt=""
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              </div>
            ) : (
              <video
                src={active.url}
                controls
                className="aspect-video w-full bg-bg"
                preload="metadata"
              />
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
