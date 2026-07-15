"use client";

import { useState, useTransition } from "react";
import { toggleSaveBuild } from "@/features/social/actions";

export function SaveBuildButton({
  buildId,
  initiallySaved,
}: {
  buildId: string;
  initiallySaved: boolean;
}) {
  const [saved, setSaved] = useState(initiallySaved);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await toggleSaveBuild(buildId);
          if (!res.error) setSaved((v) => !v);
        })
      }
      className="border border-border px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-metal/40 hover:text-text disabled:opacity-50"
    >
      {saved ? "Saved" : "Save"}
    </button>
  );
}
