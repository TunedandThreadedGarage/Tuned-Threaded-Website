import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadCommunicationSettings } from "@/features/settings/actions";
import { SettingsShell } from "@/features/settings/components/SettingsShell";
import { StoreMarketingForm } from "@/features/settings/components/StoreMarketingForm";
import type { CommunicationSettings } from "@/features/settings/types";

export default async function StoreSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/garage/sign-in?next=/garage/settings/store");

  const { settings, error } = await loadCommunicationSettings();

  return (
    <SettingsShell
      title="Store"
      description="Purchase emails are automatic. Marketing for merch and sales stays optional."
    >
      <div className="space-y-8">
        <section className="border border-border p-5">
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-text">
            Order emails
          </h3>
          <p className="mt-2 text-sm text-text-muted">
            Every purchase automatically sends confirmation, receipt, tracking,
            shipping updates, delivery, and refund notices.
          </p>
          <ul className="mt-4 space-y-2 font-mono text-[11px] uppercase tracking-[0.14em] text-metal">
            {[
              "Order Confirmation",
              "Receipt",
              "Tracking Number",
              "Shipping Updates",
              "Delivery Confirmation",
              "Refund Confirmation",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center justify-between border-b border-border py-2"
              >
                <span>{item}</span>
                <span className="text-accent">Automatic</span>
              </li>
            ))}
          </ul>
          <Link
            href="/garage/orders"
            className="mt-5 inline-block border border-border px-4 py-2 text-sm text-text transition-colors hover:border-metal/40"
          >
            Open order history
          </Link>
        </section>

        {settings ? (
          <StoreMarketingForm settings={settings as CommunicationSettings} />
        ) : (
          <p className="text-sm text-accent">
            {error ?? "Unable to load marketing preferences."}
          </p>
        )}
      </div>
    </SettingsShell>
  );
}
