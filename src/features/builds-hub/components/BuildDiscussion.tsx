"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Avatar } from "@/components/garage-profile/Avatar";
import { MediaUpload } from "@/components/media/MediaUpload";
import {
  addHubBuildComment,
  toggleHubCommentLike,
  type ShowcaseComment,
} from "@/features/builds-hub/actions";
import {
  GIF_PLACEHOLDERS,
  relativeTime,
} from "@/features/builds-hub/constants";
import { createClient } from "@/lib/supabase/client";

function CommentNode({
  comment,
  buildId,
  depth = 0,
  onPosted,
}: {
  comment: ShowcaseComment;
  buildId: string;
  depth?: number;
  onPosted: () => void;
}) {
  const [liked, setLiked] = useState(comment.liked);
  const [likes, setLikes] = useState(comment.like_count);
  const [replyOpen, setReplyOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className={depth > 0 ? "ml-8 border-l border-border pl-4" : ""}>
      <div className="flex gap-3 py-3">
        <Avatar
          url={comment.author?.avatar_url}
          name={comment.author?.display_name ?? comment.author?.username}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={
                comment.author?.username
                  ? `/garage/${comment.author.username}`
                  : "#"
              }
              className="text-sm font-medium text-text hover:underline"
            >
              {comment.author?.display_name ?? "Member"}
            </Link>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-metal">
              {relativeTime(comment.created_at)}
            </span>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-text-muted">
            {comment.body}
          </p>
          {comment.image_url ? (
            <div className="relative mt-2 aspect-video max-w-xs overflow-hidden border border-border">
              {comment.image_url.startsWith("data:") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={comment.image_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <Image
                  src={comment.image_url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="320px"
                />
              )}
            </div>
          ) : null}
          <div className="mt-2 flex gap-4">
            <button
              type="button"
              disabled={pending}
              className={`text-xs ${liked ? "text-accent" : "text-text-muted hover:text-text"}`}
              onClick={() =>
                start(async () => {
                  const res = await toggleHubCommentLike(comment.id, buildId);
                  if (!res.error) {
                    setLiked((v) => !v);
                    setLikes((n) => (liked ? Math.max(0, n - 1) : n + 1));
                  }
                })
              }
            >
              Like {likes || ""}
            </button>
            <button
              type="button"
              className="text-xs text-text-muted hover:text-text"
              onClick={() => setReplyOpen((v) => !v)}
            >
              Reply
            </button>
          </div>
          {replyOpen ? (
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                start(async () => {
                  const res = await addHubBuildComment({}, fd);
                  if (res.error) {
                    setError(res.error);
                    return;
                  }
                  setReplyOpen(false);
                  onPosted();
                });
              }}
            >
              <input type="hidden" name="build_id" value={buildId} />
              <input type="hidden" name="parent_id" value={comment.id} />
              <input
                name="body"
                required
                placeholder={`Reply${comment.author?.username ? ` @${comment.author.username}` : ""}…`}
                className="flex-1 border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-metal/50"
              />
              <button
                type="submit"
                className="border border-border px-3 py-2 text-xs text-text hover:border-metal/40"
              >
                Send
              </button>
              {error ? <p className="text-xs text-accent">{error}</p> : null}
            </form>
          ) : null}
        </div>
      </div>
      {comment.replies?.map((r) => (
        <CommentNode
          key={r.id}
          comment={r}
          buildId={buildId}
          depth={depth + 1}
          onPosted={onPosted}
        />
      ))}
    </div>
  );
}

export function BuildDiscussion({
  buildId,
  comments,
  signedIn,
  onRefresh,
}: {
  buildId: string;
  comments: ShowcaseComment[];
  signedIn: boolean;
  onRefresh: () => void;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [gifOpen, setGifOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    void createClient()
      .auth.getUser()
      .then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  return (
    <div className="space-y-4">
      {comments.length === 0 ? (
        <p className="text-sm text-text-muted">Start the discussion.</p>
      ) : (
        comments.map((c) => (
          <CommentNode
            key={c.id}
            comment={c}
            buildId={buildId}
            onPosted={onRefresh}
          />
        ))
      )}

      {signedIn ? (
        <form
          className="space-y-2 border-t border-border pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            start(async () => {
              const res = await addHubBuildComment({}, fd);
              if (res.error) {
                setError(res.error);
                return;
              }
              setImageUrl(null);
              e.currentTarget.reset();
              onRefresh();
            });
          }}
        >
          <input type="hidden" name="build_id" value={buildId} />
          {imageUrl ? (
            <input type="hidden" name="image_url" value={imageUrl} />
          ) : null}
          <textarea
            name="body"
            required
            rows={3}
            placeholder="Join the discussion… use @username to mention"
            className="w-full border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-metal/50"
          />
          {userId ? (
            <MediaUpload
              bucket="builds"
              pathPrefix={`${userId}/builds/comments`}
              accept="image"
              multiple={false}
              maxFiles={1}
              label="Attach image"
              variant="compact"
              onUploaded={(files) => {
                if (files[0]) setImageUrl(files[0].publicUrl);
              }}
            />
          ) : null}
          {gifOpen ? (
            <div className="flex flex-wrap gap-2">
              {GIF_PLACEHOLDERS.map((g) => (
                <button
                  key={g.label}
                  type="button"
                  onClick={() => {
                    setImageUrl(g.url);
                    setGifOpen(false);
                  }}
                  className="border border-border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-metal hover:border-accent hover:text-text"
                >
                  {g.label}
                </button>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              className="font-mono text-[10px] uppercase tracking-[0.12em] text-metal hover:text-text"
              onClick={() => setGifOpen((v) => !v)}
            >
              GIF
            </button>
            <button
              type="submit"
              disabled={pending}
              className="border border-border px-4 py-2 text-xs text-text hover:border-metal/40"
            >
              Comment
            </button>
          </div>
          {error ? <p className="text-xs text-accent">{error}</p> : null}
        </form>
      ) : (
        <p className="text-sm text-text-muted">
          <Link href="/garage/sign-in" className="underline">
            Sign in
          </Link>{" "}
          to comment.
        </p>
      )}
    </div>
  );
}
