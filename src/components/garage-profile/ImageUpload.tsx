"use client";

import Image from "next/image";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateProfileImageUrls } from "@/features/profile/actions";

type ImageUploadProps = {
  bucket: "avatars" | "banners";
  userId: string;
  label: string;
  currentUrl?: string | null;
};

const MAX_BYTES = 4 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";

export function ImageUpload({
  bucket,
  userId,
  label,
  currentUrl,
}: ImageUploadProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const isAvatar = bucket === "avatars";

  async function onChange(fileList: FileList | null) {
    const file = fileList?.[0];
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
      const path = `${userId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        setPreview(currentUrl ?? null);
        setStatus(
          uploadError.message.includes("Bucket not found")
            ? "Storage bucket missing — run supabase/migrations/20260715_storage_buckets.sql in Supabase."
            : uploadError.message,
        );
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(path);

      const result = await updateProfileImageUrls(
        isAvatar ? { avatar_url: publicUrl } : { banner_url: publicUrl },
      );

      if (result.error) {
        setPreview(currentUrl ?? null);
        setStatus(result.error);
      } else {
        setPreview(publicUrl);
        setStatus("Saved.");
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
      <p className="text-sm font-medium text-text">{label}</p>
      <div
        className={`relative overflow-hidden border border-border bg-surface-elevated ${
          isAvatar ? "aspect-square max-w-[140px] rounded-full" : "aspect-[3/1] w-full"
        }`}
      >
        {preview ? (
          <Image
            src={preview}
            alt=""
            fill
            className="object-cover"
            sizes={isAvatar ? "140px" : "480px"}
            unoptimized={preview.startsWith("blob:")}
          />
        ) : (
          <div className="flex h-full min-h-[88px] items-center justify-center px-3 text-center text-xs text-text-muted">
            No image yet
          </div>
        )}
      </div>
      <label className="inline-flex cursor-pointer border border-border px-4 py-2 text-sm text-text transition-colors hover:border-metal/40">
        {busy ? "Uploading…" : "Choose image"}
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
