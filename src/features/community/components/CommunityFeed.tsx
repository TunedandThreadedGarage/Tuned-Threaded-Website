"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  loadCommunityFeed,
  type FeedPost,
} from "@/features/community/actions";
import {
  COMMUNITY_FILTERS,
  COMMUNITY_TABS,
  type CommunityTab,
} from "@/features/community/constants";
import { PostCard } from "@/features/community/components/PostCard";
import { FeedSkeleton } from "@/features/community/components/FeedSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export function CommunityFeed({
  initialPosts,
  initialCursor,
  signedIn,
  initialTab = "newest",
}: {
  initialPosts: FeedPost[];
  initialCursor: string | null;
  signedIn: boolean;
  initialTab?: CommunityTab;
}) {
  const [tab, setTab] = useState<CommunityTab>(initialTab);
  const [tag, setTag] = useState<string | null>(null);
  const [posts, setPosts] = useState(initialPosts);
  const [cursor, setCursor] = useState(initialCursor);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const sentinel = useRef<HTMLDivElement | null>(null);

  const reload = useCallback(
    (nextTab: CommunityTab, nextTag: string | null) => {
      start(async () => {
        setError(null);
        const res = await loadCommunityFeed({
          tab: nextTab,
          tag: nextTag,
        });
        if (res.error) setError(res.error);
        setPosts(res.posts);
        setCursor(res.nextCursor);
      });
    },
    [],
  );

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !cursor) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || pending) return;
        start(async () => {
          const res = await loadCommunityFeed({
            tab,
            tag,
            cursor,
          });
          if (res.error) {
            setError(res.error);
            return;
          }
          setPosts((prev) => {
            const ids = new Set(prev.map((p) => p.id));
            return [...prev, ...res.posts.filter((p) => !ids.has(p.id))];
          });
          setCursor(res.nextCursor);
        });
      },
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [cursor, tab, tag, pending]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        {COMMUNITY_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              reload(t.id, tag);
            }}
            className={`px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
              tab === t.id
                ? "border border-accent text-text"
                : "border border-transparent text-metal hover:text-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => {
            setTag(null);
            reload(tab, null);
          }}
          className={`shrink-0 border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] ${
            !tag
              ? "border-accent text-text"
              : "border-border text-metal hover:border-metal/40"
          }`}
        >
          All
        </button>
        {COMMUNITY_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => {
              const next = tag === f.key ? null : f.key;
              setTag(next);
              reload(tab, next);
            }}
            className={`shrink-0 border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] ${
              tag === f.key
                ? "border-accent text-text"
                : "border-border text-metal hover:border-metal/40"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="border border-border bg-surface/40 px-4 py-3 text-sm text-accent">
          {error.includes("community_posts") || error.includes("relation")
            ? "Community tables are not set up yet. Run supabase/migrations/20260715_community_feed.sql in the Supabase SQL Editor."
            : error}
        </p>
      ) : null}

      {pending && posts.length === 0 ? <FeedSkeleton /> : null}

      {!pending && posts.length === 0 ? (
        <EmptyState
          title={
            tab === "following"
              ? "Your Following feed is empty"
              : "No posts yet"
          }
          description={
            tab === "following"
              ? "Follow garages to fill this feed with their updates."
              : "Be the first to share a build update, dyno sheet, or question."
          }
          action={
            !signedIn ? (
              <Button href="/garage/sign-up" variant="primary">
                Join the Garage
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-5">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} signedIn={signedIn} />
          ))}
        </div>
      )}

      <div ref={sentinel} className="h-8" />
      {pending && posts.length > 0 ? (
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.16em] text-metal">
          Loading…
        </p>
      ) : null}
    </div>
  );
}
