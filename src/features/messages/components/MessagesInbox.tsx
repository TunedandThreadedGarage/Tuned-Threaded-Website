"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar } from "@/components/garage-profile/Avatar";
import type { ConversationListItem } from "@/features/messages/actions";
import {
  acceptMessageRequest,
  declineMessageRequest,
  deleteConversation,
  blockUser,
} from "@/features/messages/actions";
import {
  formatMessageTime,
  presenceDotClass,
  presenceLabel,
  useOnlinePresence,
  usePinnedConversations,
} from "@/features/messages/hooks";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { ensureRealtimeAuth } from "@/lib/supabase/realtime";

export function MessagesInbox({
  initialItems,
  mode = "inbox",
  activeId,
  userId,
}: {
  initialItems: ConversationListItem[];
  mode?: "inbox" | "requests";
  activeId?: string | null;
  userId?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [items, setItems] = useState(initialItems);
  const [pending, start] = useTransition();
  const { isPinned, togglePin, pinned } = usePinnedConversations();
  const { getStatus } = useOnlinePresence();
  const { realtimeEpoch, userId: authUserId } = useAuth();
  const uid = userId ?? authUserId;
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  // Adopt fresh server data when the prop changes (during render, not in an
  // effect, to avoid cascading renders).
  const [prevInitialItems, setPrevInitialItems] = useState(initialItems);
  if (prevInitialItems !== initialItems) {
    setPrevInitialItems(initialItems);
    setItems(initialItems);
  }

  useEffect(() => {
    if (!uid || mode !== "inbox") return;
    let alive = true;
    const supabase = createClient();

    void (async () => {
      await ensureRealtimeAuth(supabase);
      if (!alive) return;

      const channel = supabase
        .channel(`dm-inbox:${uid}:${realtimeEpoch}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "dm_conversations",
          },
          (payload) => {
            const row = payload.new as {
              id?: string;
              last_message_at?: string | null;
              last_message_preview?: string | null;
            } | null;
            if (!row?.id) return;
            setItems((prev) => {
              const idx = prev.findIndex((i) => i.id === row.id);
              if (idx === -1) {
                router.refresh();
                return prev;
              }
              const next = [...prev];
              next[idx] = {
                ...next[idx],
                lastMessageAt: row.last_message_at ?? next[idx].lastMessageAt,
                lastMessagePreview:
                  row.last_message_preview ?? next[idx].lastMessagePreview,
                unread: activeId === row.id ? false : true,
              };
              return next;
            });
          },
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "dm_messages",
          },
          (payload) => {
            const row = payload.new as {
              conversation_id?: string;
              sender_id?: string;
              body?: string;
              image_url?: string | null;
              created_at?: string;
            };
            if (!row.conversation_id) return;
            setItems((prev) => {
              const idx = prev.findIndex((i) => i.id === row.conversation_id);
              if (idx === -1) {
                router.refresh();
                return prev;
              }
              const preview = row.body?.trim()
                ? row.body.slice(0, 120)
                : row.image_url
                  ? "Sent a photo"
                  : prev[idx].lastMessagePreview;
              const next = [...prev];
              next[idx] = {
                ...next[idx],
                lastMessageAt: row.created_at ?? next[idx].lastMessageAt,
                lastMessagePreview: preview,
                unread:
                  row.sender_id !== uid && activeId !== row.conversation_id,
              };
              return next;
            });
          },
        )
        .subscribe();

      channelRef.current = channel;
    })();

    return () => {
      alive = false;
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [uid, mode, realtimeEpoch, router, activeId]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let list = items;
    if (query) {
      list = list.filter(
        (i) =>
          i.peer.username?.toLowerCase().includes(query) ||
          i.peer.displayName?.toLowerCase().includes(query) ||
          i.lastMessagePreview?.toLowerCase().includes(query),
      );
    }
    return [...list].sort((a, b) => {
      const ap = isPinned(a.id) ? 1 : 0;
      const bp = isPinned(b.id) ? 1 : 0;
      if (ap !== bp) return bp - ap;
      const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bt - at;
    });
  }, [items, q, isPinned, pinned]);

  return (
    <div className="flex h-full flex-col bg-[#0a0a0c]">
      <div className="border-b border-border px-4 pb-3 pt-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-metal">
              Messages
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-text">
              {mode === "requests" ? "Requests" : "Inbox"}
            </h1>
          </div>
          <div className="flex gap-1 rounded-full border border-border p-0.5 text-xs">
            <Link
              href="/messages"
              className={`rounded-full px-3 py-1.5 transition-colors ${
                mode === "inbox"
                  ? "bg-white text-bg"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Inbox
            </Link>
            <Link
              href="/messages/requests"
              className={`rounded-full px-3 py-1.5 transition-colors ${
                mode === "requests"
                  ? "bg-white text-bg"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Requests
            </Link>
          </div>
        </div>
        <label className="relative block">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            <SearchIcon />
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search conversations…"
            className="w-full rounded-xl border border-border bg-surface/60 py-2.5 pl-10 pr-3 text-sm text-text outline-none transition-colors placeholder:text-text-muted/70 focus:border-metal/50"
          />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-5 py-16 text-center text-sm text-text-muted">
            {q
              ? "No matches."
              : mode === "requests"
                ? "No message requests."
                : "No conversations yet."}
          </p>
        ) : (
          <ul className="px-2 py-2">
            <AnimatePresence initial={false}>
              {filtered.map((item) => {
                const active = activeId === item.id;
                const status = getStatus(item.peer.id);
                const pinnedItem = isPinned(item.id);
                return (
                  <motion.li
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="group relative"
                  >
                    <Link
                      href={`/messages/${item.id}`}
                      className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-colors ${
                        active
                          ? "bg-white/[0.08]"
                          : "hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="relative shrink-0">
                        <Avatar
                          url={item.peer.avatarUrl}
                          name={item.peer.displayName ?? item.peer.username}
                          size="sm"
                        />
                        <span
                          className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#0a0a0c] ${presenceDotClass(status)}`}
                          title={presenceLabel(status)}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="flex min-w-0 items-center gap-1.5 truncate text-sm font-medium text-text">
                            {pinnedItem ? (
                              <span className="shrink-0 text-[10px] text-metal" title="Pinned">
                                ★
                              </span>
                            ) : null}
                            <span className="truncate">
                              {item.peer.displayName ??
                                item.peer.username ??
                                "Member"}
                            </span>
                          </p>
                          <span className="shrink-0 text-[10px] text-text-muted">
                            {formatMessageTime(item.lastMessageAt)}
                          </span>
                        </div>
                        <p className="truncate text-[11px] text-text-muted">
                          @{item.peer.username}
                        </p>
                        <p
                          className={`mt-0.5 truncate text-xs ${
                            item.unread
                              ? "font-medium text-text"
                              : "text-text-muted"
                          }`}
                        >
                          {item.lastMessagePreview || "No messages yet"}
                        </p>
                      </div>
                      {item.unread ? (
                        <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-accent px-1.5 text-[10px] font-semibold text-white">
                          •
                        </span>
                      ) : null}
                    </Link>

                    {mode === "inbox" ? (
                      <button
                        type="button"
                        title={pinnedItem ? "Unpin" : "Pin"}
                        className="absolute right-2 top-2 rounded-md px-1.5 py-0.5 text-[10px] text-text-muted opacity-0 transition-opacity hover:text-text group-hover:opacity-100"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          togglePin(item.id);
                        }}
                      >
                        {pinnedItem ? "Unpin" : "Pin"}
                      </button>
                    ) : (
                      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 flex-col gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          disabled={pending}
                          className="rounded bg-white px-2 py-0.5 text-[10px] font-medium text-bg"
                          onClick={() =>
                            start(async () => {
                              await acceptMessageRequest(item.id);
                              setItems((prev) =>
                                prev.filter((x) => x.id !== item.id),
                              );
                              router.push(`/messages/${item.id}`);
                            })
                          }
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          className="rounded border border-border px-2 py-0.5 text-[10px] text-text-muted"
                          onClick={() =>
                            start(async () => {
                              await declineMessageRequest(item.id);
                              setItems((prev) =>
                                prev.filter((x) => x.id !== item.id),
                              );
                            })
                          }
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          className="rounded border border-border px-2 py-0.5 text-[10px] text-accent"
                          onClick={() =>
                            start(async () => {
                              await blockUser(item.peer.id);
                              setItems((prev) =>
                                prev.filter((x) => x.id !== item.id),
                              );
                            })
                          }
                        >
                          Block
                        </button>
                      </div>
                    )}

                    {mode === "inbox" ? (
                      <button
                        type="button"
                        className="sr-only"
                        onClick={() =>
                          start(async () => {
                            if (!window.confirm("Delete this conversation?"))
                              return;
                            await deleteConversation(item.id);
                            setItems((prev) =>
                              prev.filter((x) => x.id !== item.id),
                            );
                          })
                        }
                      >
                        Delete
                      </button>
                    ) : null}
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M16.5 16.5L20 20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
