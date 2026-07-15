"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  updateBuild,
  type ActionResult,
} from "@/features/builds/actions";
import { FormField, TextAreaField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import type { Build } from "@/types/database";

const initial: ActionResult = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={pending}>
      {pending ? "Saving…" : "Update progress"}
    </Button>
  );
}

export function BuildEditForm({ build }: { build: Build }) {
  const [state, action] = useActionState(updateBuild, initial);

  return (
    <form action={action} className="space-y-4 border border-border p-5">
      <p className="text-sm font-medium text-text">Update build progress</p>
      <input type="hidden" name="id" value={build.id} />
      <FormField label="Title" name="title" defaultValue={build.title} required />
      <TextAreaField
        label="Story"
        name="body"
        defaultValue={build.body ?? ""}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField
          label="Current stage"
          name="current_stage"
          defaultValue={build.current_stage ?? ""}
        />
        <FormField
          label="Upcoming stage"
          name="upcoming_stage"
          defaultValue={build.upcoming_stage ?? ""}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField
          label="Progress %"
          name="progress_pct"
          type="number"
          defaultValue={String(build.progress_pct ?? 0)}
        />
        <FormField
          label="Estimated completion"
          name="estimated_completion"
          type="date"
          defaultValue={build.estimated_completion ?? ""}
        />
      </div>
      <label className="block text-sm text-text">
        <span className="font-medium">Status</span>
        <select
          name="status"
          className="mt-1.5 w-full border border-border bg-bg px-3 py-2.5 text-sm text-text"
          defaultValue={build.status ?? "active"}
        >
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="paused">Paused</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-text">
        <input
          type="checkbox"
          name="is_public"
          defaultChecked={build.is_public}
          className="accent-accent"
        />
        Public build
      </label>
      {state.error ? <p className="text-sm text-accent">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-text-muted">Build updated.</p>
      ) : null}
      <Submit />
    </form>
  );
}
