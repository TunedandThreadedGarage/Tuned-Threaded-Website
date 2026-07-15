"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  signUpWithEmail,
  type AuthResult,
} from "@/features/auth/actions";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";

const initial: AuthResult = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" className="w-full" disabled={pending}>
      {pending ? "Creating…" : "Create Garage Profile"}
    </Button>
  );
}

export function SignUpForm() {
  const [state, action] = useActionState(signUpWithEmail, initial);

  if (state.success && state.message) {
    return (
      <div className="space-y-4" role="status">
        <p className="text-sm leading-relaxed text-text">{state.message}</p>
        <Button href="/garage/sign-in" variant="secondary" className="w-full">
          Go to sign in
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <FormField label="Email" name="email" type="email" autoComplete="email" required />
      <FormField
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        hint="At least 8 characters"
      />
      {state.error ? (
        <p className="text-sm text-accent" role="alert">
          {state.error}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
