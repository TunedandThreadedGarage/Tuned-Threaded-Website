import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsShell } from "@/features/settings/components/SettingsShell";
import { PasswordForm } from "@/features/settings/components/PasswordForm";
import { SECURITY_EMAIL_NOTE } from "@/features/settings/constants";

export default async function PasswordSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/garage/sign-in?next=/garage/settings/password");

  return (
    <SettingsShell
      title="Password"
      description="Choose a strong password. Security emails stay mandatory."
    >
      <p className="mb-6 text-xs text-text-muted">{SECURITY_EMAIL_NOTE}</p>
      <PasswordForm />
    </SettingsShell>
  );
}
