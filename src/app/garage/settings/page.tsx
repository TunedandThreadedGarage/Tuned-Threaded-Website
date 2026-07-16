import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SETTINGS_SECTIONS } from "@/features/settings/constants";
import { SettingsShell } from "@/features/settings/components/SettingsShell";

export default async function SettingsHubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/garage/sign-in");

  return (
    <SettingsShell
      title="Settings"
      description="Account preferences, privacy, notifications, password, connected accounts, and theme — kept quiet and deliberate."
    >
      <ul className="grid gap-3 sm:grid-cols-2">
        {SETTINGS_SECTIONS.map((section) => (
          <li key={section.key}>
            <Link
              href={section.href}
              className="block h-full border border-border bg-surface/20 px-5 py-5 transition-colors hover:border-metal/40 hover:bg-surface/40"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-metal">
                {section.key}
              </p>
              <h3 className="mt-2 font-[family-name:var(--font-display)] text-lg font-semibold text-text">
                {section.label}
              </h3>
              <p className="mt-2 text-sm text-text-muted">
                {section.description}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </SettingsShell>
  );
}
