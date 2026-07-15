import type { Build, GarageStats, Modification, Profile, Vehicle } from "@/types/database";

export function computeReputation(input: {
  followers: number;
  likesReceived: number;
  builds: number;
  badges: number;
  completedBuilds: number;
}): number {
  return (
    input.followers * 2 +
    input.likesReceived +
    input.builds * 3 +
    input.badges * 5 +
    input.completedBuilds * 5
  );
}

export function sumVehicleHorsepower(vehicles: Pick<Vehicle, "current_hp">[]): number {
  return vehicles.reduce((sum, v) => sum + (v.current_hp ?? 0), 0);
}

export function estimateInvestedCents(
  modifications: Pick<Modification, "cost_cents">[],
  timelineCosts: (number | null)[],
): number {
  const modTotal = modifications.reduce((sum, m) => sum + (m.cost_cents ?? 0), 0);
  const timelineTotal = timelineCosts.reduce((sum, c) => sum + (c ?? 0), 0);
  return modTotal + timelineTotal;
}

export function buildGarageStats(input: {
  profile: Profile;
  followers: number;
  following: number;
  vehicles: Vehicle[];
  builds: Build[];
  journalEntries: number | null;
  badges: number;
  likesReceived: number;
  estimatedInvestedCents: number;
}): GarageStats {
  const completedProjects = input.builds.filter(
    (b) => b.status === "completed" || b.progress_pct >= 100,
  ).length;

  const reputation = computeReputation({
    followers: input.followers,
    likesReceived: input.likesReceived,
    builds: input.builds.length,
    badges: input.badges,
    completedBuilds: completedProjects,
  });

  return {
    followers: input.followers,
    following: input.following,
    vehicles: input.vehicles.length,
    builds: input.builds.length,
    journalEntries: input.journalEntries,
    completedProjects,
    combinedHp: sumVehicleHorsepower(input.vehicles),
    reputation,
    yearsBuilding: input.profile.years_building,
    favoriteBrand: input.profile.favorite_manufacturer,
    favoriteEngine: input.profile.favorite_engine,
    estimatedInvestedCents: input.estimatedInvestedCents,
  };
}

export function formatMemberSince(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function formatMoneyFromCents(cents: number): string {
  if (cents <= 0) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
