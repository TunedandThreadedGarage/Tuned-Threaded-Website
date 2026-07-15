import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadCommunicationSettings } from "@/features/settings/actions";
import { NotificationPrefsForm } from "@/features/settings/components/NotificationPrefsForm";
import { SettingsShell } from "@/features/settings/components/SettingsShell";
import type { CommunicationSettings } from "@/features/settings/types";

export default async function NotificationSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/garage/sign-in?next=/garage/settings/notifications");

  const { settings, channels, error } = await loadCommunicationSettings();
  if (!settings) {
    return (
      <SettingsShell
        title="Notifications"
        description="Email, in-app, and push preferences."
      >
        <p className="text-sm text-accent">{error ?? "Unable to load settings."}</p>
      </SettingsShell>
    );
  }

  return (
    <SettingsShell
      title="Notifications"
      description="Master switch, email frequency, and independent channel toggles for every activity type."
    >
      <NotificationPrefsForm
        settings={settings as CommunicationSettings}
        channels={channels}
      />
    </SettingsShell>
  );
}
