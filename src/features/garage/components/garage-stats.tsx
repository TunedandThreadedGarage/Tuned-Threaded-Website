"use client";

import Link from "next/link";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { GarageProfile } from "@/types/garage";

export function GarageStatsStrip({
  profile,
}: {
  profile: GarageProfile;
}) {
  const { stats, username } = profile;

  const primary = [
    {
      label: "Followers",
      value: stats.followers,
      href: `/garage/${username}/followers`,
    },
    {
      label: "Following",
      value: stats.following,
      href: `/garage/${username}/following`,
    },
    { label: "Vehicles", value: stats.vehicles },
    { label: "Builds", value: stats.builds },
    { label: "Journal Entries", value: stats.journalEntries },
    { label: "Completed Projects", value: stats.completedProjects },
    { label: "Horsepower", value: stats.combinedHorsepower, suffix: " hp" },
    { label: "Reputation Score", value: stats.reputationScore },
  ];

  return (
    <section className="mx-auto mt-10 w-full max-w-7xl px-5 md:px-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {primary.map((stat) => {
          const content = (
            <Card className="h-full px-4 py-5 transition-colors hover:border-border-strong">
              <p className="text-[10px] uppercase tracking-[0.16em] text-foreground-subtle">
                {stat.label}
              </p>
              <p className="mt-3 font-[family-name:var(--font-instrument)] text-2xl text-foreground md:text-3xl">
                <AnimatedCounter
                  value={stat.value}
                  suffix={"suffix" in stat ? stat.suffix : ""}
                />
              </p>
            </Card>
          );

          return stat.href ? (
            <Link key={stat.label} href={stat.href} className="block">
              {content}
            </Link>
          ) : (
            <div key={stat.label}>{content}</div>
          );
        })}
      </div>
    </section>
  );
}

export function GarageStatsSection({ profile }: { profile: GarageProfile }) {
  const { stats } = profile;

  const rows = [
    { label: "Vehicles Owned", value: String(stats.vehicles) },
    { label: "Builds Completed", value: String(stats.completedProjects) },
    { label: "Journal Entries", value: String(stats.journalEntries) },
    { label: "Followers", value: stats.followers.toLocaleString() },
    { label: "Following", value: stats.following.toLocaleString() },
    { label: "Years Building", value: String(stats.yearsBuilding) },
    { label: "Favorite Brand", value: profile.favoriteManufacturer },
    { label: "Favorite Engine", value: profile.favoriteEngine },
    {
      label: "Total Horsepower",
      value: `${stats.combinedHorsepower.toLocaleString()} hp`,
    },
    {
      label: "Estimated Money Invested",
      value: formatCurrency(stats.estimatedInvested),
    },
  ];

  return (
    <section className="mx-auto mt-16 w-full max-w-7xl px-5 md:px-8">
      <div className="mb-8">
        <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-foreground-subtle">
          Garage Stats
        </p>
        <h2 className="font-[family-name:var(--font-instrument)] text-3xl tracking-tight md:text-4xl">
          The numbers behind the bay
        </h2>
      </div>

      <div className="premium-card overflow-hidden p-0">
        <dl className="divide-y divide-border">
          {rows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[1.2fr_1fr] gap-4 px-5 py-4 md:px-7"
            >
              <dt className="text-sm text-foreground-muted">{row.label}</dt>
              <dd className="text-right text-sm text-foreground md:text-base">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
