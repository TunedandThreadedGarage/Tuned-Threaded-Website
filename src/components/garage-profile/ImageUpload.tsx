"use client";

import Image from "next/image";
import { useState } from "react";
import { MediaUpload } from "@/components/media/MediaUpload";
import { updateProfileImageUrls } from "@/features/profile/actions";

type ImageUploadProps = {
  bucket: "avatars" | "banners";
  userId: string;
  label: string;
  currentUrl?: string | null;
};

export function ImageUpload({
  bucket,
  userId,
  label,
  currentUrl,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [status, setStatus] = useState<string | null>(null);
  const isAvatar = bucket === "avatars";

  return (
    <div className="space-y-3">
      <div
        className={`relative overflow-hidden border border-border bg-surface-elevated ${
          isAvatar
            ? "aspect-square max-w-[140px] rounded-full"
            : "aspect-[3/1] w-full"
        }`}
      >
        {preview ? (
          <Image
            src={preview}
            alt=""
            fill
            className="object-cover"
            sizes={isAvatar ? "140px" : "480px"}
          />
        ) : (
          <div className="flex h-full min-h-[88px] items-center justify-center px-3 text-center text-xs text-text-muted">
            No image yet
          </div>
        )}
      </div>
      <MediaUpload
        bucket={bucket}
        pathPrefix={userId}
        accept="image"
        multiple={false}
        maxFiles={1}
        label={label}
        variant={isAvatar ? "avatar" : "banner"}
        onUploaded={async (files) => {
          const file = files[0];
          if (!file) return;
          const result = await updateProfileImageUrls(
            isAvatar
              ? { avatar_url: file.publicUrl }
              : { banner_url: file.publicUrl },
          );
          if (result.error) {
            setStatus(result.error);
            return;
          }
          setPreview(file.publicUrl);
          setStatus("Saved.");
        }}
      />
      {status ? <p className="text-xs text-text-muted">{status}</p> : null}
    </div>
  );
}
