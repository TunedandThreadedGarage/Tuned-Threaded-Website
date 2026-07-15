"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Avatar } from "@/components/garage-profile/Avatar";
import {
  markAllCommunityNotificationsRead,
  markCommunityNotificationRead,
  type CommunityNotificationRow,
} from "@/features/community/actions";
import { relativeTime } from "@/features/community/constants";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export function CommunityNotifications({
  notifications,
}: {
  notifications: CommunityNotificationRow[];
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  if (notifications.length === 0) {
    return (
      <EmptyState
        title="You're all caught up"
        description="Likes, comments, replies, mentions, and follows show up here."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await markAllCommunityNotificationsRead();
              router.refresh();
            })
          }
        >
          Mark all read
        </Button>
      </div>
      <ul className="divide-y divide-border border border-border">
        {notifications.map((note) => {
          const href = note.post_id
            ? `/community?post=${note.post_id}`
            : note.actor?.username
              ? `/garage/${note.actor.username}`
              : "/community";
          return (
            <li
              key={note.id}
              className={`flex items-start gap-4 px-4 py-4 transition-colors hover:bg-surface/40 ${
                note.read_at ? "opacity-60" : ""
              }`}
            >
              <Avatar
                url={note.actor?.avatar_url}
                name={note.actor?.display_name ?? note.actor?.username}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <Link href={href} className="text-sm text-text hover:underline">
                  {note.message ?? "Activity in the community"}
                </Link>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-metal">
                  {note.type} · {relativeTime(note.created_at)}
                </p>
              </div>
              {!note.read_at ? (
                <button
                  type="button"
                  disabled={pending}
                  className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-metal hover:text-text"
                  onClick={() =>
                    start(async () => {
                      await markCommunityNotificationRead(note.id);
                      router.refresh();
                    })
                  }
                >
                  Mark read
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
