"use client";

import Image from "next/image";
import { useState } from "react";
import { MediaUpload } from "@/components/media/MediaUpload";
import {
  addVehiclePhoto,
  updateVehiclePhotoUrl,
} from "@/features/vehicles/actions";

export function VehicleCoverUpload({
  vehicleId,
  userId,
  currentUrl,
}: {
  vehicleId: string;
  userId: string;
  currentUrl?: string | null;
}) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [status, setStatus] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="relative aspect-[16/10] max-w-md overflow-hidden border border-border bg-surface-elevated">
        {preview ? (
          <Image
            src={preview}
            alt=""
            fill
            className="object-cover"
            sizes="480px"
          />
        ) : (
          <div className="flex h-full min-h-[120px] items-center justify-center text-xs text-text-muted">
            No cover photo
          </div>
        )}
      </div>
      <MediaUpload
        bucket="garage"
        pathPrefix={`${userId}/vehicles/${vehicleId}`}
        accept="image"
        multiple={false}
        maxFiles={1}
        label="Vehicle cover photo"
        onUploaded={async (files) => {
          const file = files[0];
          if (!file) return;
          const result = await updateVehiclePhotoUrl(vehicleId, file.publicUrl);
          if (result.error) {
            setStatus(result.error);
            return;
          }
          setPreview(file.publicUrl);
          setStatus("Cover saved.");
        }}
      />
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

  return (
    <div className="space-y-2">
      <MediaUpload
        bucket="garage"
        pathPrefix={`${userId}/vehicles/${vehicleId}`}
        accept="image"
        multiple
        maxFiles={12}
        label="Vehicle gallery"
        onUploaded={async (files) => {
          let ok = 0;
          for (const file of files) {
            const result = await addVehiclePhoto({
              vehicleId,
              url: file.publicUrl,
              storagePath: file.storagePath,
            });
            if (!result.error) ok += 1;
            else setStatus(result.error);
          }
          if (ok > 0) {
            setStatus(`${ok} photo${ok === 1 ? "" : "s"} added.`);
            window.location.reload();
          }
        }}
      />
      {status ? <p className="text-xs text-text-muted">{status}</p> : null}
    </div>
  );
}
