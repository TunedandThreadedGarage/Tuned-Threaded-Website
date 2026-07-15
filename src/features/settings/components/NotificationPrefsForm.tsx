"use client";

import { useState, useTransition } from "react";
import { EMAIL_FREQUENCIES, type EmailFrequency } from "@/features/settings/constants";
import {
  setMasterNotifications,
  updateEmailFrequency,
} from "@/features/settings/actions";
import type {
  ChannelPreference,
  CommunicationSettings,
} from "@/features/settings/types";
import { ToggleRow } from "@/features/settings/components/ToggleRow";
import { ChannelMatrix } from "@/features/settings/components/ChannelMatrix";

export function NotificationPrefsForm({
  settings,
  channels,
}: {
  settings: CommunicationSettings;
  channels: ChannelPreference[];
}) {
  const [master, setMaster] = useState(settings.master_enabled);
  const [frequency, setFrequency] = useState(settings.email_frequency);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-10">
      <section className="border border-border p-5">
        <ToggleRow
          label="Master notifications"
          hint="Turn off to pause optional in-app and email activity alerts."
          checked={master}
          disabled={pending}
          onChange={(v) => {
            setMaster(v);
            start(async () => {
              const result = await setMasterNotifications(v);
              setMessage(result.error ?? "Saved.");
            });
          }}
        />
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-text">
            Email frequency
          </h3>
          <p className="mt-1 text-sm text-text-muted">
            Instant, digest, or never for optional activity mail.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {EMAIL_FREQUENCIES.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={pending || !master}
              onClick={() => {
                setFrequency(opt.value);
                start(async () => {
                  const result = await updateEmailFrequency(
                    opt.value as EmailFrequency,
                  );
                  setMessage(result.error ?? "Saved.");
                });
              }}
              className={`border px-4 py-3 text-left text-sm transition-colors ${
                frequency === opt.value
                  ? "border-accent bg-accent-soft/40 text-text"
                  : "border-border text-text-muted hover:border-metal/40 hover:text-text"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-text">
            Activity channels
          </h3>
          <p className="mt-1 text-sm text-text-muted">
            Toggle Email, In-App, and Push (soon) for each type independently.
          </p>
        </div>
        <ChannelMatrix initial={channels} masterEnabled={master} />
      </section>

      {message ? (
        <p className="text-xs text-text-muted" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
