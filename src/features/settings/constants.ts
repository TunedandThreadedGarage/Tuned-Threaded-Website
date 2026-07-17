export const SETTINGS_SECTIONS = [
  {
    key: "account",
    href: "/garage/settings/account",
    label: "Account",
    description: "Profile identity and account preferences.",
  },
  {
    key: "privacy",
    href: "/garage/settings/privacy",
    label: "Privacy",
    description: "Mentions, messages, and activity visibility.",
  },
  {
    key: "notifications",
    href: "/garage/settings/notifications",
    label: "Notifications",
    description: "Email, in-app, and push toggles per activity type.",
  },
  {
    key: "password",
    href: "/garage/settings/password",
    label: "Password",
    description: "Update your password and review security emails.",
  },
  {
    key: "connected",
    href: "/garage/settings/connected",
    label: "Connected accounts",
    description: "OAuth providers linked to your Garage.",
  },
  {
    key: "theme",
    href: "/garage/settings/theme",
    label: "Theme",
    description: "Display preferences for Tuned & Threaded.",
  },
  {
    key: "communication",
    href: "/garage/settings/communication",
    label: "Communication",
    description: "Digests, marketing, and overall email cadence.",
  },
  {
    key: "garage",
    href: "/garage/settings/garage",
    label: "Garage",
    description: "Shortcut to the Vehicles hub in The Garage.",
  },
  {
    key: "store",
    href: "/garage/settings/store",
    label: "Store",
    description: "Order emails and purchase history.",
  },
] as const;

export const EMAIL_FREQUENCIES = [
  { value: "instant", label: "Instant" },
  { value: "daily", label: "Daily Digest" },
  { value: "weekly", label: "Weekly Digest" },
  { value: "never", label: "Never" },
] as const;

export type EmailFrequency = (typeof EMAIL_FREQUENCIES)[number]["value"];

export const NOTIFICATION_PREF_EVENTS = [
  { key: "likes", label: "Likes", hint: "Post and build likes" },
  { key: "comments", label: "Comments", hint: "New comments on your content" },
  { key: "replies", label: "Replies", hint: "Replies to your comments" },
  { key: "mentions", label: "Mentions", hint: "When someone @mentions you" },
  { key: "followers", label: "Followers", hint: "New Garage followers" },
  { key: "build_follows", label: "Build follows", hint: "Someone followed your build" },
  { key: "build_saves", label: "Build saves", hint: "Someone saved your build" },
  { key: "shares", label: "Shares", hint: "Posts and builds shared" },
  { key: "messages", label: "Messages", hint: "Direct messages" },
  { key: "vehicle_tags", label: "Vehicle tags", hint: "Your vehicle was tagged" },
  { key: "trending", label: "Trending & featured", hint: "Milestone spotlights" },
  { key: "events", label: "Event invites", hint: "Community events" },
  { key: "marketplace", label: "Marketplace", hint: "Inquiries and purchases" },
  { key: "orders", label: "Orders & shipping", hint: "Shop status updates" },
  { key: "badges", label: "Badges & milestones", hint: "Achievements unlocked" },
] as const;

export type NotificationEventKey =
  (typeof NOTIFICATION_PREF_EVENTS)[number]["key"];

/** Map notification `type` → preference event_key */
export const TYPE_TO_EVENT_KEY: Record<string, NotificationEventKey> = {
  like: "likes",
  build_like: "likes",
  post_like: "likes",
  comment: "comments",
  build_comment: "comments",
  reply: "replies",
  build_reply: "replies",
  mention: "mentions",
  follow: "followers",
  garage_follow: "followers",
  build_follow: "build_follows",
  build_save: "build_saves",
  post_share: "shares",
  message: "messages",
  vehicle_tag: "vehicle_tags",
  build_trending: "trending",
  garage_featured: "trending",
  event_invite: "events",
  marketplace_inquiry: "marketplace",
  order_update: "orders",
  badge_earned: "badges",
  build_milestone: "badges",
};

export const SECURITY_EMAIL_NOTE =
  "Password changed, email changed, new login, new device, and 2FA emails are always sent and cannot be disabled.";

export const DEFAULT_CHANNEL = {
  email_enabled: true,
  in_app_enabled: true,
  push_enabled: false,
} as const;
