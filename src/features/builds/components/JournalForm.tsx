"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { ActionResult } from "@/features/builds/actions";
import { FormField, TextAreaField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";

const initial: ActionResult = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? "Saving…" : "Add entry"}
    </Button>
  );
}

export function JournalForm({
  action,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
}) {
  const [state, formAction] = useActionState(action, initial);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="max-w-xl space-y-3 border border-border p-5">
      <FormField label="Date" name="entry_date" type="date" defaultValue={today} />
      <FormField label="Title" name="title" required />
      <TextAreaField label="Notes" name="body" />
      {state.error ? <p className="text-sm text-accent">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-text-muted">Entry saved.</p>
      ) : null}
      <Submit />
    </form>
  );
}
