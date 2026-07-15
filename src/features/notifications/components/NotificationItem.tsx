"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { motion } from "framer-motion";
import { Avatar } from "@/components/garage-profile/Avatar";
import {
  deleteNotification,
  markNotificationRead,
} from "@/features/notifications/actions";
import {
  NOTIFICATION_ACTION_LABEL,
  relativeTime,
  resolveNotificationHref,
} from "@/features/notifications/constants";
import type { NotificationFeedItem } from "@/features/notifications/types";

export function NotificationItem({
  item,
  animateIn,
  onRemoved,
}: {
  item: NotificationFeedItem;
  animateIn?: boolean;
  onRemoved?: (id: string) => void;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const unread = !item.readAt;
  const systemTypes = new Set([
    "build_trending",
    "garage_featured",
    "marketplace_inquiry",
  ]);
  const isSystem = systemTypes.has(item.type) && !item.actor;
  const username =
    item.actor?.displayName ?? item.actor?.username ?? "Tuned & Threaded";
  const action =
    item.action ??
    NOTIFICATION_ACTION_LABEL[item.type] ??
    item.message;
  const href = resolveNotificationHref({
    href: item.href,
    type: item.type,
    entity_type: item.entityType,
    entity_id: item.entityId,
    actorUsername: item.actor?.username,
  });

  function open() {
    start(async () => {
      if (unread) await markNotificationRead(item.id);
      router.push(href);
    });
  }

  return (
    <motion.li
      layout
      initial={animateIn ? { opacity: 0, y: -12 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, margin: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={`relative flex items-start gap-3 border-b border-border px-4 py-4 transition-colors hover:bg-surface/35 ${
        unread ? "bg-accent-soft/20" : ""
      }`}
    >
      {unread ? (
        <span
          aria-hidden
          className="absolute left-0 top-0 h-full w-[2px] bg-accent"
        />
      ) : null}

      <button
        type="button"
        onClick={open}
        className="flex min-w-0 flex-1 items-start gap-3 text-left"
        disabled={pending}
      >
        <Avatar
          url={item.actor?.avatarUrl}
          name={username}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug text-text">
            {isSystem ? (
              <span className="text-text-muted">{action}</span>
            ) : (
              <>
                <span className="font-medium">{username}</span>{" "}
                <span className="text-text-muted">{action}</span>
              </>
            )}
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-metal">
            {relativeTime(item.createdAt)}
          </p>
        </div>
        {item.thumbnailUrl ? (
          <span className="relative h-12 w-12 shrink-0 overflow-hidden border border-border bg-surface-elevated">
            <Image
              src={item.thumbnailUrl}
              alt=""
              fill
              className="object-cover"
              sizes="48px"
            />
          </span>
        ) : null}
      </button>

      <div className="flex shrink-0 flex-col items-end gap-2">
        {unread ? (
          <span
            className="h-2 w-2 rounded-full bg-accent"
            title="Unread"
            aria-label="Unread"
          />
        ) : null}
        <button
          type="button"
          disabled={pending}
          className="font-mono text-[10px] uppercase tracking-[0.14em] text-metal hover:text-text"
          onClick={() =>
            start(async () => {
              await deleteNotification(item.id);
              onRemoved?.(item.id);
            })
          }
        >
          Delete
        </button>
        {item.actor?.username ? (
          <Link
            href={`/garage/${item.actor.username}`}
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-metal hover:text-text"
          >
            Profile
          </Link>
        ) : null}
      </div>
    </motion.li>
  );
}
