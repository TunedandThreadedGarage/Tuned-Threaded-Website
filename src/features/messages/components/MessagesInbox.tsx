"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Avatar } from "@/components/garage-profile/Avatar";
import type { ConversationListItem } from "@/features/messages/actions";
import {
  acceptMessageRequest,
  declineMessageRequest,
  deleteConversation,
  blockUser,
} from "@/features/messages/actions";

function formatTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function MessagesInbox({
  initialItems,
  mode = "inbox",
}: {
  initialItems: ConversationListItem[];
  mode?: "inbox" | "requests";
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [items, setItems] = useState(initialItems);
  const [pending, start] = useTransition();

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items;
    return items.filter(
      (i) =>
        i.peer.username?.toLowerCase().includes(query) ||
        i.peer.displayName?.toLowerCase().includes(query) ||
        i.lastMessagePreview?.toLowerCase().includes(query),
    );
  }, [items, q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
            Messages
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-text">
            {mode === "requests" ? "Message requests" : "Inbox"}
          </h1>
        </div>
        <div className="flex gap-3 text-sm">
          <Link
            href="/messages"
            className={
              mode === "inbox" ? "text-text" : "text-text-muted hover:text-text"
            }
          >
            Inbox
          </Link>
          <Link
            href="/messages/requests"
            className={
              mode === "requests"
                ? "text-text"
                : "text-text-muted hover:text-text"
            }
          >
            Requests
          </Link>
        </div>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search conversations…"
        className="w-full border border-border bg-surface px-3 py-2.5 text-sm text-text placeholder:text-text-muted"
      />

      {filtered.length === 0 ? (
        <p className="border border-dashed border-border px-5 py-12 text-center text-sm text-text-muted">
          {mode === "requests"
            ? "No message requests."
            : "No conversations yet."}
        </p>
      ) : (
        <ul className="divide-y divide-border border border-border">
          {filtered.map((item) => (
            <li key={item.id} className="flex items-stretch gap-0">
              <Link
                href={`/messages/${item.id}`}
                className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.03]"
              >
                <Avatar
                  url={item.peer.avatarUrl}
                  name={item.peer.displayName ?? item.peer.username}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-text">
                      {item.peer.displayName ?? item.peer.username ?? "Member"}
                      {item.unread ? (
                        <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-accent align-middle" />
                      ) : null}
                    </p>
                    <span className="shrink-0 text-[11px] text-text-muted">
                      {formatTime(item.lastMessageAt)}
                    </span>
                  </div>
                  <p className="truncate text-xs text-text-muted">
                    @{item.peer.username}
                    {item.lastMessagePreview
                      ? ` · ${item.lastMessagePreview}`
                      : ""}
                  </p>
                </div>
              </Link>
              <div className="flex shrink-0 flex-col justify-center gap-1 border-l border-border px-2 py-2">
                {mode === "requests" ? (
                  <>
                    <button
                      type="button"
                      disabled={pending}
                      className="px-2 py-1 text-[11px] text-text hover:underline"
                      onClick={() =>
                        start(async () => {
                          await acceptMessageRequest(item.id);
                          setItems((prev) => prev.filter((x) => x.id !== item.id));
                          router.refresh();
                        })
                      }
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      className="px-2 py-1 text-[11px] text-text-muted hover:text-accent"
                      onClick={() =>
                        start(async () => {
                          await declineMessageRequest(item.id);
                          setItems((prev) => prev.filter((x) => x.id !== item.id));
                        })
                      }
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      className="px-2 py-1 text-[11px] text-text-muted hover:text-accent"
                      onClick={() =>
                        start(async () => {
                          await blockUser(item.peer.id);
                          setItems((prev) => prev.filter((x) => x.id !== item.id));
                        })
                      }
                    >
                      Block
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={pending}
                    className="px-2 py-1 text-[11px] text-text-muted hover:text-accent"
                    onClick={() =>
                      start(async () => {
                        if (!window.confirm("Delete this conversation?")) return;
                        await deleteConversation(item.id);
                        setItems((prev) => prev.filter((x) => x.id !== item.id));
                      })
                    }
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
