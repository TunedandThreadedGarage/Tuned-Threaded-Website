"use client";

import Image from "next/image";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  addVehiclePhoto,
  updateVehiclePhotoUrl,
} from "@/features/vehicles/actions";

const MAX_BYTES = 4 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";

export function VehicleCoverUpload({
  vehicleId,
  userId,
  currentUrl,
}: {
  vehicleId: string;
  userId: string;
  currentUrl?: string | null;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);

  async function onChange(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!ACCEPT.split(",").includes(file.type)) {
      setStatus("Use JPG, PNG, or WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setStatus("Image must be under 4MB.");
      return;
    }

    setBusy(true);
    setStatus("Uploading…");
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/vehicles/${vehicleId}/cover-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("garage")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) {
        setPreview(currentUrl ?? null);
        setStatus(
          error.message.includes("Bucket not found")
            ? "Storage bucket missing — run supabase/migrations/20260715_storage_buckets.sql."
            : error.message,
        );
        return;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("garage").getPublicUrl(path);
      const result = await updateVehiclePhotoUrl(vehicleId, publicUrl);
      if (result.error) {
        setPreview(currentUrl ?? null);
        setStatus(result.error);
      } else {
        setPreview(publicUrl);
        setStatus("Cover saved.");
      }
    } catch (err) {
      setPreview(currentUrl ?? null);
      setStatus(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      URL.revokeObjectURL(localPreview);
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-text">Vehicle cover photo</p>
      <div className="relative aspect-[16/10] max-w-md overflow-hidden border border-border bg-surface-elevated">
        {preview ? (
          <Image
            src={preview}
            alt=""
            fill
            className="object-cover"
            sizes="480px"
            unoptimized={preview.startsWith("blob:")}
          />
        ) : (
          <div className="flex h-full min-h-[120px] items-center justify-center text-xs text-text-muted">
            No cover photo
          </div>
        )}
      </div>
      <label className="inline-flex cursor-pointer border border-border px-4 py-2 text-sm text-text hover:border-metal/40">
        {busy ? "Uploading…" : "Upload cover"}
        <input
          type="file"
          accept={ACCEPT}
          className="sr-only"
          disabled={busy}
          onChange={(e) => void onChange(e.target.files)}
        />
      </label>
      {status ? <p className="text-xs text-text-muted">{status}</p> : null}
    </div>
  );
}

export function VehicleGalleryUpload({
  vehicleId,
  userId,
}: {
  vehicleId: string;
  userId: string;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onChange(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!ACCEPT.split(",").includes(file.type)) {
      setStatus("Use JPG, PNG, or WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setStatus("Image must be under 4MB.");
      return;
    }

    setBusy(true);
    setStatus("Uploading…");
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/vehicles/${vehicleId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("garage")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) {
        setStatus(error.message);
        return;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("garage").getPublicUrl(path);
      const result = await addVehiclePhoto({
        vehicleId,
        url: publicUrl,
        storagePath: path,
      });
      setStatus(result.error ?? "Photo added to gallery.");
      if (!result.error) window.location.reload();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-text">Add gallery photo</p>
      <label className="inline-flex cursor-pointer border border-border px-4 py-2 text-sm text-text hover:border-metal/40">
        {busy ? "Uploading…" : "Upload gallery photo"}
        <input
          type="file"
          accept={ACCEPT}
          className="sr-only"
          disabled={busy}
          onChange={(e) => void onChange(e.target.files)}
        />
      </label>
      {status ? <p className="text-xs text-text-muted">{status}</p> : null}
    </div>
  );
}
