import { redirect } from "next/navigation";
import { ProfileSettingsForm } from "@/features/profile/components/ProfileSettingsForm";
import { createClient } from "@/lib/supabase/server";
import { VehicleManager } from "@/features/profile/components/VehicleManager";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/garage/sign-in");

  const [{ data: profile }, { data: vehicles }, { data: mods }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("vehicles").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("modifications").select("*").eq("user_id", user.id).order("created_at"),
  ]);

  if (!profile) redirect("/garage/onboarding");

  return (
    <div className="space-y-14">
      <section>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-text">
          Profile
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          @{profile.username} · update how you show up in the garage.
        </p>
        <div className="mt-6">
          <ProfileSettingsForm profile={profile} />
        </div>
      </section>

      <section id="vehicles">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-text">
          Vehicles &amp; modifications
        </h2>
        <div className="mt-6">
          <VehicleManager
            vehicles={vehicles ?? []}
            modifications={mods ?? []}
            username={profile.username}
          />
        </div>
      </section>
    </div>
  );
}
