import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildGarageStats,
  estimateInvestedCents,
} from "@/lib/garage-stats";
import type {
  Build,
  BuildPhoto,
  GarageAlbum,
  GaragePhoto,
  GarageStats,
  Profile,
  ProfileBadge,
  Vehicle,
} from "@/types/database";

export type GarageProfileBundle = {
  profile: Profile;
  vehicles: Vehicle[];
  builds: Build[];
  photosByBuild: Map<string, BuildPhoto>;
  badgeKeys: string[];
  stats: GarageStats;
  albums: GarageAlbum[];
  galleryPreview: GaragePhoto[];
};

function normalizeProfile(raw: Profile): Profile {
  return {
    ...raw,
    favorite_manufacturer: raw.favorite_manufacturer ?? null,
    favorite_engine: raw.favorite_engine ?? null,
    favorite_build_style: raw.favorite_build_style ?? null,
    favorite_quote: raw.favorite_quote ?? null,
    youtube_url: raw.youtube_url ?? null,
    instagram_url: raw.instagram_url ?? null,
    tiktok_url: raw.tiktok_url ?? null,
    website_url: raw.website_url ?? null,
    accent_color: raw.accent_color ?? "#c4121a",
    years_building: raw.years_building ?? null,
    reputation_cached: raw.reputation_cached ?? 0,
  };
}

function normalizeVehicle(raw: Vehicle): Vehicle {
  return {
    ...raw,
    photo_url: raw.photo_url ?? null,
    nickname: raw.nickname ?? null,
    engine: raw.engine ?? null,
    transmission: raw.transmission ?? null,
    mileage: raw.mileage ?? null,
    current_hp: raw.current_hp ?? null,
    target_hp: raw.target_hp ?? null,
    build_stage: raw.build_stage ?? null,
    progress_pct: raw.progress_pct ?? 0,
  };
}

function normalizeBuild(raw: Build): Build {
  return {
    ...raw,
    progress_pct: raw.progress_pct ?? 0,
    current_stage: raw.current_stage ?? null,
    upcoming_stage: raw.upcoming_stage ?? null,
    estimated_completion: raw.estimated_completion ?? null,
    status: raw.status ?? "active",
    cover_photo_url: raw.cover_photo_url ?? null,
    tags: raw.tags ?? [],
    view_count: raw.view_count ?? 0,
    is_featured: raw.is_featured ?? false,
    is_staff_pick: raw.is_staff_pick ?? false,
    labor_hours_cached: raw.labor_hours_cached ?? null,
    invested_cents_cached: raw.invested_cents_cached ?? null,
  };
}

export async function loadGarageProfileBundle(
  supabase: SupabaseClient,
  profileInput: Profile,
  options: { includeJournalCount: boolean },
): Promise<GarageProfileBundle> {
  const profile = normalizeProfile(profileInput);
  const [
    { data: vehicles },
    { data: builds },
    { count: followers },
    { count: following },
    { data: badgeRows },
    { data: mods },
    { data: timeline },
    { data: albums },
    journalResult,
  ] = await Promise.all([
    supabase
      .from("vehicles")
      .select("*")
      .eq("user_id", profile.id)
      .order("is_primary", { ascending: false }),
    supabase
      .from("builds")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", profile.id),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", profile.id),
    supabase
      .from("profile_badges")
      .select("badge_key")
      .eq("profile_id", profile.id),
    supabase.from("modifications").select("cost_cents").eq("user_id", profile.id),
    supabase
      .from("vehicle_timeline_entries")
      .select("cost_cents")
      .eq("user_id", profile.id),
    supabase
      .from("garage_albums")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(6),
    options.includeJournalCount
      ? supabase
          .from("journal_entries")
          .select("*", { count: "exact", head: true })
          .eq("user_id", profile.id)
      : Promise.resolve({ count: null as number | null }),
  ]);

  const vehicleList = ((vehicles ?? []) as Vehicle[]).map(normalizeVehicle);
  const buildList = ((builds ?? []) as Build[]).map(normalizeBuild);
  const badgeKeys = ((badgeRows ?? []) as ProfileBadge[]).map((b) => b.badge_key);

  const buildIds = buildList.map((b) => b.id);
  const { data: photos } =
    buildIds.length > 0
      ? await supabase
          .from("build_photos")
          .select("*")
          .in("build_id", buildIds)
          .order("sort_order", { ascending: true })
      : { data: [] as BuildPhoto[] };

  const photosByBuild = new Map<string, BuildPhoto>();
  for (const photo of (photos ?? []) as BuildPhoto[]) {
    if (!photosByBuild.has(photo.build_id)) {
      photosByBuild.set(photo.build_id, photo);
    }
  }

  const albumIds = ((albums ?? []) as GarageAlbum[]).map((a) => a.id);
  const { data: galleryPreview } =
    albumIds.length > 0
      ? await supabase
          .from("garage_photos")
          .select("*")
          .in("album_id", albumIds)
          .order("created_at", { ascending: false })
          .limit(8)
      : { data: [] as GaragePhoto[] };

  const { count: likesOnBuilds } = await supabase
    .from("build_likes")
    .select("build_id, builds!inner(user_id)", { count: "exact", head: true })
    .eq("builds.user_id", profile.id);

  const invested = estimateInvestedCents(
    mods ?? [],
    (timeline ?? []).map((t) => t.cost_cents),
  );

  const stats = buildGarageStats({
    profile,
    followers: followers ?? 0,
    following: following ?? 0,
    vehicles: vehicleList,
    builds: buildList,
    journalEntries: options.includeJournalCount
      ? (journalResult.count ?? 0)
      : null,
    badges: badgeKeys.length,
    likesReceived: likesOnBuilds ?? 0,
    estimatedInvestedCents: invested,
  });

  return {
    profile,
    vehicles: vehicleList,
    builds: buildList,
    photosByBuild,
    badgeKeys,
    stats,
    albums: (albums ?? []) as GarageAlbum[],
    galleryPreview: (galleryPreview ?? []) as GaragePhoto[],
  };
}
