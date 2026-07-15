"use client";

import Image from "next/image";
import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import {
  addGalleryPhoto,
  createAlbum,
  deleteAlbum,
  type ActionResult,
} from "@/features/gallery/actions";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { MediaUpload } from "@/components/media/MediaUpload";
import type { GarageAlbum, GaragePhoto } from "@/types/database";

const initial: ActionResult = {};

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "before_after", label: "Before / After" },
  { value: "build", label: "Build" },
  { value: "rolling", label: "Rolling shots" },
  { value: "dyno", label: "Dyno sheets" },
  { value: "garage", label: "Garage" },
];

export function GalleryManager({
  albums,
  photos,
  userId,
}: {
  albums: GarageAlbum[];
  photos: GaragePhoto[];
  userId: string;
}) {
  const [albumState, albumAction] = useActionState(createAlbum, initial);
  const [pending, startTransition] = useTransition();
  const [albumId, setAlbumId] = useState(albums[0]?.id ?? "");
  const [category, setCategory] = useState("general");
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-2">
        {albums.map((album) => {
          const albumPhotos = photos.filter((p) => p.album_id === album.id);
          return (
            <div key={album.id} className="border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-[family-name:var(--font-display)] text-base text-text">
                    {album.name}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-metal">
                    {album.category.replace("_", " ")}
                    {album.is_public ? "" : " · private"}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  className="text-xs text-text-muted hover:text-accent"
                  onClick={() =>
                    startTransition(async () => {
                      await deleteAlbum(album.id);
                    })
                  }
                >
                  Delete
                </button>
              </div>
              {albumPhotos.length > 0 ? (
                <div className="mt-3 grid grid-cols-3 gap-1">
                  {albumPhotos.slice(0, 3).map((p) => (
                    <div
                      key={p.id}
                      className="relative aspect-square overflow-hidden bg-surface-elevated"
                    >
                      <Image
                        src={p.url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="120px"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-text-muted">Empty album</p>
              )}
            </div>
          );
        })}
      </div>

      <form action={albumAction} className="max-w-lg space-y-3 border border-border p-5">
        <p className="text-sm font-medium text-text">New album</p>
        <FormField label="Name" name="name" required />
        <label className="block text-sm text-text">
          <span className="font-medium">Category</span>
          <select
            name="category"
            className="mt-1.5 w-full border border-border bg-bg px-3 py-2.5 text-sm text-text"
            defaultValue="general"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-text">
          <input
            type="checkbox"
            name="is_public"
            defaultChecked
            className="accent-accent"
          />
          Public album
        </label>
        {albumState.error ? (
          <p className="text-sm text-accent">{albumState.error}</p>
        ) : null}
        <Submit label="Create album" />
      </form>

      {albums.length > 0 ? (
        <div className="max-w-lg space-y-3 border border-border p-5">
          <p className="text-sm font-medium text-text">Add photo</p>
          <label className="block text-sm text-text">
            <span className="font-medium">Album</span>
            <select
              value={albumId}
              onChange={(e) => setAlbumId(e.target.value)}
              className="mt-1.5 w-full border border-border bg-bg px-3 py-2.5 text-sm text-text"
            >
              {albums.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-text">
            <span className="font-medium">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1.5 w-full border border-border bg-bg px-3 py-2.5 text-sm text-text"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <FormField
            label="Caption"
            name="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          <MediaUpload
            bucket="garage"
            pathPrefix={`${userId}/gallery/${albumId || "general"}`}
            accept="image"
            multiple
            maxFiles={12}
            label="Photos"
            onUploaded={async (files) => {
              if (!albumId) {
                setStatus("Select an album first.");
                return;
              }
              let ok = 0;
              for (const file of files) {
                const fd = new FormData();
                fd.set("album_id", albumId);
                fd.set("url", file.publicUrl);
                fd.set("storage_path", file.storagePath);
                fd.set("caption", caption);
                fd.set("category", category);
                const res = await addGalleryPhoto({}, fd);
                if (res.error) setStatus(res.error);
                else ok += 1;
              }
              if (ok > 0) {
                setStatus(`${ok} photo${ok === 1 ? "" : "s"} added.`);
                setCaption("");
                window.location.reload();
              }
            }}
          />
          {status ? <p className="text-xs text-text-muted">{status}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
