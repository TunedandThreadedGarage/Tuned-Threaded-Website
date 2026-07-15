"use client";

import type { GarageStats } from "@/types/database";
import { AnimatedStat } from "@/components/garage-profile/AnimatedStat";
import { FadeIn } from "@/components/ui/FadeIn";

export function GarageStatsGrid({
  stats,
  showJournal,
}: {
  stats: GarageStats;
  showJournal?: boolean;
}) {
  const items: { label: string; value: number }[] = [
    { label: "Followers", value: stats.followers },
    { label: "Following", value: stats.following },
    { label: "Vehicles", value: stats.vehicles },
    { label: "Builds", value: stats.builds },
  ];

  if (showJournal && stats.journalEntries != null) {
    items.push({ label: "Journal Entries", value: stats.journalEntries });
  }

  items.push(
    { label: "Completed Projects", value: stats.completedProjects },
    { label: "Horsepower", value: stats.combinedHp },
    { label: "Reputation", value: stats.reputation },
  );

  return (
    <FadeIn>
      <div className="grid grid-cols-2 gap-x-6 gap-y-8 border border-border bg-surface/40 px-5 py-7 sm:grid-cols-4">
        {items.map((item) => (
          <AnimatedStat key={item.label} value={item.value} label={item.label} />
        ))}
      </div>
    </FadeIn>
  );
}
