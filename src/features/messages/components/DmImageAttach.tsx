"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Compact photo attach for DM composer — same messages bucket, no UI chrome. */
export function DmImageAttach({
  userId,
  conversationId,
  onUploaded,
}: {
  userId: string;
  conversationId: string;
  onUploaded: (publicUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onPick(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    setBusy(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/${conversationId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("messages")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("messages").getPublicUrl(path);
      if (data.publicUrl) onUploaded(data.publicUrl);
    } catch {
      /* parent can show send errors if needed */
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          void onPick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={busy}
        aria-label="Attach photo"
        className="grid h-9 w-9 place-items-center rounded-full text-text-muted transition-colors hover:bg-white/5 hover:text-text disabled:opacity-40"
        onClick={() => inputRef.current?.click()}
      >
        <CameraIcon />
      </button>
    </>
  );
}

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 8.5A2.5 2.5 0 016.5 6h1.2l1.1-1.6A1.5 1.5 0 0110 3.8h4a1.5 1.5 0 011.2.6L16.3 6h1.2A2.5 2.5 0 0120 8.5v9A2.5 2.5 0 0117.5 20h-11A2.5 2.5 0 014 17.5v-9z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="13" r="3.2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
