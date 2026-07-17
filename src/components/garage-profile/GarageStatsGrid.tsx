"use client";

import { useState } from "react";
import type { GarageStats } from "@/types/database";
import { AnimatedStat } from "@/components/garage-profile/AnimatedStat";
import { FadeIn } from "@/components/ui/FadeIn";
import { FollowListModal } from "@/features/social/components/FollowListModal";

export function GarageStatsGrid({
  stats,
  showJournal,
  username,
}: {
  stats: GarageStats;
  showJournal?: boolean;
  username?: string | null;
}) {
  const [modal, setModal] = useState<"followers" | "following" | null>(null);

  const items: {
    label: string;
    value: number;
    onClick?: () => void;
  }[] = [
    {
      label: "Followers",
      value: stats.followers,
      onClick: username ? () => setModal("followers") : undefined,
    },
    {
      label: "Following",
      value: stats.following,
      onClick: username ? () => setModal("following") : undefined,
    },
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
        {items.map((item) =>
          item.onClick ? (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className="group text-left transition-opacity hover:opacity-90"
            >
              <AnimatedStat value={item.value} label={item.label} />
              <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-metal opacity-0 transition-opacity group-hover:opacity-100">
                View list
              </span>
            </button>
          ) : (
            <AnimatedStat
              key={item.label}
              value={item.value}
              label={item.label}
            />
          ),
        )}
      </div>

      {username ? (
        <FollowListModal
          open={modal !== null}
          onClose={() => setModal(null)}
          username={username}
          mode={modal ?? "followers"}
        />
      ) : null}
    </FadeIn>
  );
}
