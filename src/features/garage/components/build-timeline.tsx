"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Clock3,
  Wrench,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { TimelineComment, TimelineUpdate } from "@/types/garage";
import { Button } from "@/components/ui/button";

export function BuildTimeline({
  updates,
  commentsByUpdate,
}: {
  updates: TimelineUpdate[];
  commentsByUpdate?: Record<string, TimelineComment[]>;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative space-y-8">
      <div className="absolute bottom-0 left-[11px] top-2 w-px bg-border md:left-[15px]" />

      {updates.map((update, index) => (
        <motion.article
          key={update.id}
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-30px" }}
          transition={{ duration: 0.5, delay: index * 0.05 }}
          className="relative grid gap-4 pl-10 md:grid-cols-[180px_1fr] md:gap-8 md:pl-12"
        >
          <div className="absolute left-0 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-border-strong bg-background md:h-8 md:w-8">
            <span className="h-2 w-2 rounded-full bg-accent" />
          </div>

          <div className="md:pt-1">
            <p className="text-xs uppercase tracking-[0.16em] text-foreground-subtle">
              {formatDate(update.date)}
            </p>
            {(update.cost || update.timeSpentHours) && (
              <div className="mt-3 space-y-1 text-sm text-foreground-muted">
                {update.cost ? (
                  <p className="inline-flex items-center gap-1.5">
                    <Wrench className="h-3.5 w-3.5" />
                    {formatCurrency(update.cost)}
                  </p>
                ) : null}
                {update.timeSpentHours ? (
                  <p className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5" />
                    {update.timeSpentHours}h
                  </p>
                ) : null}
              </div>
            )}
          </div>

          <TimelineCard
            update={update}
            comments={commentsByUpdate?.[update.id] ?? []}
          />
        </motion.article>
      ))}
    </div>
  );
}

function TimelineCard({
  update,
  comments,
}: {
  update: TimelineUpdate;
  comments: TimelineComment[];
}) {
  const [liked, setLiked] = useState(Boolean(update.likedByViewer));
  const [saved, setSaved] = useState(Boolean(update.savedByViewer));
  const [likes, setLikes] = useState(update.likes);
  const [showComments, setShowComments] = useState(false);
  const [draft, setDraft] = useState("");
  const [localComments, setLocalComments] = useState(comments);

  return (
    <div className="premium-card overflow-hidden p-0">
      <div className="p-5 md:p-6">
        <h3 className="font-[family-name:var(--font-instrument)] text-2xl tracking-tight">
          {update.title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-foreground-muted md:text-base">
          {update.description}
        </p>

        {update.partsInstalled.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {update.partsInstalled.map((part) => (
              <span
                key={part}
                className="rounded-full border border-border bg-white/[0.03] px-3 py-1 text-xs text-foreground-muted"
              >
                {part}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {update.photos.length > 0 ? (
        <div
          className={`grid gap-1 ${update.photos.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
        >
          {update.photos.map((photo) => (
            <div key={photo} className="relative aspect-[16/10]">
              <Image
                src={photo}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ))}
        </div>
      ) : null}

      {update.videoUrl ? (
        <div className="border-t border-border px-5 py-4 md:px-6">
          <a
            href={update.videoUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-accent hover:underline"
          >
            Watch video update
          </a>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setLiked((value) => !value);
            setLikes((value) => (liked ? value - 1 : value + 1));
          }}
          className="normal-case tracking-normal"
        >
          <Heart
            className={`h-4 w-4 ${liked ? "fill-accent text-accent" : ""}`}
          />
          {likes}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowComments((value) => !value)}
          className="normal-case tracking-normal"
        >
          <MessageCircle className="h-4 w-4" />
          {localComments.length || update.comments}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setSaved((value) => !value)}
          className="normal-case tracking-normal"
        >
          <Bookmark
            className={`h-4 w-4 ${saved ? "fill-foreground text-foreground" : ""}`}
          />
          Save
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="normal-case tracking-normal"
          onClick={async () => {
            const url = typeof window !== "undefined" ? window.location.href : "";
            if (navigator.share) {
              await navigator.share({ title: update.title, url });
            } else if (navigator.clipboard) {
              await navigator.clipboard.writeText(url);
            }
          }}
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>

      {showComments ? (
        <div className="space-y-4 border-t border-border px-5 py-5 md:px-6">
          {localComments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border">
                <Image
                  src={comment.authorAvatarUrl}
                  alt={comment.authorDisplayName}
                  fill
                  className="object-cover"
                  sizes="36px"
                />
              </div>
              <div>
                <p className="text-sm text-foreground">
                  {comment.authorDisplayName}{" "}
                  <span className="text-foreground-subtle">
                    @{comment.authorUsername}
                  </span>
                </p>
                <p className="mt-1 text-sm text-foreground-muted">{comment.body}</p>
              </div>
            </div>
          ))}

          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!draft.trim()) return;
              setLocalComments((prev) => [
                ...prev,
                {
                  id: `local-${Date.now()}`,
                  updateId: update.id,
                  authorUsername: "you",
                  authorDisplayName: "You",
                  authorAvatarUrl:
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
                  body: draft.trim(),
                  createdAt: new Date().toISOString(),
                },
              ]);
              setDraft("");
            }}
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Add a comment..."
              className="h-11 flex-1 rounded-full border border-border bg-background-soft px-4 text-sm text-foreground outline-none placeholder:text-foreground-subtle focus:border-border-strong"
            />
            <Button type="submit" size="sm">
              Post
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
