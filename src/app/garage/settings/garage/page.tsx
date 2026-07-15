import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VehicleManager } from "@/features/profile/components/VehicleManager";
import { SettingsShell } from "@/features/settings/components/SettingsShell";

export default async function GarageSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/garage/sign-in?next=/garage/settings/garage");

  const [{ data: profile }, { data: vehicles }, { data: mods }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at"),
      supabase
        .from("modifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at"),
    ]);

  if (!profile) redirect("/garage/onboarding");

  return (
    <SettingsShell
      title="Garage"
      description="Vehicles and modifications that power your public garage profile."
    >
      <VehicleManager
        vehicles={vehicles ?? []}
        modifications={mods ?? []}
        username={profile.username}
      />
    </SettingsShell>
  );
}
