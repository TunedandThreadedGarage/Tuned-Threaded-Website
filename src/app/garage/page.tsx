import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadGarageProfileBundle } from "@/lib/garage-profile-data";
import { loadJournalFeed } from "@/features/journal/actions";
import { GarageHubExperience } from "@/features/garage-hub/components/GarageHubExperience";
import type { GarageHubData } from "@/features/garage-hub/components/GarageHubExperience";

export default async function GarageHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/garage/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile?.username) redirect("/garage/onboarding");

  const [
    profileBundle,
    vehiclesRes,
    vehiclePhotosRes,
    modsRes,
    buildsRes,
    buildPhotosRes,
    albumsRes,
    galleryRes,
    journalFeed,
    journalBuildsRes,
  ] = await Promise.all([
    loadGarageProfileBundle(supabase, profile, { includeJournalCount: true }),
    supabase
      .from("vehicles")
      .select("*")
      .eq("user_id", user.id)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("vehicle_photos")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order")
      .order("created_at", { ascending: false }),
    supabase
      .from("modifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("builds")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("build_photos").select("*").eq("user_id", user.id),
    supabase
      .from("garage_albums")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("garage_photos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    loadJournalFeed({ scope: "mine" }),
    supabase
      .from("builds")
      .select("id, title")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(40),
  ]);

  const builds = buildsRes.data ?? [];
  const buildIds = new Set(builds.map((b) => b.id));
  const buildPhotos = (buildPhotosRes.data ?? []).filter((p) =>
    buildIds.has(p.build_id),
  );

  const data: GarageHubData = {
    profileBundle,
    username: profile.username,
    userId: user.id,
    vehicles: vehiclesRes.data ?? [],
    vehiclePhotos: vehiclePhotosRes.data ?? [],
    modifications: modsRes.data ?? [],
    builds,
    buildPhotos,
    albums: albumsRes.data ?? [],
    galleryPhotos: galleryRes.data ?? [],
    journalItems: journalFeed.items,
    journalBuilds: journalBuildsRes.data ?? [],
  };

  return <GarageHubExperience data={data} />;
}
