"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { ActionResult } from "@/features/builds/actions";
import { FormField, TextAreaField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import type { Vehicle } from "@/types/database";

const initial: ActionResult = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? "Publishing…" : "Publish build"}
    </Button>
  );
}

export function BuildCreateForm({
  action,
  vehicles,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  vehicles: Vehicle[];
}) {
  const [state, formAction] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-4 border border-border p-5">
      <FormField label="Title" name="title" required />
      <TextAreaField label="Story" name="body" />
      <label className="block text-sm text-text">
        <span className="font-medium">Vehicle (optional)</span>
        <select
          name="vehicle_id"
          className="mt-1.5 w-full border border-border bg-bg px-3 py-2.5 text-sm text-text"
          defaultValue=""
        >
          <option value="">None</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {[v.year, v.make, v.model].filter(Boolean).join(" ")}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Current stage" name="current_stage" />
        <FormField label="Upcoming stage" name="upcoming_stage" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField
          label="Progress %"
          name="progress_pct"
          type="number"
          defaultValue="0"
        />
        <FormField
          label="Estimated completion"
          name="estimated_completion"
          type="date"
        />
      </div>
      <label className="block text-sm text-text">
        <span className="font-medium">Status</span>
        <select
          name="status"
          className="mt-1.5 w-full border border-border bg-bg px-3 py-2.5 text-sm text-text"
          defaultValue="active"
        >
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="paused">Paused</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-text">
        <input type="checkbox" name="is_public" defaultChecked className="accent-accent" />
        Public build
      </label>
      {state.error ? <p className="text-sm text-accent">{state.error}</p> : null}
      <Submit />
    </form>
  );
}
