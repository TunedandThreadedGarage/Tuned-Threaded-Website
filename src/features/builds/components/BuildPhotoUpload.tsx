"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { addBuildPhoto } from "@/features/builds/actions";

export function BuildPhotoUpload({
  buildId,
  userId,
}: {
  buildId: string;
  userId: string;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onChange(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setStatus("Uploading…");
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/${buildId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("builds")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) {
        setStatus(error.message);
        setBusy(false);
        return;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("builds").getPublicUrl(path);
      const result = await addBuildPhoto({
        buildId,
        url: publicUrl,
        storagePath: path,
      });
      setStatus(result.error ?? "Photo added.");
      if (!result.error) window.location.reload();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label className="inline-flex cursor-pointer border border-border px-4 py-2 text-sm text-text hover:border-metal/40">
        {busy ? "Uploading…" : "Upload build photo"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={busy}
          onChange={(e) => void onChange(e.target.files)}
        />
      </label>
      {status ? <p className="mt-2 text-xs text-text-muted">{status}</p> : null}
    </div>
  );
}
