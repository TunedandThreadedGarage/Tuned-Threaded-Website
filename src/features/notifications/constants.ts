export const NOTIFICATION_TYPES = [
  "garage_follow",
  "build_follow",
  "post_like",
  "build_like",
  "comment",
  "reply",
  "mention",
  "vehicle_tag",
  "build_save",
  "post_share",
  "build_trending",
  "garage_featured",
  "event_invite",
  "marketplace_inquiry",
  "message",
  "message_request",
  "journal_like",
  "journal_comment",
  "gallery_like",
  "gallery_comment",
  "order_update",
  "order_confirmation",
  "order_shipped",
  "order_delivered",
  "shipping_update",
  "badge_earned",
  "build_milestone",
  // Legacy / hub variants already in the wild
  "follow",
  "like",
  "build_comment",
  "build_reply",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number] | string;

/** Short action copy shown beside username. */
export const NOTIFICATION_ACTION_LABEL: Record<string, string> = {
  follow: "followed your Garage",
  garage_follow: "followed your Garage",
  build_follow: "followed your Build",
  like: "liked your build",
  build_like: "liked your build",
  post_like: "liked your post",
  journal_like: "liked your journal entry",
  gallery_like: "liked your gallery photo",
  comment: "commented",
  build_comment: "commented",
  journal_comment: "commented on your journal",
  gallery_comment: "commented on your photo",
  reply: "replied",
  build_reply: "replied",
  mention: "mentioned you",
  vehicle_tag: "tagged your vehicle",
  build_save: "saved your build",
  post_share: "shared your post",
  build_trending: "Your build reached Trending",
  garage_featured: "Your Garage was Featured",
  event_invite: "invited you to an event",
  marketplace_inquiry: "sent a Marketplace inquiry",
  message: "sent you a message",
  message_request: "sent a message request",
  order_confirmation: "Order confirmed",
  order_shipped: "Order shipped",
  order_delivered: "Order delivered",
  shipping_update: "Shipping update",
  badge_earned: "Badge earned",
};

export const PAGE_SIZE = 20;

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.max(0, Math.floor(diff / 1000));
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return new Date(iso).toLocaleDateString();
}

export function startOfLocalDay(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export type NotificationGroupKey = "today" | "yesterday" | "earlier";

export function groupKeyFor(iso: string): NotificationGroupKey {
  const created = new Date(iso);
  const today = startOfLocalDay();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (created >= today) return "today";
  if (created >= yesterday) return "yesterday";
  return "earlier";
}

export const GROUP_LABELS: Record<NotificationGroupKey, string> = {
  today: "Today",
  yesterday: "Yesterday",
  earlier: "Earlier",
};

export function resolveNotificationHref(input: {
  href?: string | null;
  type: string;
  entity_type?: string | null;
  entity_id?: string | null;
  actorUsername?: string | null;
}): string {
  if (input.href) return input.href;
  if (input.entity_type === "build" && input.entity_id) {
    return `/builds/${input.entity_id}`;
  }
  if (input.entity_type === "community_post" && input.entity_id) {
    return `/community?post=${input.entity_id}`;
  }
  if (input.entity_type === "vehicle" && input.entity_id && input.actorUsername) {
    return `/garage/${input.actorUsername}/vehicles/${input.entity_id}`;
  }
  if (
    (input.type === "follow" || input.type === "garage_follow") &&
    input.actorUsername
  ) {
    return `/garage/${input.actorUsername}`;
  }
  if (input.entity_type === "profile" && input.actorUsername) {
    return `/garage/${input.actorUsername}`;
  }
  if (input.type === "marketplace_inquiry") return "/garage";
  if (input.type === "event_invite") return "/community";
  if (input.type === "message_request") return "/messages/requests";
  if (input.type === "message") return "/messages";
  if (
    input.type === "order_confirmation" ||
    input.type === "order_shipped" ||
    input.type === "order_delivered" ||
    input.type === "shipping_update" ||
    input.type === "order_update"
  ) {
    return "/garage/orders";
  }
  return "/notifications";
}
