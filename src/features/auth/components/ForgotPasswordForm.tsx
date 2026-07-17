"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  requestPasswordReset,
  type AuthResult,
} from "@/features/auth/actions";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";

const initial: AuthResult = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" className="w-full" disabled={pending}>
      {pending ? "Sending…" : "Send reset link"}
    </Button>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, initial);

  return (
    <form action={action} className="space-y-4">
      <FormField label="Email" name="email" type="email" autoComplete="email" required />
      {state.error ? (
        <p className="text-sm text-accent" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="text-sm text-text-muted" role="status">
          {state.message}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
