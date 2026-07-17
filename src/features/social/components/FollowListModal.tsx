"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar } from "@/components/garage-profile/Avatar";
import { FollowButton } from "@/features/social/components/FollowButton";
import {
  loadFollowList,
  type FollowListMember,
} from "@/features/social/follow-list-actions";

const PAGE_SIZE = 30;

export function FollowListModal({
  open,
  onClose,
  username,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  username: string;
  mode: "followers" | "following";
}) {
  const [q, setQ] = useState("");
  const [members, setMembers] = useState<FollowListMember[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const offsetRef = useRef(0);

  const refresh = useCallback(
    (query?: string) => {
      start(async () => {
        offsetRef.current = 0;
        const res = await loadFollowList({
          username,
          mode,
          q: query,
          offset: 0,
          limit: PAGE_SIZE,
        });
        if (res.error) setError(res.error);
        else setError(null);
        setMembers(res.members);
        setHasMore(res.hasMore);
        offsetRef.current = res.members.length;
      });
    },
    [username, mode],
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || pending) return;
    setLoadingMore(true);
    const res = await loadFollowList({
      username,
      mode,
      q,
      offset: offsetRef.current,
      limit: PAGE_SIZE,
    });
    if (!res.error) {
      setMembers((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        const next = res.members.filter((m) => !seen.has(m.id));
        return [...prev, ...next];
      });
      setHasMore(res.hasMore);
      offsetRef.current += res.members.length;
    }
    setLoadingMore(false);
  }, [hasMore, loadingMore, pending, username, mode, q]);

  useEffect(() => {
    if (!open) return;
    setQ("");
    refresh();
  }, [open, refresh]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => refresh(q), 220);
    return () => window.clearTimeout(t);
  }, [q, open, refresh]);

  useEffect(() => {
    if (!open || !hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "120px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [open, hasMore, loadMore, members.length]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-[90] bg-black/65 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal
            aria-label={mode === "followers" ? "Followers" : "Following"}
            className="fixed inset-x-4 top-[10%] z-[95] mx-auto flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden border border-border bg-[#0c0c0e] shadow-[0_32px_80px_-32px_rgba(0,0,0,0.9)] sm:inset-x-auto"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-metal">
                  @{username}
                </p>
                <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold text-text">
                  {mode === "followers" ? "Followers" : "Following"}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid h-9 w-9 place-items-center text-text-muted hover:text-text"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="border-b border-border px-5 py-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search members…"
                className="w-full border border-border bg-surface px-3 py-2.5 text-sm text-text placeholder:text-text-muted"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {error ? (
                <p className="px-5 py-6 text-sm text-accent">{error}</p>
              ) : null}
              {pending && members.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-text-muted">
                  Loading…
                </p>
              ) : null}
              {!pending && members.length === 0 && !error ? (
                <p className="px-5 py-8 text-center text-sm text-text-muted">
                  {q
                    ? "No matches."
                    : mode === "followers"
                      ? "No followers yet."
                      : "Not following anyone yet."}
                </p>
              ) : null}
              <ul className="divide-y divide-border">
                {members.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center gap-3 px-5 py-3.5"
                  >
                    <Avatar
                      url={m.avatarUrl}
                      name={m.displayName ?? m.username}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text">
                        {m.displayName ?? m.username ?? "Member"}
                      </p>
                      <p className="truncate text-xs text-text-muted">
                        @{m.username}
                        {m.isMutual ? (
                          <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.12em] text-metal">
                            Mutual
                          </span>
                        ) : m.followsYou && !m.isSelf ? (
                          <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.12em] text-metal">
                            Follows you
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {!m.isSelf ? (
                        <FollowButton
                          followingId={m.id}
                          initiallyFollowing={m.isFollowing}
                        />
                      ) : null}
                      {m.username ? (
                        <Link
                          href={`/garage/${m.username}`}
                          onClick={onClose}
                          className="border border-border px-3 py-2 text-xs text-text-muted transition-colors hover:border-white/40 hover:text-text"
                        >
                          View Profile
                        </Link>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
              <div ref={sentinelRef} className="h-4" />
              {loadingMore ? (
                <p className="px-5 py-3 text-center text-xs text-text-muted">
                  Loading more…
                </p>
              ) : null}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
