import type { CommunityPostType } from "@/types/database";

export const COMMUNITY_POST_TYPES: {
  value: CommunityPostType;
  label: string;
}[] = [
  { value: "photo", label: "Photo Post" },
  { value: "video", label: "Video Post" },
  { value: "build_update", label: "Build Update" },
  { value: "maintenance", label: "Maintenance Update" },
  { value: "dyno", label: "Dyno Result" },
  { value: "quarter_mile", label: "Quarter Mile" },
  { value: "question", label: "Question" },
  { value: "discussion", label: "Discussion" },
  { value: "status", label: "Status Update" },
];

export const COMMUNITY_FILTERS = [
  { key: "ford", label: "Ford" },
  { key: "chevy", label: "Chevy" },
  { key: "dodge", label: "Dodge" },
  { key: "toyota", label: "Toyota" },
  { key: "honda", label: "Honda" },
  { key: "nissan", label: "Nissan" },
  { key: "bmw", label: "BMW" },
  { key: "audi", label: "Audi" },
  { key: "jdm", label: "JDM" },
  { key: "muscle", label: "Muscle" },
  { key: "truck", label: "Truck" },
  { key: "motorcycle", label: "Motorcycle" },
  { key: "turbo", label: "Turbo" },
  { key: "supercharged", label: "Supercharged" },
  { key: "na", label: "Naturally Aspirated" },
  { key: "drag", label: "Drag" },
  { key: "drift", label: "Drift" },
  { key: "off_road", label: "Off Road" },
] as const;

export type CommunityTab = "following" | "trending" | "newest" | "nearby";

export const COMMUNITY_TABS: { id: CommunityTab; label: string }[] = [
  { id: "following", label: "Following" },
  { id: "trending", label: "Trending" },
  { id: "newest", label: "Newest" },
  { id: "nearby", label: "Nearby" },
];

export const POST_TYPE_LABELS: Record<CommunityPostType, string> = {
  photo: "Photo",
  video: "Video",
  build_update: "Build update",
  maintenance: "Maintenance",
  dyno: "Dyno",
  quarter_mile: "Quarter mile",
  question: "Question",
  discussion: "Discussion",
  status: "Status",
};

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const sec = Math.max(1, Math.floor((now - then) / 1000));
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

export function youtubeEmbedId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.slice(1) || null;
    }
    if (u.hostname.includes("youtube.com")) {
      return u.searchParams.get("v");
    }
  } catch {
    return null;
  }
  return null;
}

/** Soft reputation bands for feed display (garage rank stays skill_level). */
export function reputationBand(score: number | null | undefined): string {
  const n = score ?? 0;
  if (n >= 200) return "Master Builder";
  if (n >= 120) return "Track Veteran";
  if (n >= 70) return "Fabricator";
  if (n >= 30) return "Weekend Wrench";
  if (n >= 10) return "Engine Builder";
  return "Beginner";
}

/** Local SVG placeholders until a GIF provider is wired. */
export const GIF_PLACEHOLDERS = [
  {
    label: "Boost",
    url: "data:image/svg+xml," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect fill="#1c1c1f" width="320" height="180"/><text x="160" y="96" fill="#c4121a" font-family="monospace" font-size="22" text-anchor="middle">BOOST</text></svg>`,
      ),
  },
  {
    label: "Launch",
    url: "data:image/svg+xml," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect fill="#1c1c1f" width="320" height="180"/><text x="160" y="96" fill="#f2f2f0" font-family="monospace" font-size="22" text-anchor="middle">LAUNCH</text></svg>`,
      ),
  },
  {
    label: "Burnout",
    url: "data:image/svg+xml," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect fill="#1c1c1f" width="320" height="180"/><text x="160" y="96" fill="#b8b8c0" font-family="monospace" font-size="22" text-anchor="middle">BURNOUT</text></svg>`,
      ),
  },
  {
    label: "Finish",
    url: "data:image/svg+xml," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect fill="#1c1c1f" width="320" height="180"/><text x="160" y="96" fill="#c4121a" font-family="monospace" font-size="22" text-anchor="middle">FINISH</text></svg>`,
      ),
  },
] as const;
