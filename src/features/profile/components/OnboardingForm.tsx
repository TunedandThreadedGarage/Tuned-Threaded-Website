"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  completeOnboarding,
  type ProfileActionResult,
} from "@/features/profile/actions";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";

const initial: ProfileActionResult = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" className="w-full" disabled={pending}>
      {pending ? "Saving…" : "Enter the Garage"}
    </Button>
  );
}

export function OnboardingForm() {
  const [state, action] = useActionState(completeOnboarding, initial);

  return (
    <form action={action} className="space-y-4">
      <FormField
        label="Username"
        name="username"
        required
        autoComplete="username"
        hint="3–24 characters. Lowercase letters, numbers, underscore."
        pattern="[a-z0-9_]{3,24}"
      />
      <FormField
        label="Display name"
        name="display_name"
        required
        autoComplete="nickname"
      />
      {state.error ? (
        <p className="text-sm text-accent" role="alert">
          {state.error}
        </p>
      ) : null}
      <Submit />
    </form>
  );
}
