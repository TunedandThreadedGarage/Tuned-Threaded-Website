import {
  DEMO_COMMENTS,
  DEMO_GARAGE,
  DEMO_VEHICLE_DETAILS,
} from "@/lib/garage/demo-data";
import type {
  FullGarage,
  GarageProfile,
  PublicUserSummary,
  TimelineComment,
  VehicleDetail,
} from "@/types/garage";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function findDemoUser(username: string): PublicUserSummary | undefined {
  return [...DEMO_GARAGE.followers, ...DEMO_GARAGE.following].find(
    (user) => user.username === username,
  );
}

function stubGarageFromUser(user: PublicUserSummary): FullGarage {
  return {
    profile: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bannerUrl: DEMO_GARAGE.profile.bannerUrl,
      accentColor: "#C8B49A",
      bio: `${user.displayName}'s garage on Tuned & Threaded.`,
      location: user.location ?? "",
      memberSince: "2023-01-01",
      garageRank: user.garageRank,
      favoriteManufacturer: "Chevrolet",
      favoriteEngine: "LS",
      favoriteBuildStyle: "Street",
      socialLinks: {},
      badges: ["first_build", "weekend_wrench"],
      stats: {
        followers: 120,
        following: 40,
        vehicles: 1,
        builds: 1,
        journalEntries: 8,
        completedProjects: 0,
        combinedHorsepower: 450,
        reputationScore: 64,
        yearsBuilding: 4,
        estimatedInvested: 12000,
      },
    },
    vehicles: [],
    gallery: [],
    followers: [],
    following: [],
  };
}

export async function getGarageByUsername(
  username: string,
): Promise<FullGarage | null> {
  const normalized = username.toLowerCase();

  if (normalized === DEMO_GARAGE.profile.username) {
    return DEMO_GARAGE;
  }

  const related = findDemoUser(normalized);
  if (related) {
    return stubGarageFromUser(related);
  }

  if (isSupabaseConfigured()) {
    return getGarageFromSupabase(normalized);
  }

  return null;
}

async function getGarageFromSupabase(
  username: string,
): Promise<FullGarage | null> {
  // Placeholder for live Supabase joins. Until tables are populated,
  // fall back to demo when username matches so the product remains previewable.
  if (username === DEMO_GARAGE.profile.username) {
    return DEMO_GARAGE;
  }
  return null;
}

export async function getVehicleDetail(
  username: string,
  vehicleId: string,
): Promise<{ profile: GarageProfile; detail: VehicleDetail } | null> {
  const garage = await getGarageByUsername(username);
  if (!garage) return null;

  if (!isSupabaseConfigured()) {
    const detail = DEMO_VEHICLE_DETAILS[vehicleId];
    if (!detail) return null;
    return { profile: garage.profile, detail };
  }

  const detail = DEMO_VEHICLE_DETAILS[vehicleId];
  if (!detail) return null;
  return { profile: garage.profile, detail };
}

export async function getTimelineComments(
  updateId: string,
): Promise<TimelineComment[]> {
  return DEMO_COMMENTS[updateId] ?? [];
}

export async function listFeaturedGarages(): Promise<GarageProfile[]> {
  return [DEMO_GARAGE.profile];
}
