"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  signInWithEmail,
  type AuthResult,
} from "@/features/auth/actions";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";

const initial: AuthResult = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" className="w-full" disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}

export function SignInForm({ next = "/garage" }: { next?: string }) {
  const [state, action] = useActionState(signInWithEmail, initial);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <FormField label="Email" name="email" type="email" autoComplete="email" required />
      <FormField
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
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
