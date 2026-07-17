"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/garage-profile/Avatar";
import {
  blockUser,
  deleteConversation,
  loadThread,
  markConversationRead,
  sendMessage,
  type ConversationListItem,
  type ThreadMessage,
} from "@/features/messages/actions";
import { ReportButton } from "@/features/moderation/components/ReportButton";
import {
  formatMessageTime,
  useOnlinePresence,
} from "@/features/messages/hooks";
import { DmImageAttach } from "@/features/messages/components/DmImageAttach";

const EMOJIS = [
  "😀", "😂", "🔥", "❤️", "👍", "👎", "😮", "😢",
  "🙌", "💪", "🏎️", "🛠️", "🎉", "✅", "👀", "💯",
  "😎", "🤝", "⚡", "🏁", "🔧", "🖤", "🙌", "🫡",
];

export function MessageThread({
  conversationId,
  userId,
  initialMessages,
  initialPeer,
  initialPeerLastReadAt,
  initialStatus,
}: {
  conversationId: string;
  userId: string;
  initialMessages: ThreadMessage[];
  initialPeer: ConversationListItem["peer"] | null;
  initialPeerLastReadAt: string | null;
  initialStatus: string | null;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [peer] = useState(initialPeer);
  const [peerLastReadAt, setPeerLastReadAt] = useState(initialPeerLastReadAt);
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [gifHint, setGifHint] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const typingTimer = useRef<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const channelRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  > | null>(null);
  const { isOnline } = useOnlinePresence();
  const peerOnline = peer ? isOnline(peer.id) : false;

  useEffect(() => {
    void markConversationRead(conversationId);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, peerTyping]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setShowMenu(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`dm:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "dm_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as ThreadMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, { ...row, seen: false }];
          });
          if (row.sender_id !== userId) {
            void markConversationRead(conversationId);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "dm_participants",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as {
            user_id: string;
            last_read_at: string | null;
          };
          if (row.user_id !== userId) {
            setPeerLastReadAt(row.last_read_at);
          }
        },
      )
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const p = payload as { userId?: string };
        if (p.userId && p.userId !== userId) {
          setPeerTyping(true);
          window.setTimeout(() => setPeerTyping(false), 2000);
        }
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, userId]);

  const broadcastTyping = useCallback(() => {
    const ch = channelRef.current;
    if (!ch) return;
    void ch.send({
      type: "broadcast",
      event: "typing",
      payload: { userId },
    });
  }, [userId]);

  function onBodyChange(value: string) {
    setBody(value);
    if (typingTimer.current) window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => broadcastTyping(), 200);
  }

  async function doSend() {
    if (pending) return;
    if (!body.trim() && !imageUrl) return;
    start(async () => {
      const res = await sendMessage({
        conversationId,
        body,
        imageUrl,
      });
      if (res.error) setError(res.error);
      else {
        setBody("");
        setImageUrl(null);
        setError(null);
        setShowEmoji(false);
        const thread = await loadThread(conversationId);
        setMessages(thread.messages);
      }
    });
  }

  const peerReadMs = peerLastReadAt
    ? new Date(peerLastReadAt).getTime()
    : 0;

  return (
    <div className="relative flex h-full flex-col bg-[#0c0c0e]">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-[#0a0a0c]/90 px-3 py-3 backdrop-blur-md md:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/messages"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-text-muted transition-colors hover:bg-white/5 hover:text-text md:hidden"
            aria-label="Back to inbox"
          >
            ←
          </Link>
          {peer ? (
            <>
              <div className="relative shrink-0">
                <Avatar
                  url={peer.avatarUrl}
                  name={peer.displayName ?? peer.username}
                  size="sm"
                />
                <span
                  className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#0a0a0c] ${
                    peerOnline ? "bg-emerald-400" : "bg-zinc-600"
                  }`}
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text">
                  {peer.displayName ?? peer.username}
                </p>
                <p className="truncate text-xs text-text-muted">
                  @{peer.username}
                  <span className="mx-1.5 text-border">·</span>
                  <span className={peerOnline ? "text-emerald-400/90" : ""}>
                    {peerOnline ? "Online" : "Offline"}
                  </span>
                  {initialStatus === "request" ? (
                    <span className="ml-1.5 text-metal">Request</span>
                  ) : null}
                </p>
              </div>
            </>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {peer?.username ? (
            <Link
              href={`/garage/${peer.username}`}
              className="hidden rounded-full border border-border px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-metal/40 hover:text-text sm:inline-flex"
            >
              View Profile
            </Link>
          ) : null}

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-label="Conversation menu"
              aria-expanded={showMenu}
              className="grid h-9 w-9 place-items-center rounded-full text-text-muted transition-colors hover:bg-white/5 hover:text-text"
              onClick={() => setShowMenu((v) => !v)}
            >
              <MoreIcon />
            </button>
            <AnimatePresence>
              {showMenu ? (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-[#121214] py-1 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)]"
                >
                  {peer?.username ? (
                    <Link
                      href={`/garage/${peer.username}`}
                      className="block px-4 py-2.5 text-sm text-text hover:bg-white/5 sm:hidden"
                      onClick={() => setShowMenu(false)}
                    >
                      View Profile
                    </Link>
                  ) : null}
                  {peer ? (
                    <div className="px-4 py-2.5">
                      <ReportButton
                        targetType="dm_conversation"
                        targetId={conversationId}
                        targetUserId={peer.id}
                        label="Report"
                        className="text-sm text-text-muted hover:text-accent"
                      />
                    </div>
                  ) : null}
                  {peer ? (
                    <button
                      type="button"
                      className="block w-full px-4 py-2.5 text-left text-sm text-text-muted hover:bg-white/5 hover:text-accent"
                      onClick={() =>
                        start(async () => {
                          if (!window.confirm("Block this user?")) return;
                          await blockUser(peer.id);
                          window.location.href = "/messages";
                        })
                      }
                    >
                      Block
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="block w-full px-4 py-2.5 text-left text-sm text-text-muted hover:bg-white/5 hover:text-accent"
                    onClick={() =>
                      start(async () => {
                        if (!window.confirm("Delete conversation?")) return;
                        await deleteConversation(conversationId);
                        window.location.href = "/messages";
                      })
                    }
                  >
                    Delete conversation
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div
        ref={scrollerRef}
        className="flex-1 space-y-1 overflow-y-auto px-3 py-4 md:px-5"
      >
        {messages.map((m, idx) => {
          const mine = m.sender_id === userId;
          const seen =
            mine &&
            peerReadMs > 0 &&
            new Date(m.created_at).getTime() <= peerReadMs;
          const prev = messages[idx - 1];
          const showAvatar =
            !mine && (!prev || prev.sender_id !== m.sender_id);

          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-2 ${mine ? "justify-end" : "justify-start"}`}
            >
              {!mine ? (
                <div className="w-8 shrink-0 self-end">
                  {showAvatar && peer ? (
                    <Avatar
                      url={peer.avatarUrl}
                      name={peer.displayName ?? peer.username}
                      size="sm"
                    />
                  ) : null}
                </div>
              ) : null}
              <div
                className={`flex max-w-[min(78%,28rem)] flex-col ${
                  mine ? "items-end" : "items-start"
                }`}
              >
                {m.image_url ? (
                  <button
                    type="button"
                    className="relative mb-1 aspect-square w-48 overflow-hidden rounded-2xl border border-border bg-surface transition-transform hover:scale-[1.01]"
                    onClick={() => setLightbox(m.image_url)}
                  >
                    <Image
                      src={m.image_url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="192px"
                    />
                  </button>
                ) : null}
                {m.body.trim() ? (
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      mine
                        ? "rounded-br-md bg-white text-bg"
                        : "rounded-bl-md border border-border/80 bg-surface text-text"
                    }`}
                  >
                    {m.body}
                  </div>
                ) : null}
                <div className="mt-1 flex items-center gap-2 px-1">
                  <span className="text-[10px] text-text-muted">
                    {formatMessageTime(m.created_at)}
                  </span>
                  {mine ? (
                    <span className="text-[10px] text-text-muted">
                      {seen ? "Seen" : "Sent"}
                    </span>
                  ) : (
                    <ReportButton
                      targetType="dm_message"
                      targetId={m.id}
                      targetUserId={m.sender_id}
                      label="Report"
                      className="text-[10px] text-text-muted/60 hover:text-accent"
                    />
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        <AnimatePresence>
          {peerTyping ? (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 pl-10"
            >
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-border bg-surface px-3 py-2.5">
                <span className="typing-dot" />
                <span className="typing-dot [animation-delay:0.15s]" />
                <span className="typing-dot [animation-delay:0.3s]" />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-border bg-[#0a0a0c]/95 px-3 py-3 backdrop-blur-md md:px-4">
        {error ? (
          <p className="mb-2 text-xs text-accent">{error}</p>
        ) : null}
        {imageUrl ? (
          <div className="relative mb-2 inline-block h-16 w-16 overflow-hidden rounded-xl border border-border">
            <Image
              src={imageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="64px"
            />
            <button
              type="button"
              className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-[10px] text-white"
              onClick={() => setImageUrl(null)}
            >
              ✕
            </button>
          </div>
        ) : null}

        <div className="flex items-end gap-2">
          <div className="flex shrink-0 items-center gap-0.5 pb-1">
            <DmImageAttach
              userId={userId}
              conversationId={conversationId}
              onUploaded={(url) => setImageUrl(url)}
            />
            <button
              type="button"
              aria-label="Emoji"
              className="grid h-9 w-9 place-items-center rounded-full text-text-muted transition-colors hover:bg-white/5 hover:text-text"
              onClick={() => setShowEmoji((v) => !v)}
            >
              ☺
            </button>
            <button
              type="button"
              aria-label="GIF (coming soon)"
              className="grid h-9 w-9 place-items-center rounded-full text-[10px] font-semibold tracking-wide text-text-muted transition-colors hover:bg-white/5 hover:text-text"
              onClick={() => {
                setGifHint(true);
                window.setTimeout(() => setGifHint(false), 1800);
              }}
            >
              GIF
            </button>
          </div>

          <div className="relative min-w-0 flex-1">
            <AnimatePresence>
              {showEmoji ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="absolute bottom-full left-0 mb-2 grid max-h-40 w-full max-w-xs grid-cols-8 gap-0.5 overflow-y-auto rounded-xl border border-border bg-[#121214] p-2 shadow-xl"
                >
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      className="grid h-8 w-8 place-items-center rounded-lg text-base hover:bg-white/5"
                      onClick={() => {
                        setBody((b) => b + e);
                        setShowEmoji(false);
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
            <textarea
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              rows={1}
              placeholder="Message…"
              className="max-h-32 min-h-[42px] w-full resize-none rounded-2xl border border-border bg-surface/50 px-4 py-2.5 text-sm text-text outline-none transition-colors placeholder:text-text-muted focus:border-metal/40"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void doSend();
                }
              }}
            />
            <AnimatePresence>
              {gifHint ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute -top-7 left-0 text-[10px] text-text-muted"
                >
                  GIF search coming soon
                </motion.p>
              ) : null}
            </AnimatePresence>
          </div>

          <button
            type="button"
            disabled={pending || (!body.trim() && !imageUrl)}
            onClick={() => void doSend()}
            className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-white text-bg transition-opacity disabled:opacity-40"
            aria-label="Send"
          >
            <SendIcon />
          </button>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox ? (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
          >
            <button
              type="button"
              className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white"
              onClick={() => setLightbox(null)}
              aria-label="Close"
            >
              ✕
            </button>
            <motion.div
              className="relative h-[min(80vh,720px)] w-full max-w-3xl"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={lightbox}
                alt=""
                fill
                className="object-contain"
                sizes="90vw"
              />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function MoreIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 12L20 4L13 20L11 13L4 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MessagesEmptyPane() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-[#0c0c0e] px-6 text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-metal">
        Direct messages
      </p>
      <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-text">
        Your garage chats
      </h2>
      <p className="mt-2 max-w-sm text-sm text-text-muted">
        Pick a conversation from the list, or message someone from their
        profile.
      </p>
    </div>
  );
}
