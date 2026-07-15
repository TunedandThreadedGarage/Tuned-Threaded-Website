import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadCommunicationSettings } from "@/features/settings/actions";
import { PrivacyForm } from "@/features/settings/components/PrivacyForm";
import { SettingsShell } from "@/features/settings/components/SettingsShell";
import type { CommunicationSettings } from "@/features/settings/types";

export default async function PrivacySettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/garage/sign-in?next=/garage/settings/privacy");

  const { settings, error } = await loadCommunicationSettings();
  if (!settings) {
    return (
      <SettingsShell title="Privacy" description="Visibility and mention controls.">
        <p className="text-sm text-accent">{error ?? "Unable to load settings."}</p>
      </SettingsShell>
    );
  }

  return (
    <SettingsShell
      title="Privacy"
      description="Control mentions, messages, and activity visibility."
    >
      <PrivacyForm settings={settings as CommunicationSettings} />
    </SettingsShell>
  );
}
