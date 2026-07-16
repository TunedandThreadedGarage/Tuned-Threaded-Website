import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsShell } from "@/features/settings/components/SettingsShell";
import { getOAuthProviders } from "@/features/auth/providers";

export default async function ConnectedAccountsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/garage/sign-in?next=/garage/settings/connected");

  const identities = user.identities ?? [];
  const available = getOAuthProviders();

  return (
    <SettingsShell
      title="Connected accounts"
      description="Providers linked to your Tuned & Threaded account."
    >
      <ul className="divide-y divide-border border border-border">
        {available.map((provider) => {
          const linked = identities.some(
            (i) => i.provider === provider.oauthProvider,
          );
          return (
            <li
              key={provider.oauthProvider}
              className="flex items-center justify-between gap-4 px-4 py-4"
            >
              <div>
                <p className="text-sm font-medium text-text">{provider.label}</p>
                <p className="text-xs text-text-muted">
                  {linked ? "Connected" : "Not connected"}
                </p>
              </div>
              <span
                className={`font-mono text-[10px] uppercase tracking-[0.14em] ${
                  linked ? "text-text" : "text-metal"
                }`}
              >
                {linked ? "Active" : "Available"}
              </span>
            </li>
          );
        })}
        {available.length === 0 ? (
          <li className="px-4 py-6 text-sm text-text-muted">
            No OAuth providers are enabled yet.
          </li>
        ) : null}
      </ul>
      <p className="mt-4 text-xs text-text-muted">
        Email sign-in: {user.email ?? "—"}
      </p>
    </SettingsShell>
  );
}
