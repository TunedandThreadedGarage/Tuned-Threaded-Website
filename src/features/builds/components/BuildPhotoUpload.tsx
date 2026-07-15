"use client";

import { useState } from "react";
import { MediaUpload } from "@/components/media/MediaUpload";
import { addBuildPhoto, addBuildVideo } from "@/features/builds/actions";

export function BuildPhotoUpload({
  buildId,
  userId,
}: {
  buildId: string;
  userId: string;
}) {
  const [status, setStatus] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <MediaUpload
        bucket="builds"
        pathPrefix={`${userId}/${buildId}`}
        accept="both"
        multiple
        maxFiles={12}
        label="Build photos & video"
        onUploaded={async (files) => {
          let photos = 0;
          let videos = 0;
          for (const file of files) {
            if (file.kind === "video") {
              const result = await addBuildVideo({
                buildId,
                url: file.publicUrl,
              });
              if (!result.error) videos += 1;
              else setStatus(result.error);
            } else {
              const result = await addBuildPhoto({
                buildId,
                url: file.publicUrl,
                storagePath: file.storagePath,
              });
              if (!result.error) photos += 1;
              else setStatus(result.error);
            }
          }
          if (photos + videos > 0) {
            setStatus("Media added.");
            window.location.reload();
          }
        }}
      />
      {status ? <p className="text-xs text-text-muted">{status}</p> : null}
    </div>
  );
}
