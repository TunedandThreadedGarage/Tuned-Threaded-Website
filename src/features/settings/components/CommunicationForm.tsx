"use client";

import { useState, useTransition } from "react";
import {
  EMAIL_FREQUENCIES,
  SECURITY_EMAIL_NOTE,
  type EmailFrequency,
} from "@/features/settings/constants";
import {
  updateCommunicationSettings,
  updateEmailFrequency,
} from "@/features/settings/actions";
import type { CommunicationSettings } from "@/features/settings/types";
import { ToggleRow } from "@/features/settings/components/ToggleRow";

export function CommunicationForm({
  settings,
}: {
  settings: CommunicationSettings;
}) {
  const [state, setState] = useState(settings);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function save(
    patch: Partial<Omit<CommunicationSettings, "user_id" | "updated_at">>,
  ) {
    setState((s) => ({ ...s, ...patch }));
    start(async () => {
      const result = await updateCommunicationSettings(patch);
      setMessage(result.error ?? "Saved.");
    });
  }

  return (
    <div className="space-y-10">
      <section className="space-y-4 border border-border p-5">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-text">
            Email frequency
          </h3>
          <p className="mt-1 text-sm text-text-muted">
            Control how often optional activity emails arrive.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {EMAIL_FREQUENCIES.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={pending}
              onClick={() => {
                setState((s) => ({ ...s, email_frequency: opt.value }));
                start(async () => {
                  const result = await updateEmailFrequency(
                    opt.value as EmailFrequency,
                  );
                  setMessage(result.error ?? "Saved.");
                });
              }}
              className={`border px-4 py-3 text-left text-sm transition-colors ${
                state.email_frequency === opt.value
                  ? "border-accent bg-accent-soft/40 text-text"
                  : "border-border text-text-muted hover:border-metal/40 hover:text-text"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2 border border-border p-5">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-text">
            Digest emails
          </h3>
          <p className="mt-1 text-sm text-text-muted">
            Summaries of followers, build activity, trending builds, discussions,
            and marketplace updates.
          </p>
        </div>
        <ToggleRow
          label="Daily Summary"
          checked={state.digest_daily}
          disabled={pending}
          onChange={(v) => save({ digest_daily: v })}
        />
        <ToggleRow
          label="Weekly Summary"
          checked={state.digest_weekly}
          disabled={pending}
          onChange={(v) => save({ digest_weekly: v })}
        />
        <ToggleRow
          label="Monthly Summary"
          checked={state.digest_monthly}
          disabled={pending}
          onChange={(v) => save({ digest_monthly: v })}
        />
      </section>

      <section className="space-y-2 border border-border p-5">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-text">
            Marketing emails
          </h3>
          <p className="mt-1 text-sm text-text-muted">
            Optional. Unsubscribing here never disables account or security mail.
          </p>
        </div>
        <ToggleRow
          label="New merchandise"
          checked={state.marketing_merchandise}
          disabled={pending}
          onChange={(v) => save({ marketing_merchandise: v })}
        />
        <ToggleRow
          label="Sales"
          checked={state.marketing_sales}
          disabled={pending}
          onChange={(v) => save({ marketing_sales: v })}
        />
        <ToggleRow
          label="Events"
          checked={state.marketing_events}
          disabled={pending}
          onChange={(v) => save({ marketing_events: v })}
        />
        <ToggleRow
          label="Feature announcements"
          checked={state.marketing_features}
          disabled={pending}
          onChange={(v) => save({ marketing_features: v })}
        />
        <ToggleRow
          label="Community newsletters"
          checked={state.marketing_community}
          disabled={pending}
          onChange={(v) => save({ marketing_community: v })}
        />
      </section>

      <section className="border border-border p-5">
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-text">
          Security emails
        </h3>
        <p className="mt-2 text-sm text-text-muted">{SECURITY_EMAIL_NOTE}</p>
        <ul className="mt-4 space-y-2 font-mono text-[11px] uppercase tracking-[0.14em] text-metal">
          {[
            "Password Changed",
            "Email Changed",
            "New Login",
            "New Device Login",
            "2FA Enabled",
          ].map((item) => (
            <li key={item} className="flex items-center justify-between border-b border-border py-2">
              <span>{item}</span>
              <span className="text-accent">Required</span>
            </li>
          ))}
        </ul>
      </section>

      {message ? (
        <p className="text-xs text-text-muted" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
