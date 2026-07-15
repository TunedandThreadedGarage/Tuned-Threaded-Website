export type BuildsTab =
  | "newest"
  | "trending"
  | "most_liked"
  | "completed"
  | "in_progress";

export const BUILDS_TABS: { id: BuildsTab; label: string }[] = [
  { id: "newest", label: "Newest" },
  { id: "trending", label: "Trending" },
  { id: "most_liked", label: "Most Liked" },
  { id: "completed", label: "Completed" },
  { id: "in_progress", label: "In Progress" },
];

export const BUILD_FILTERS = [
  { key: "engine_swap", label: "Engine Swaps" },
  { key: "turbo", label: "Turbo" },
  { key: "supercharged", label: "Supercharged" },
  { key: "na", label: "Naturally Aspirated" },
  { key: "restoration", label: "Restorations" },
  { key: "track", label: "Track Cars" },
  { key: "street", label: "Street Cars" },
  { key: "drag", label: "Drag Cars" },
  { key: "off_road", label: "Off Road" },
  { key: "show", label: "Show Cars" },
  { key: "drift", label: "Drift" },
] as const;

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

export function formatMoney(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export const GIF_PLACEHOLDERS = [
  {
    label: "Boost",
    url:
      "data:image/svg+xml," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect fill="#1c1c1f" width="320" height="180"/><text x="160" y="96" fill="#c4121a" font-family="monospace" font-size="22" text-anchor="middle">BOOST</text></svg>`,
      ),
  },
  {
    label: "Launch",
    url:
      "data:image/svg+xml," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect fill="#1c1c1f" width="320" height="180"/><text x="160" y="96" fill="#f2f2f0" font-family="monospace" font-size="22" text-anchor="middle">LAUNCH</text></svg>`,
      ),
  },
  {
    label: "Finish",
    url:
      "data:image/svg+xml," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect fill="#1c1c1f" width="320" height="180"/><text x="160" y="96" fill="#c4121a" font-family="monospace" font-size="22" text-anchor="middle">FINISH</text></svg>`,
      ),
  },
] as const;
