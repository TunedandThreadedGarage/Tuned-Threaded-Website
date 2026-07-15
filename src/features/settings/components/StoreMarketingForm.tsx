"use client";

import { useState, useTransition } from "react";
import { updateCommunicationSettings } from "@/features/settings/actions";
import type { CommunicationSettings } from "@/features/settings/types";
import { ToggleRow } from "@/features/settings/components/ToggleRow";

export function StoreMarketingForm({
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
    <section className="space-y-2 border border-border p-5">
      <div>
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-text">
          Store marketing
        </h3>
        <p className="mt-1 text-sm text-text-muted">
          Optional merch and sale announcements. Account and order emails are
          unaffected.
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
      {message ? (
        <p className="text-xs text-text-muted" role="status">
          {message}
        </p>
      ) : null}
    </section>
  );
}
