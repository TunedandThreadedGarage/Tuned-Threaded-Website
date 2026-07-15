import type { SupabaseClient } from "@supabase/supabase-js";
import type { SkillLevel } from "@/types/database";

export const BADGE_META: Record<
  string,
  { label: string; description: string }
> = {
  beginner: {
    label: "Beginner",
    description: "New to the Tuned & Threaded community.",
  },
  first_build: {
    label: "First Build",
    description: "Published your first build.",
  },
  weekend_wrench: {
    label: "Weekend Wrench",
    description: "Garage rank: Weekend Wrench.",
  },
  engine_builder: {
    label: "Engine Builder",
    description: "Documented engine work on a vehicle.",
  },
  fabricator: {
    label: "Fabricator",
    description: "Hands-on fabrication and custom work.",
  },
  track_veteran: {
    label: "Track Veteran",
    description: "Logged track or quarter-mile results.",
  },
  master_builder: {
    label: "Master Builder",
    description: "Top-tier reputation across the garage.",
  },
  forced_induction: {
    label: "Forced Induction",
    description: "Boosted powertrain notes on a vehicle.",
  },
  community_favorite: {
    label: "Community Favorite",
    description: "Reached 25 followers.",
  },
  top_contributor: {
    label: "Top Contributor",
    description: "Shared 10+ public builds or timeline updates.",
  },
  photographer: {
    label: "Photographer",
    description: "Uploaded 10+ garage or build photos.",
  },
  helpful_member: {
    label: "Helpful Member",
    description: "Left 10+ comments on builds or timeline.",
  },
};

const FORCE_INDUCTION_RE =
  /\b(turbo|supercharger|supercharged|boost|forced induction|twin.?scroll)\b/i;
const ENGINE_RE =
  /\b(engine|motor|heads?|camshaft|pistons?|bottom end|long.?block|crate)\b/i;

async function award(
  supabase: SupabaseClient,
  profileId: string,
  badgeKey: string,
) {
  await supabase.from("profile_badges").upsert(
    { profile_id: profileId, badge_key: badgeKey },
    { onConflict: "profile_id,badge_key", ignoreDuplicates: true },
  );
}

export async function evaluateAndAwardBadges(
  supabase: SupabaseClient,
  profileId: string,
): Promise<void> {
  const [
    { data: profile },
    { count: buildCount },
    { count: publicTimeline },
    { count: followers },
    { count: buildPhotos },
    { count: garagePhotos },
    { count: vehiclePhotos },
    { count: buildComments },
    { count: timelineComments },
    { data: vehicles },
    { data: mods },
    { data: timeline },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("skill_level")
      .eq("id", profileId)
      .maybeSingle(),
    supabase
      .from("builds")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profileId),
    supabase
      .from("vehicle_timeline_entries")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profileId),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", profileId),
    supabase
      .from("build_photos")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profileId),
    supabase
      .from("garage_photos")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profileId),
    supabase
      .from("vehicle_photos")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profileId),
    supabase
      .from("build_comments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profileId),
    supabase
      .from("timeline_entry_comments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profileId),
    supabase
      .from("vehicles")
      .select("engine,notes,build_stage")
      .eq("user_id", profileId),
    supabase
      .from("modifications")
      .select("title,description")
      .eq("user_id", profileId),
    supabase
      .from("vehicle_timeline_entries")
      .select("title,description,parts_installed")
      .eq("user_id", profileId),
  ]);

  if ((buildCount ?? 0) >= 1) {
    await award(supabase, profileId, "first_build");
  }

  if ((profile?.skill_level as SkillLevel | null) === "weekend_wrench") {
    await award(supabase, profileId, "weekend_wrench");
  }

  const textBlob = [
    ...(vehicles ?? []).flatMap((v) => [v.engine, v.notes, v.build_stage]),
    ...(mods ?? []).flatMap((m) => [m.title, m.description]),
    ...(timeline ?? []).flatMap((t) => [
      t.title,
      t.description,
      t.parts_installed,
    ]),
  ]
    .filter(Boolean)
    .join(" ");

  if (ENGINE_RE.test(textBlob)) {
    await award(supabase, profileId, "engine_builder");
  }
  if (FORCE_INDUCTION_RE.test(textBlob)) {
    await award(supabase, profileId, "forced_induction");
  }

  if ((followers ?? 0) >= 25) {
    await award(supabase, profileId, "community_favorite");
  }

  if ((buildCount ?? 0) + (publicTimeline ?? 0) >= 10) {
    await award(supabase, profileId, "top_contributor");
  }

  const photoTotal =
    (buildPhotos ?? 0) + (garagePhotos ?? 0) + (vehiclePhotos ?? 0);
  if (photoTotal >= 10) {
    await award(supabase, profileId, "photographer");
  }

  if ((buildComments ?? 0) + (timelineComments ?? 0) >= 10) {
    await award(supabase, profileId, "helpful_member");
  }
}

export async function refreshReputationCache(
  supabase: SupabaseClient,
  profileId: string,
): Promise<number> {
  const [
    { count: followers },
    { count: builds },
    { count: badges },
    { count: completed },
    { count: likesOnBuilds },
    { count: likesOnTimeline },
  ] = await Promise.all([
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", profileId),
    supabase
      .from("builds")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profileId),
    supabase
      .from("profile_badges")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", profileId),
    supabase
      .from("builds")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profileId)
      .or("status.eq.completed,progress_pct.gte.100"),
    supabase
      .from("build_likes")
      .select("build_id, builds!inner(user_id)", { count: "exact", head: true })
      .eq("builds.user_id", profileId),
    supabase
      .from("timeline_entry_likes")
      .select(
        "entry_id, vehicle_timeline_entries!inner(user_id)",
        { count: "exact", head: true },
      )
      .eq("vehicle_timeline_entries.user_id", profileId),
  ]);

  const { computeReputation } = await import("@/lib/garage-stats");
  const reputation = computeReputation({
    followers: followers ?? 0,
    likesReceived: (likesOnBuilds ?? 0) + (likesOnTimeline ?? 0),
    builds: builds ?? 0,
    badges: badges ?? 0,
    completedBuilds: completed ?? 0,
  });

  await supabase
    .from("profiles")
    .update({ reputation_cached: reputation })
    .eq("id", profileId);

  return reputation;
}
