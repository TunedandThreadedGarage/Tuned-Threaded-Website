"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
  loadNotificationById,
  loadNotificationsPage,
  markAllNotificationsRead,
} from "@/features/notifications/actions";
import {
  GROUP_LABELS,
  groupKeyFor,
  type NotificationGroupKey,
} from "@/features/notifications/constants";
import type { NotificationFeedItem } from "@/features/notifications/types";
import { NotificationItem } from "@/features/notifications/components/NotificationItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export function NotificationCenter({
  initialItems,
  initialCursor,
  userId,
}: {
  initialItems: NotificationFeedItem[];
  initialCursor: string | null;
  userId: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [pending, start] = useTransition();
  const [loadingMore, setLoadingMore] = useState(false);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const groups = useMemo(() => {
    const order: NotificationGroupKey[] = ["today", "yesterday", "earlier"];
    const map = new Map<NotificationGroupKey, NotificationFeedItem[]>();
    for (const key of order) map.set(key, []);
    for (const item of items) {
      map.get(groupKeyFor(item.createdAt))!.push(item);
    }
    return order
      .map((key) => ({ key, label: GROUP_LABELS[key], items: map.get(key)! }))
      .filter((g) => g.items.length > 0);
  }, [items]);

  const unreadCount = items.filter((i) => !i.readAt).length;
  const markedViewRef = useRef(false);

  // Clear unread badge when the inbox is viewed.
  useEffect(() => {
    if (markedViewRef.current) return;
    const hasUnread = initialItems.some((i) => !i.readAt);
    if (!hasUnread) {
      markedViewRef.current = true;
      return;
    }
    markedViewRef.current = true;
    start(async () => {
      await markAllNotificationsRead();
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          readAt: item.readAt ?? new Date().toISOString(),
        })),
      );
      window.dispatchEvent(new Event("tt:notifications-read"));
    });
  }, [initialItems]);

  const prependRealtime = useCallback(async (id: string) => {
    const { item } = await loadNotificationById(id);
    if (!item) return;
    setItems((prev) => {
      if (prev.some((p) => p.id === item.id)) return prev;
      return [item, ...prev];
    });
    setFreshIds((prev) => new Set(prev).add(item.id));
    window.setTimeout(() => {
      setFreshIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }, 2400);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const id = (payload.new as { id?: string })?.id;
          if (id) void prependRealtime(id);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            read_at: string | null;
          };
          setItems((prev) =>
            prev.map((item) =>
              item.id === row.id ? { ...item, readAt: row.read_at } : item,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const id = (payload.old as { id?: string })?.id;
          if (!id) return;
          setItems((prev) => prev.filter((item) => item.id !== id));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [prependRealtime, userId]);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    const result = await loadNotificationsPage({ cursor });
    setItems((prev) => {
      const seen = new Set(prev.map((p) => p.id));
      const next = result.items.filter((i) => !seen.has(i.id));
      return [...prev, ...next];
    });
    setCursor(result.nextCursor);
    setLoadingMore(false);
  }, [cursor, loadingMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !cursor) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "240px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [cursor, loadMore]);

  if (items.length === 0) {
    return (
      <EmptyState
        title="You're all caught up"
        description="Garage follows, build activity, community likes, and marketplace alerts land here instantly."
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
            {unreadCount > 0
              ? `${unreadCount} unread`
              : "Inbox clear"}
          </p>
          <p className="mt-1 text-sm text-text-muted">
            Live updates from Garages, Community, Builds, and Journal.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          disabled={pending || unreadCount === 0}
          onClick={() =>
            start(async () => {
              await markAllNotificationsRead();
              setItems((prev) =>
                prev.map((item) => ({
                  ...item,
                  readAt: item.readAt ?? new Date().toISOString(),
                })),
              );
              window.dispatchEvent(new Event("tt:notifications-read"));
            })
          }
        >
          Mark all as read
        </Button>
      </div>

      {groups.map((group) => (
        <section key={group.key} className="space-y-3">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
            {group.label}
          </h2>
          <ul className="overflow-hidden border border-border bg-surface/10">
            <AnimatePresence initial={false}>
              {group.items.map((item) => (
                <NotificationItem
                  key={item.id}
                  item={item}
                  animateIn={freshIds.has(item.id)}
                  onRemoved={(id) =>
                    setItems((prev) => prev.filter((n) => n.id !== id))
                  }
                />
              ))}
            </AnimatePresence>
          </ul>
        </section>
      ))}

      <div ref={sentinelRef} className="h-8" aria-hidden />
      {loadingMore ? (
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.16em] text-metal">
          Loading earlier…
        </p>
      ) : null}
      {!cursor && items.length > 0 ? (
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.16em] text-metal">
          End of inbox
        </p>
      ) : null}
    </div>
  );
}
