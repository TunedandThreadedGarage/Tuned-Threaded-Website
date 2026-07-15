import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadGarageProfileBundle } from "@/lib/garage-profile-data";
import { GarageProfileView } from "@/components/garage-profile/GarageProfileView";

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

  const data = await loadGarageProfileBundle(supabase, profile, {
    includeJournalCount: true,
  });

  return (
    <GarageProfileView
      data={data}
      isOwner
      username={profile.username}
    />
  );
}
