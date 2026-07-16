"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  updateAccountPassword,
  type PasswordResult,
} from "@/features/settings/actions-password";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";

const initial: PasswordResult = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? "Updating…" : "Update password"}
    </Button>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(updateAccountPassword, initial);
  return (
    <form action={action} className="max-w-md space-y-4 border border-border p-5">
      <FormField
        label="New password"
        name="password"
        type="password"
        required
        autoComplete="new-password"
      />
      <FormField
        label="Confirm password"
        name="confirm"
        type="password"
        required
        autoComplete="new-password"
      />
      {state.error ? <p className="text-sm text-accent">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-text-muted">Password updated.</p>
      ) : null}
      <Submit />
    </form>
  );
}
