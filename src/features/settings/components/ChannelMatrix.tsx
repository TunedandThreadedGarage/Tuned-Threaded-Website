"use client";

import { useState, useTransition } from "react";
import {
  NOTIFICATION_PREF_EVENTS,
  type NotificationEventKey,
} from "@/features/settings/constants";
import { updateChannelPreference } from "@/features/settings/actions";
import type { ChannelPreference } from "@/features/settings/types";

export function ChannelMatrix({
  initial,
  masterEnabled,
}: {
  initial: ChannelPreference[];
  masterEnabled: boolean;
}) {
  const [rows, setRows] = useState(initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function patch(
    eventKey: NotificationEventKey | string,
    field: "email_enabled" | "in_app_enabled" | "push_enabled",
    value: boolean,
  ) {
    setRows((prev) =>
      prev.map((r) =>
        r.event_key === eventKey ? { ...r, [field]: value } : r,
      ),
    );
    start(async () => {
      const result = await updateChannelPreference({
        eventKey,
        [field]: value,
      });
      if (result.error) setError(result.error);
      else setError(null);
    });
  }

  return (
    <div className={`space-y-4 ${masterEnabled ? "" : "opacity-50"}`}>
      <div className="hidden grid-cols-[minmax(0,1.4fr)_repeat(3,72px)] gap-2 px-1 text-[10px] font-mono uppercase tracking-[0.14em] text-metal sm:grid">
        <span>Type</span>
        <span className="text-center">Email</span>
        <span className="text-center">In-App</span>
        <span className="text-center">Push</span>
      </div>

      <ul className="divide-y divide-border border border-border">
        {NOTIFICATION_PREF_EVENTS.map((ev) => {
          const row = rows.find((r) => r.event_key === ev.key) ?? {
            event_key: ev.key,
            email_enabled: true,
            in_app_enabled: true,
            push_enabled: false,
          };
          return (
            <li
              key={ev.key}
              className="grid grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1.4fr)_repeat(3,72px)] sm:items-center sm:gap-2"
            >
              <div>
                <p className="text-sm font-medium text-text">{ev.label}</p>
                <p className="mt-0.5 text-xs text-text-muted">{ev.hint}</p>
              </div>
              {(
                [
                  ["email_enabled", "Email", row.email_enabled],
                  ["in_app_enabled", "In-App", row.in_app_enabled],
                  ["push_enabled", "Push", row.push_enabled],
                ] as const
              ).map(([field, lab, checked]) => (
                <label
                  key={field}
                  className="flex items-center justify-between gap-3 sm:flex-col sm:justify-center sm:gap-1"
                >
                  <span className="text-xs text-text-muted sm:sr-only">
                    {lab}
                  </span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--color-accent)]"
                    checked={checked}
                    disabled={!masterEnabled || pending || field === "push_enabled"}
                    title={
                      field === "push_enabled"
                        ? "Push notifications coming soon"
                        : lab
                    }
                    onChange={(e) => patch(ev.key, field, e.target.checked)}
                  />
                  {field === "push_enabled" ? (
                    <span className="hidden font-mono text-[9px] uppercase tracking-[0.12em] text-metal sm:block">
                      Soon
                    </span>
                  ) : null}
                </label>
              ))}
            </li>
          );
        })}
      </ul>
      {error ? (
        <p className="text-xs text-accent" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
