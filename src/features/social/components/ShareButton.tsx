"use client";

import { useState } from "react";

export function ShareButton({
  title,
  url,
}: {
  title: string;
  url: string;
}) {
  const [status, setStatus] = useState<string | null>(null);

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        setStatus("Shared");
        return;
      }
      await navigator.clipboard.writeText(url);
      setStatus("Link copied");
    } catch {
      setStatus(null);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void share()}
      className="border border-border px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-metal/40 hover:text-text"
    >
      {status ?? "Share"}
    </button>
  );
}
