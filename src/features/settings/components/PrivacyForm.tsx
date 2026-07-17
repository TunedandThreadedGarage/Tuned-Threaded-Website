"use client";

import { useState, useTransition } from "react";
import { updateCommunicationSettings } from "@/features/settings/actions";
import type { CommunicationSettings } from "@/features/settings/types";
import { ToggleRow } from "@/features/settings/components/ToggleRow";

export function PrivacyForm({ settings }: { settings: CommunicationSettings }) {
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
    <div className="space-y-6 border border-border p-5">
      <ToggleRow
        label="Show activity status"
        hint="Let others see recent garage activity signals."
        checked={state.show_activity_status}
        disabled={pending}
        onChange={(v) => save({ show_activity_status: v })}
      />
      <ToggleRow
        label="Allow mentions"
        hint="People can @mention you in Community and Builds."
        checked={state.allow_mentions}
        disabled={pending}
        onChange={(v) => save({ allow_mentions: v })}
      />
      <div>
        <p className="text-sm text-text">Who can message you</p>
        <p className="mt-0.5 text-xs text-text-muted">
          Controls who can start a direct message. Mutual follows go to Inbox;
          one-way follows land in Message Requests.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {(
            [
              ["everyone", "Everyone"],
              ["followers", "Followers"],
              ["none", "No one"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              disabled={pending}
              onClick={() => save({ allow_messages_from: value })}
              className={`border px-3 py-2.5 text-sm ${
                state.allow_messages_from === value
                  ? "border-accent bg-accent-soft/40 text-text"
                  : "border-border text-text-muted hover:text-text"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {message ? (
        <p className="text-xs text-text-muted" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
