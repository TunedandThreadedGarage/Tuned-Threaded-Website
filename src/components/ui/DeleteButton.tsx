"use client";

import { useTransition } from "react";

export function DeleteButton({
  label,
  onDelete,
}: {
  label: string;
  onDelete: () => Promise<unknown>;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="text-xs text-text-muted hover:text-accent"
      onClick={() => startTransition(() => void onDelete())}
    >
      {pending ? "…" : label}
    </button>
  );
}
