export const JOURNAL_CATEGORIES = [
  "Build Log",
  "Maintenance",
  "Mod Install",
  "Track Day",
  "Parts Haul",
  "Failure",
  "Win",
  "General",
] as const;

export type JournalCategory = (typeof JOURNAL_CATEGORIES)[number];
