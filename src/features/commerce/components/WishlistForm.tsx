"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { ActionResult } from "@/features/commerce/actions";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";

const initial: ActionResult = {};

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

export function WishlistForm({
  action,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
}) {
  const [state, formAction] = useActionState(action, initial);
  return (
    <form action={formAction} className="max-w-xl space-y-3 border border-border p-5">
      <FormField label="Product ref" name="product_ref" required placeholder="sku-or-slug" />
      <FormField label="Name" name="product_name" placeholder="Optional display name" />
      {state.error ? <p className="text-sm text-accent">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-text-muted">Added.</p> : null}
      <Submit label="Add to wishlist" />
    </form>
  );
}

export function CartForm({
  action,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
}) {
  const [state, formAction] = useActionState(action, initial);
  return (
    <form action={formAction} className="max-w-xl space-y-3 border border-border p-5">
      <FormField label="Product ref" name="product_ref" required />
      <FormField label="Name" name="product_name" />
      <FormField label="Quantity" name="quantity" type="number" defaultValue={1} min={1} />
      {state.error ? <p className="text-sm text-accent">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-text-muted">Saved to cart.</p> : null}
      <Submit label="Add to cart" />
    </form>
  );
}
