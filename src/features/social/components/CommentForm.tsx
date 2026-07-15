"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { addBuildComment, type ActionResult } from "@/features/social/actions";
import { Button } from "@/components/ui/Button";

const initial: ActionResult = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={pending}>
      {pending ? "Posting…" : "Comment"}
    </Button>
  );
}

export function CommentForm({ buildId }: { buildId: string }) {
  const [state, action] = useActionState(addBuildComment, initial);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="build_id" value={buildId} />
      <textarea
        name="body"
        required
        rows={3}
        placeholder="Add a comment…"
        className="w-full border border-border bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-metal/50"
      />
      {state.error ? <p className="text-sm text-accent">{state.error}</p> : null}
      <Submit />
    </form>
  );
}
