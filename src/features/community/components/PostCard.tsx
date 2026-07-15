"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useActionState } from "react";
import { Avatar } from "@/components/garage-profile/Avatar";
import { BadgeRow } from "@/components/garage-profile/BadgeRow";
import { SkillBadge } from "@/components/garage-profile/SkillBadge";
import { createClient } from "@/lib/supabase/client";
import {
  addCommunityComment,
  loadPostComments,
  toggleCommentLike,
  toggleCommunityLike,
  toggleCommunitySave,
  type FeedComment,
  type FeedPost,
} from "@/features/community/actions";
import {
  GIF_PLACEHOLDERS,
  POST_TYPE_LABELS,
  relativeTime,
  reputationBand,
  youtubeEmbedId,
} from "@/features/community/constants";

function IconHeart({ filled }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        d="M12 20s-7-4.4-9.2-8.2C1.2 9 2.4 5.8 5.5 5.2c1.8-.4 3.5.4 4.5 1.7C11 5.6 12.7 4.8 14.5 5.2c3.1.6 4.3 3.8 2.7 6.6C19 15.6 12 20 12 20Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function IconComment() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <path
        d="M5 6.5h14v9.2H9.2L5 19.5V6.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function IconShare() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <path
        d="M8 12h8M14 8l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M5 5.5h6.5M5 18.5h6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconSave({ filled }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        d="M7 4.5h10v15l-5-3.2L7 19.5v-15Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function MediaThumb({ src, alt = "" }: { src: string; alt?: string }) {
  if (src.startsWith("data:")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className="h-full w-full object-cover" />;
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      loading="lazy"
      className="object-cover"
      sizes="(max-width: 768px) 100vw, 50vw"
    />
  );
}

function CommentNode({
  comment,
  postId,
  depth = 0,
  onPosted,
}: {
  comment: FeedComment;
  postId: string;
  depth?: number;
  onPosted?: () => void;
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
              <MediaThumb src={comment.image_url} />
            </div>
          ) : null}
          <div className="mt-2 flex gap-4">
            <button
              type="button"
              disabled={pending}
              className={`inline-flex items-center gap-1.5 text-xs ${
                liked ? "text-accent" : "text-text-muted hover:text-text"
              }`}
              onClick={() =>
                start(async () => {
                  const res = await toggleCommentLike(comment.id);
                  if (!res.error) {
                    setLiked((v) => !v);
                    setLikes((n) => (liked ? Math.max(0, n - 1) : n + 1));
                  }
                })
              }
            >
              <IconHeart filled={liked} />
              {likes || ""}
            </button>
            <button
              type="button"
              className="text-xs text-text-muted hover:text-text"
              onClick={() => {
                setError(null);
                setReplyOpen((v) => !v);
              }}
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
                  const res = await addCommunityComment({}, fd);
                  if (res.error) {
                    setError(res.error);
                    return;
                  }
                  setReplyOpen(false);
                  setError(null);
                  onPosted?.();
                });
              }}
            >
              <input type="hidden" name="post_id" value={postId} />
              <input type="hidden" name="parent_id" value={comment.id} />
              <input
                name="body"
                required
                placeholder={`Reply${comment.author?.username ? ` @${comment.author.username}` : ""}…`}
                className="flex-1 border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-metal/50"
              />
              <button
                type="submit"
                disabled={pending}
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
          postId={postId}
          depth={depth + 1}
          onPosted={onPosted}
        />
      ))}
    </div>
  );
}

