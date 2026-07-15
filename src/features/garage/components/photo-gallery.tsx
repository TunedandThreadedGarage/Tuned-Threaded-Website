"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GalleryAlbum, GalleryPhoto } from "@/types/garage";

const ALBUMS: Array<GalleryAlbum | "All"> = [
  "All",
  "Build Photos",
  "Before / After",
  "Rolling Shots",
  "Dyno Sheets",
  "Garage Photos",
];

export function PhotoGallery({
  photos,
  canUpload = false,
  embedded = false,
}: {
  photos: GalleryPhoto[];
  canUpload?: boolean;
  embedded?: boolean;
}) {
  const [album, setAlbum] = useState<(typeof ALBUMS)[number]>("All");
  const [uploaded, setUploaded] = useState<GalleryPhoto[]>([]);
  const reduceMotion = useReducedMotion();

  const visible = useMemo(() => {
    const all = [...uploaded, ...photos];
    if (album === "All") return all;
    return all.filter((photo) => photo.album === album);
  }, [album, photos, uploaded]);

  function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    const next: GalleryPhoto[] = Array.from(files).map((file, index) => ({
      id: `local-${Date.now()}-${index}`,
      ownerId: "local",
      url: URL.createObjectURL(file),
      caption: file.name,
      album: album === "All" ? "Build Photos" : album,
      createdAt: new Date().toISOString(),
    }));
    setUploaded((prev) => [...next, ...prev]);
  }

  const shellClass = embedded
    ? "w-full"
    : "mx-auto mt-16 w-full max-w-7xl px-5 md:px-8";

  return (
    <section className={shellClass}>
      {!embedded ? (
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-foreground-subtle">
              Photo Gallery
            </p>
            <h2 className="font-[family-name:var(--font-instrument)] text-3xl tracking-tight md:text-4xl">
              Light on metal
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-foreground-muted">
              Organize albums for builds, rolling shots, dyno sheets, and garage
              life.
            </p>
          </div>

          {canUpload ? (
            <label className="inline-flex cursor-pointer">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => handleUpload(event.target.files)}
              />
              <span className="inline-flex h-11 items-center gap-2 rounded-full border border-border-strong px-5 text-xs uppercase tracking-[0.04em] text-foreground transition-colors hover:bg-white/[0.04]">
                <Upload className="h-4 w-4" />
                Upload photos
              </span>
            </label>
          ) : null}
        </div>
      ) : canUpload ? (
        <div className="mb-6 flex justify-end">
          <label className="inline-flex cursor-pointer">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => handleUpload(event.target.files)}
            />
            <span className="inline-flex h-11 items-center gap-2 rounded-full border border-border-strong px-5 text-xs uppercase tracking-[0.04em] text-foreground transition-colors hover:bg-white/[0.04]">
              <Upload className="h-4 w-4" />
              Upload photos
            </span>
          </label>
        </div>
      ) : null}

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {ALBUMS.map((item) => (
          <Button
            key={item}
            size="sm"
            variant={album === item ? "secondary" : "ghost"}
            onClick={() => setAlbum(item)}
            className="shrink-0 normal-case tracking-[0.08em]"
          >
            {item}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {visible.map((photo, index) => (
          <motion.figure
            key={photo.id}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: index * 0.03 }}
            className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-background-soft"
          >
            <Image
              src={photo.url}
              alt={photo.caption ?? "Garage photo"}
              fill
              unoptimized={photo.url.startsWith("blob:")}
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
              <p className="text-[10px] uppercase tracking-[0.16em] text-foreground-muted">
                {photo.album}
              </p>
              {photo.caption ? (
                <p className="mt-1 text-sm text-foreground">{photo.caption}</p>
              ) : null}
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}
