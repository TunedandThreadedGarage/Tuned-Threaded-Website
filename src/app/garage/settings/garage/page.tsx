import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsShell } from "@/features/settings/components/SettingsShell";

export default async function GarageSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/garage/sign-in?next=/garage/settings/garage");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/garage/onboarding");

  return (
    <SettingsShell
      title="Garage"
      description="Vehicles are managed in the Garage hub — not here."
    >
      <div className="space-y-4 border border-border bg-surface/20 p-5">
        <p className="text-sm text-text-muted">
          Add, edit, and photo your vehicles from the Vehicles section in The
          Garage. Settings stays for account preferences only.
        </p>
        <Link
          href="/garage?tab=vehicles"
          className="inline-flex border border-border px-4 py-2 text-sm text-text transition-colors hover:border-metal/40"
        >
          Open Vehicles in Garage
        </Link>
        <Link
          href="/garage?tab=vehicles&edit=new"
          className="ml-3 inline-flex bg-white px-4 py-2 text-sm font-medium text-bg"
        >
          Add vehicle
        </Link>
      </div>
    </SettingsShell>
  );
}
