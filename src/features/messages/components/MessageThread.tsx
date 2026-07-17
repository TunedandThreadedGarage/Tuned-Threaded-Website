"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/garage-profile/Avatar";
import { MediaUpload } from "@/components/media/MediaUpload";
import { Button } from "@/components/ui/Button";
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

const EMOJIS = [
  "😀", "😂", "🔥", "❤️", "👍", "👎", "😮", "😢",
  "🙌", "💪", "🏎️", "🛠️", "🎉", "✅", "👀", "💯",
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
  const [peerTyping, setPeerTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimer = useRef<number | null>(null);
  const channelRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  > | null>(null);

  useEffect(() => {
    void markConversationRead(conversationId);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, peerTyping]);

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

  const peerReadMs = peerLastReadAt
    ? new Date(peerLastReadAt).getTime()
    : 0;

  return (
    <div className="flex h-[min(70vh,720px)] flex-col border border-border bg-surface/20">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/messages"
            className="text-sm text-text-muted hover:text-text"
          >
            ←
          </Link>
          {peer ? (
            <>
              <Avatar
                url={peer.avatarUrl}
                name={peer.displayName ?? peer.username}
                size="sm"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text">
                  {peer.displayName ?? peer.username}
                </p>
                <p className="truncate text-xs text-text-muted">
                  @{peer.username}
                  {initialStatus === "request" ? " · Request" : ""}
                </p>
              </div>
            </>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {peer ? (
            <>
              <ReportButton
                targetType="dm_conversation"
                targetId={conversationId}
                targetUserId={peer.id}
                label="Report"
              />
              <button
                type="button"
                className="text-xs text-text-muted hover:text-accent"
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
            </>
          ) : null}
          <button
            type="button"
            className="text-xs text-text-muted hover:text-accent"
            onClick={() =>
              start(async () => {
                if (!window.confirm("Delete conversation?")) return;
                await deleteConversation(conversationId);
                window.location.href = "/messages";
              })
            }
          >
            Delete
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m) => {
          const mine = m.sender_id === userId;
          const seen =
            mine && peerReadMs > 0 && new Date(m.created_at).getTime() <= peerReadMs;
          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] space-y-1 ${
                  mine ? "items-end text-right" : "items-start text-left"
                }`}
              >
                {m.image_url ? (
                  <div className="relative aspect-square w-48 overflow-hidden border border-border">
                    <Image
                      src={m.image_url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="192px"
                    />
                  </div>
                ) : null}
                {m.body.trim() ? (
                  <div
                    className={`inline-block px-3 py-2 text-sm ${
                      mine
                        ? "bg-white text-bg"
                        : "border border-border bg-surface text-text"
                    }`}
                  >
                    {m.body}
                  </div>
                ) : null}
                <p className="text-[10px] text-text-muted">
                  {new Date(m.created_at).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                  {mine && seen ? " · Seen" : ""}
                  {mine ? (
                    <span className="ml-2">
                      <ReportButton
                        targetType="dm_message"
                        targetId={m.id}
                        targetUserId={m.sender_id}
                        label="Report"
                        className="text-[10px]"
                      />
                    </span>
                  ) : (
                    <span className="ml-2">
                      <ReportButton
                        targetType="dm_message"
                        targetId={m.id}
                        targetUserId={m.sender_id}
                        label="Report"
                        className="text-[10px]"
                      />
                    </span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
        {peerTyping ? (
          <p className="text-xs text-text-muted">Typing…</p>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border p-3">
        {error ? <p className="mb-2 text-xs text-accent">{error}</p> : null}
        {imageUrl ? (
          <div className="relative mb-2 h-16 w-16 overflow-hidden border border-border">
            <Image src={imageUrl} alt="" fill className="object-cover" sizes="64px" />
            <button
              type="button"
              className="absolute right-0 top-0 bg-black/70 px-1 text-[10px] text-white"
              onClick={() => setImageUrl(null)}
            >
              ✕
            </button>
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              rows={2}
              placeholder="Write a message…"
              className="w-full resize-none border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-muted"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
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
                      const thread = await loadThread(conversationId);
                      setMessages(thread.messages);
                    }
                  });
                }
              }}
            />
            {showEmoji ? (
              <div className="absolute bottom-full left-0 mb-1 grid grid-cols-8 gap-1 border border-border bg-[#0c0c0e] p-2">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    className="grid h-8 w-8 place-items-center text-base hover:bg-white/5"
                    onClick={() => {
                      setBody((b) => b + e);
                      setShowEmoji(false);
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="border border-border px-2 py-2 text-sm"
            onClick={() => setShowEmoji((v) => !v)}
            aria-label="Emoji"
          >
            ☺
          </button>
          <Button
            type="button"
            variant="primary"
            disabled={pending}
            onClick={() =>
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
                  const thread = await loadThread(conversationId);
                  setMessages(thread.messages);
                }
              })
            }
          >
            Send
          </Button>
        </div>
        <div className="mt-2">
          <MediaUpload
            bucket="messages"
            pathPrefix={`${userId}/${conversationId}`}
            accept="image"
            maxFiles={1}
            label="Attach photo"
            onUploaded={(files) => {
              if (files[0]) setImageUrl(files[0].publicUrl);
            }}
          />
        </div>
      </div>
    </div>
  );
}
