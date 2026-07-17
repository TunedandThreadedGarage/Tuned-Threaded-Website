"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import {
  addJournalComment,
  deleteJournalHubEntry,
  toggleJournalLike,
  type JournalFeedItem,
} from "@/features/journal/actions";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { Avatar } from "@/components/garage-profile/Avatar";
import { ReportButton } from "@/features/moderation/components/ReportButton";

function isVideo(url: string) {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url) || url.includes("/video");
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function JournalTimeline({
  items,
  currentUserId,
  signedIn,
}: {
  items: JournalFeedItem[];
  currentUserId: string | null;
  signedIn: boolean;
}) {
  if (items.length === 0) {
    return (
      <p className="border border-dashed border-border px-5 py-12 text-center text-sm text-text-muted">
        No entries yet. Start the timeline.
      </p>
    );
  }

  return (
    <ol className="relative space-y-0 border-l border-border pl-6 md:pl-8">
      {items.map((entry) => (
        <JournalCard
          key={entry.id}
          entry={entry}
          isOwner={currentUserId === entry.user_id}
          signedIn={signedIn}
        />
      ))}
    </ol>
  );
}

function JournalCard({
  entry,
  isOwner,
  signedIn,
}: {
  entry: JournalFeedItem;
  isOwner: boolean;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(entry.liked);
  const [likes, setLikes] = useState(entry.like_count);
  const [showComments, setShowComments] = useState(false);
  const [pending, start] = useTransition();
  const [commentState, commentAction] = useActionState(addJournalComment, {});

  const authorName =
    entry.author?.display_name || entry.author?.username || "Member";

  return (
    <li className="relative pb-10">
      <span className="absolute -left-[1.65rem] top-1.5 h-3 w-3 rounded-full border border-accent bg-bg md:-left-[2.15rem]" />
      <article className="border border-border bg-surface/25 p-5 transition-colors hover:border-metal/40 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar
              url={entry.author?.avatar_url}
              name={authorName}
              size="sm"
            />
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-metal">
                {entry.entry_date}
                {entry.category ? ` · ${entry.category}` : ""}
                {entry.visibility === "private" ? " · Private" : ""}
                {entry.status === "draft" ? " · Draft" : ""}
              </p>
              <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg font-semibold text-text md:text-xl">
                {entry.title}
              </h3>
              {entry.author?.username ? (
                <Link
                  href={`/garage/${entry.author.username}`}
                  className="mt-0.5 text-xs text-text-muted hover:text-text"
                >
                  {authorName}
                </Link>
              ) : (
                <p className="mt-0.5 text-xs text-text-muted">{authorName}</p>
              )}
            </div>
          </div>
          {isOwner ? (
            <DeleteButton
              label="Delete"
              onDelete={deleteJournalHubEntry.bind(null, entry.id)}
            />
          ) : signedIn ? (
            <ReportButton
              targetType="journal_entry"
              targetId={entry.id}
              targetUserId={entry.user_id}
            />
          ) : null}
        </div>

        {entry.build_id && entry.build_title ? (
          <Link
            href={`/builds/${entry.build_id}`}
            className="mt-3 inline-block font-mono text-[10px] uppercase tracking-[0.16em] text-accent hover:text-text"
          >
            Build log · {entry.build_title}
          </Link>
        ) : null}

        {entry.body ? (
          <div
            className="prose-store mt-4 text-sm leading-relaxed text-text-muted [&_a]:text-text [&_li]:ml-4 [&_ol]:list-decimal [&_ul]:list-disc"
            dangerouslySetInnerHTML={{ __html: entry.body }}
          />
        ) : null}

        {entry.media_urls.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {entry.media_urls.map((url) =>
              isVideo(url) ? (
                <video
                  key={url}
                  src={url}
                  controls
                  className="aspect-video w-full bg-surface object-cover"
                />
              ) : (
                <div key={url} className="relative aspect-square overflow-hidden bg-surface">
                  <Image
                    src={url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 200px"
                  />
                </div>
              ),
            )}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border pt-4">
          <button
            type="button"
            disabled={!signedIn || pending}
            className={`text-sm transition-colors disabled:opacity-40 ${
              liked ? "text-accent" : "text-text-muted hover:text-text"
            }`}
            onClick={() => {
              if (!signedIn) return;
              start(async () => {
                const res = await toggleJournalLike(entry.id);
                if (!res.error) {
                  setLiked(res.liked);
                  setLikes(res.likeCount);
                }
              });
            }}
          >
            ♥ {likes}
          </button>
          <button
            type="button"
            className="text-sm text-text-muted transition-colors hover:text-text"
            onClick={() => setShowComments((v) => !v)}
          >
            💬 {entry.comment_count}
          </button>
          {!entry.body && entry.media_urls.length === 0 ? (
            <span className="sr-only">{stripHtml(entry.title)}</span>
          ) : null}
        </div>

        {showComments ? (
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            {signedIn ? (
              <form
                action={async (fd) => {
                  await commentAction(fd);
                  router.refresh();
                }}
                className="flex gap-2"
              >
                <input type="hidden" name="journal_id" value={entry.id} />
                <input
                  name="body"
                  required
                  placeholder="Add a comment…"
                  className="flex-1 border border-border bg-surface px-3 py-2 text-sm text-text"
                />
                <button
                  type="submit"
                  className="border border-border px-3 py-2 text-xs text-text-muted hover:text-text"
                >
                  Post
                </button>
              </form>
            ) : (
              <p className="text-xs text-text-muted">
                <Link href="/garage/sign-in?next=/journal" className="underline">
                  Sign in
                </Link>{" "}
                to comment.
              </p>
            )}
            {commentState.error ? (
              <p className="text-xs text-accent">{commentState.error}</p>
            ) : null}
          </div>
        ) : null}
      </article>
    </li>
  );
}
