import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadCommunicationSettings } from "@/features/settings/actions";
import { CommunicationForm } from "@/features/settings/components/CommunicationForm";
import { SettingsShell } from "@/features/settings/components/SettingsShell";
import type { CommunicationSettings } from "@/features/settings/types";

export default async function CommunicationSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/garage/sign-in?next=/garage/settings/communication");

  const { settings, error } = await loadCommunicationSettings();
  if (!settings) {
    return (
      <SettingsShell
        title="Communication"
        description="Digests, marketing, and email cadence."
      >
        <p className="text-sm text-accent">{error ?? "Unable to load settings."}</p>
      </SettingsShell>
    );
  }

  return (
    <SettingsShell
      title="Communication"
      description="Choose digests and marketing mail. Security emails stay required."
    >
      <CommunicationForm settings={settings as CommunicationSettings} />
    </SettingsShell>
  );
}