function CommentComposer({
  postId,
  action,
  state,
}: {
  postId: string;
  action: (payload: FormData) => void;
  state: { error?: string; success?: boolean };
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [gifOpen, setGifOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(file: File | null) {
    if (!file) return;
    setBusy(true);
    setUploadStatus("Uploading…");
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setUploadStatus("Sign in required.");
        return;
      }
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setUploadStatus("Use JPG, PNG, or WebP.");
        return;
      }
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/community/comments/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
      const { error } = await supabase.storage
        .from("garage")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) {
        setUploadStatus(error.message);
        return;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("garage").getPublicUrl(path);
      setImageUrl(publicUrl);
      setUploadStatus("Photo attached.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form action={action} className="mt-3 space-y-2">
      <input type="hidden" name="post_id" value={postId} />
      {imageUrl ? (
        <input type="hidden" name="image_url" value={imageUrl} />
      ) : null}
      <textarea
        name="body"
        required
        rows={2}
        placeholder="Add a comment… use @username to mention"
        className="w-full border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-metal/50"
      />
      {imageUrl ? (
        <div className="relative aspect-video max-w-xs overflow-hidden border border-border">
          <MediaThumb src={imageUrl} />
          <button
            type="button"
            className="absolute right-2 top-2 border border-border bg-bg/90 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-text"
            onClick={() => {
              setImageUrl(null);
              setUploadStatus(null);
            }}
          >
            Remove
          </button>
        </div>
      ) : null}
      {gifOpen ? (
        <div className="flex flex-wrap gap-2 border border-border bg-bg/40 p-3">
          {GIF_PLACEHOLDERS.map((g) => (
            <button
              key={g.label}
              type="button"
              onClick={() => {
                setImageUrl(g.url);
                setGifOpen(false);
                setUploadStatus(`${g.label} GIF attached.`);
              }}
              className="border border-border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-metal transition-colors hover:border-accent hover:text-text"
            >
              {g.label}
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.12em] text-metal hover:text-text">
            {busy ? "Uploading…" : "Image"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={busy}
              onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <button
            type="button"
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-metal hover:text-text"
            onClick={() => setGifOpen((v) => !v)}
          >
            GIF
          </button>
          {uploadStatus ? (
            <span className="text-xs text-text-muted">{uploadStatus}</span>
          ) : null}
        </div>
        <button
          type="submit"
          className="border border-border px-4 py-2 text-xs text-text hover:border-metal/40"
        >
          Comment
        </button>
      </div>
      {state.error ? (
        <p className="text-xs text-accent">{state.error}</p>
      ) : null}
    </form>
  );
}

export function PostCard({
  post,
  signedIn,
}: {
  post: FeedPost;
  signedIn: boolean;
}) {
  const [liked, setLiked] = useState(post.liked);
  const [saved, setSaved] = useState(post.saved);
  const [likes, setLikes] = useState(post.like_count);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<FeedComment[] | null>(null);
  const [shareHint, setShareHint] = useState(false);
  const [pending, start] = useTransition();
  const [commentState, commentAction] = useActionState(addCommunityComment, {});
  const yt = youtubeEmbedId(post.youtube_url);
  const username = post.author?.username;
  const vehicleHref =
    username && post.vehicle
      ? `/garage/${username}/vehicles/${post.vehicle.id}`
      : username
        ? `/garage/${username}`
        : null;

  useEffect(() => {
    if (commentState.success && commentsOpen) {
      void loadPostComments(post.id).then((r) => setComments(r.comments));
    }
  }, [commentState.success, commentsOpen, post.id]);

  async function openComments() {
    setCommentsOpen(true);
    if (!comments) {
      const r = await loadPostComments(post.id);
      setComments(r.comments);
    }
  }

  function share() {
    const url = `${window.location.origin}/community?post=${post.id}`;
    void navigator.clipboard?.writeText(url).then(() => {
      setShareHint(true);
      window.setTimeout(() => setShareHint(false), 1800);
    });
  }

  return (
    <article className="border border-border bg-surface/30 transition-colors hover:border-metal/25">
      <div className="flex items-start gap-3 p-5">
        <Link href={username ? `/garage/${username}` : "#"}>
          <Avatar
            url={post.author?.avatar_url}
            name={post.author?.display_name ?? username}
            size="md"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={username ? `/garage/${username}` : "#"}
              className="font-medium text-text hover:underline"
            >
              {post.author?.display_name ?? "Member"}
            </Link>
            {username ? (
              <span className="text-sm text-text-muted">@{username}</span>
            ) : null}
            <SkillBadge level={post.author?.skill_level} />
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-metal">
              {reputationBand(post.author?.reputation_cached)}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-metal">
              {POST_TYPE_LABELS[post.post_type]}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-metal">
              {relativeTime(post.created_at)}
            </span>
          </div>
          <BadgeRow badgeKeys={post.badgeKeys.slice(0, 3)} className="mt-2" />
          {post.vehicle && vehicleHref ? (
            <Link
              href={vehicleHref}
              className="mt-2 inline-block font-mono text-[11px] uppercase tracking-[0.14em] text-metal transition-colors hover:text-text"
            >
              {[post.vehicle.year, post.vehicle.make, post.vehicle.model]
                .filter(Boolean)
                .join(" ")}
              {post.vehicle.trim ? ` · ${post.vehicle.trim}` : ""}
            </Link>
          ) : null}
          {post.title ? (
            <h3 className="mt-3 font-[family-name:var(--font-display)] text-lg font-medium text-text">
              {post.title}
            </h3>
          ) : null}
          {post.body ? (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text-muted">
              {post.body}
            </p>
          ) : null}

          {post.media_urls?.length ? (
            <div
              className={`mt-4 grid gap-1 ${
                post.media_urls.length > 1 ? "grid-cols-2" : "grid-cols-1"
              }`}
            >
              {post.media_urls.slice(0, 4).map((url) => (
                <div
                  key={url}
                  className="relative aspect-[4/3] overflow-hidden bg-surface-elevated"
                >
                  <MediaThumb src={url} />
                </div>
              ))}
            </div>
          ) : null}

          {yt ? (
            <div className="mt-4 aspect-video overflow-hidden border border-border">
              <iframe
                src={`https://www.youtube.com/embed/${yt}`}
                title="YouTube"
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : null}

          {post.video_url && !yt ? (
            <video
              src={post.video_url}
              controls
              className="mt-4 w-full border border-border"
              preload="metadata"
            />
          ) : null}

          {(post.horsepower || post.engine || post.transmission) && (
            <dl className="mt-4 grid grid-cols-3 gap-3 border border-border bg-bg/40 px-3 py-3 text-xs">
              {post.horsepower != null ? (
                <div>
                  <dt className="font-mono uppercase tracking-[0.12em] text-metal">
                    HP
                  </dt>
                  <dd className="mt-0.5 text-text">{post.horsepower}</dd>
                </div>
              ) : null}
              {post.engine ? (
                <div>
                  <dt className="font-mono uppercase tracking-[0.12em] text-metal">
                    Engine
                  </dt>
                  <dd className="mt-0.5 text-text">{post.engine}</dd>
                </div>
              ) : null}
              {post.transmission ? (
                <div>
                  <dt className="font-mono uppercase tracking-[0.12em] text-metal">
                    Trans
                  </dt>
                  <dd className="mt-0.5 text-text">{post.transmission}</dd>
                </div>
              ) : null}
            </dl>
          )}

          {post.tags?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <span
                  key={t}
                  className="border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-metal"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-5 flex items-center gap-5 border-t border-border pt-4">
            <button
              type="button"
              disabled={!signedIn || pending}
              className={`inline-flex items-center gap-2 text-sm transition-colors ${
                liked ? "text-accent" : "text-text-muted hover:text-text"
              }`}
              onClick={() =>
                start(async () => {
                  const res = await toggleCommunityLike(post.id);
                  if (!res.error) {
                    setLiked((v) => !v);
                    setLikes((n) => (liked ? Math.max(0, n - 1) : n + 1));
                  }
                })
              }
              aria-label="Like"
            >
              <IconHeart filled={liked} />
              <span className="font-mono text-xs">{likes || ""}</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-text"
              onClick={() => void openComments()}
              aria-label="Comment"
            >
              <IconComment />
              <span className="font-mono text-xs">
                {post.comment_count || ""}
              </span>
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-text"
              onClick={share}
              aria-label="Share"
            >
              <IconShare />
              {shareHint ? (
                <span className="font-mono text-[10px] uppercase tracking-[0.12em]">
                  Copied
                </span>
              ) : null}
            </button>
            <button
              type="button"
              disabled={!signedIn || pending}
              className={`ml-auto inline-flex items-center gap-2 text-sm transition-colors ${
                saved ? "text-text" : "text-text-muted hover:text-text"
              }`}
              onClick={() =>
                start(async () => {
                  const res = await toggleCommunitySave(post.id);
                  if (!res.error) setSaved((v) => !v);
                })
              }
              aria-label="Save"
            >
              <IconSave filled={saved} />
            </button>
          </div>

          {commentsOpen ? (
            <div className="mt-4 border-t border-border pt-3">
              {comments == null ? (
                <p className="text-sm text-text-muted">Loading comments…</p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-text-muted">No comments yet.</p>
              ) : (
                comments.map((c) => (
                  <CommentNode
                    key={c.id}
                    comment={c}
                    postId={post.id}
                    onPosted={() => {
                      void loadPostComments(post.id).then((r) =>
                        setComments(r.comments),
                      );
                    }}
                  />
                ))
              )}
              {signedIn ? (
                <CommentComposer
                  postId={post.id}
                  action={commentAction}
                  state={commentState}
                />
              ) : (
                <p className="mt-3 text-sm text-text-muted">
                  <Link href="/garage/sign-in" className="underline">
                    Sign in
                  </Link>{" "}
                  to comment.
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
