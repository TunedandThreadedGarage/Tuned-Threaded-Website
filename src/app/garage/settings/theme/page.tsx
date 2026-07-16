import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsShell } from "@/features/settings/components/SettingsShell";
import { ThemePreferenceForm } from "@/features/settings/components/ThemePreferenceForm";

export default async function ThemeSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/garage/sign-in?next=/garage/settings/theme");

  return (
    <SettingsShell
      title="Theme"
      description="Display preferences for the Tuned & Threaded experience."
    >
      <ThemePreferenceForm />
    </SettingsShell>
  );
}
