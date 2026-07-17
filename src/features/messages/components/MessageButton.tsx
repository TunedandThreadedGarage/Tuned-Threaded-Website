"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { startConversation } from "@/features/messages/actions";

export function MessageButton({
  peerUserId,
  className,
}: {
  peerUserId: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        className={
          className ??
          "border border-border px-4 py-2 text-sm text-text transition-colors hover:border-metal/40"
        }
        onClick={() =>
          start(async () => {
            const res = await startConversation(peerUserId);
            if (res.error || !res.id) {
              setError(res.error ?? "Could not start conversation.");
              return;
            }
            setError(null);
            router.push(`/messages/${res.id}`);
          })
        }
      >
        {pending ? "Opening…" : "Message"}
      </button>
      {error ? <span className="text-xs text-accent">{error}</span> : null}
    </div>
  );
}
