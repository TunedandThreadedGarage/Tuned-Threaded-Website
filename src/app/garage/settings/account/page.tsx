import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileSettingsForm } from "@/features/profile/components/ProfileSettingsForm";
import { SettingsShell } from "@/features/settings/components/SettingsShell";
import { SECURITY_EMAIL_NOTE } from "@/features/settings/constants";

export default async function AccountSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/garage/sign-in?next=/garage/settings/account");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/garage/onboarding");

  return (
    <SettingsShell
      title="Account"
      description="Profile identity for the garage. Security emails stay mandatory."
    >
      <div className="space-y-8">
        <section className="border border-border p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-metal">
            Signed in
          </p>
          <p className="mt-2 text-sm text-text">{user.email}</p>
          <p className="mt-3 text-xs text-text-muted">{SECURITY_EMAIL_NOTE}</p>
        </section>
        <ProfileSettingsForm profile={profile} />
      </div>
    </SettingsShell>
  );
}
