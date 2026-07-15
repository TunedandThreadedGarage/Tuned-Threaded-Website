"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
  acceptAttr,
  autoProcessForUpload,
  detectKind,
  processImageFile,
  validateFile,
  type MediaKind,
} from "@/lib/media";

export type UploadedMedia = {
  publicUrl: string;
  storagePath: string;
  kind: MediaKind;
  name: string;
};

type QueueItem = {
  id: string;
  file: File;
  previewUrl: string;
  kind: MediaKind;
  rotate: 0 | 90 | 180 | 270;
  progress: number;
  status: "queued" | "processing" | "uploading" | "done" | "error";
  error?: string;
  uploaded?: UploadedMedia;
};

export type MediaUploadProps = {
  bucket: "avatars" | "banners" | "garage" | "builds";
  /** Path prefix already includes auth user id, e.g. `${userId}/community` */
  pathPrefix: string;
  accept?: "image" | "video" | "both";
  multiple?: boolean;
  maxFiles?: number;
  label?: string;
  variant?: "default" | "avatar" | "banner" | "compact";
  /** Upload immediately after files are staged (default true). */
  autoUpload?: boolean;
  disabled?: boolean;
  className?: string;
  onUploaded?: (files: UploadedMedia[]) => void;
  /** Fired whenever successful public URLs change (for form hidden fields). */
  onUrlsChange?: (urls: string[]) => void;
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function MediaUpload({
  bucket,
  pathPrefix,
  accept = "image",
  multiple = false,
  maxFiles = 8,
  label = "Upload media",
  variant = "default",
  autoUpload = true,
  disabled = false,
  className = "",
  onUploaded,
  onUrlsChange,
}: MediaUploadProps) {
  const inputId = useId();
  const cameraRef = useRef<HTMLInputElement>(null);
  const deviceRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [cropId, setCropId] = useState<string | null>(null);
  const [cropDraft, setCropDraft] = useState({
    x: 10,
    y: 10,
    w: 80,
    h: 80,
  });
  const queueRef = useRef(queue);
  const uploadRef = useRef<(ids?: string[]) => Promise<void>>(async () => {});

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  const acceptMode = accept;
  const acceptString = useMemo(() => acceptAttr(acceptMode), [acceptMode]);

  const doneUrls = queue
    .filter((q) => q.status === "done" && q.uploaded)
    .map((q) => q.uploaded!.publicUrl);

  useEffect(() => {
    onUrlsChange?.(doneUrls);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneUrls.join("|")]);

  const updateItem = useCallback((id: string, patch: Partial<QueueItem>) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }, []);

  const uploadItems = useCallback(
    async (ids?: string[]) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setMessage("Sign in required to upload.");
        return;
      }

      const snapshot = queueRef.current;
      const targets =
        ids ??
        snapshot.filter((q) => q.status === "queued" || q.status === "error").map((q) => q.id);
      const uploaded: UploadedMedia[] = [];

      for (const id of targets) {
        const found = queueRef.current.find((q) => q.id === id);
        if (!found || found.status === "done") continue;
        const currentFile = found.file;
        const currentKind = found.kind;
        const currentRotate = found.rotate;
        updateItem(id, { status: "processing", progress: 5, error: undefined });

        try {
          let fileToSend = currentFile;
          if (currentKind === "image") {
            fileToSend = await processImageFile(currentFile, {
              rotate: currentRotate,
            });
            fileToSend = await autoProcessForUpload(fileToSend);
          }

          updateItem(id, { status: "uploading", progress: 20 });

          const ext =
            fileToSend.name.split(".").pop()?.toLowerCase() ||
            (currentKind === "video" ? "mp4" : "jpg");
          const path = `${pathPrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

          let tick = 20;
          const timer = window.setInterval(() => {
            tick = Math.min(tick + 8, 90);
            updateItem(id, { progress: tick });
          }, 180);

          const { error } = await supabase.storage
            .from(bucket)
            .upload(path, fileToSend, {
              upsert: true,
              contentType: fileToSend.type || undefined,
            });
          window.clearInterval(timer);

          if (error) {
            updateItem(id, {
              status: "error",
              progress: 0,
              error: error.message.includes("Bucket not found")
                ? "Storage bucket missing — run storage migrations in Supabase."
                : error.message,
            });
            continue;
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from(bucket).getPublicUrl(path);

          const payload: UploadedMedia = {
            publicUrl,
            storagePath: path,
            kind: currentKind,
            name: fileToSend.name,
          };
          uploaded.push(payload);
          updateItem(id, {
            status: "done",
            progress: 100,
            uploaded: payload,
          });
        } catch (e) {
          updateItem(id, {
            status: "error",
            progress: 0,
            error: e instanceof Error ? e.message : "Upload failed.",
          });
        }
      }

      if (uploaded.length) {
        onUploaded?.(uploaded);
        setMessage(
          uploaded.length === 1
            ? "Upload complete."
            : `${uploaded.length} files uploaded.`,
        );
      }
    },
    [bucket, onUploaded, pathPrefix, updateItem],
  );

  useEffect(() => {
    uploadRef.current = uploadItems;
  }, [uploadItems]);

  const stageFiles = useCallback(
    async (list: FileList | File[] | null) => {
      if (!list || disabled) return;
      const files = Array.from(list);
      const room = multiple ? maxFiles - queueRef.current.length : 1;
      if (room <= 0) {
        setMessage(`Maximum ${maxFiles} file${maxFiles === 1 ? "" : "s"}.`);
        return;
      }

      const next: QueueItem[] = [];
      for (const file of files.slice(0, room)) {
        const err = validateFile(file, acceptMode);
        if (err) {
          setMessage(err);
          continue;
        }
        const kind = detectKind(file);
        if (!kind) continue;
        next.push({
          id: uid(),
          file,
          previewUrl: URL.createObjectURL(file),
          kind,
          rotate: 0,
          progress: 0,
          status: "queued",
        });
      }
      if (next.length === 0) return;

      setMessage(null);
      setPickerOpen(false);
      setQueue((prev) => (multiple ? [...prev, ...next] : next));

      if (autoUpload) {
        window.setTimeout(() => {
          void uploadRef.current(next.map((n) => n.id));
        }, 30);
      }
    },
    [acceptMode, autoUpload, disabled, maxFiles, multiple],
  );

  useEffect(() => {
    return () => {
      queue.forEach((q) => URL.revokeObjectURL(q.previewUrl));
    };
    // only on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function removeItem(id: string) {
    setQueue((prev) => {
      const item = prev.find((q) => q.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((q) => q.id !== id);
    });
  }

  function moveItem(id: string, dir: -1 | 1) {
    setQueue((prev) => {
      const i = prev.findIndex((q) => q.id === id);
      if (i < 0) return prev;
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      const [row] = copy.splice(i, 1);
      copy.splice(j, 0, row);
      return copy;
    });
  }

  function rotateItem(id: string) {
    setQueue((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              rotate: ((q.rotate + 90) % 360) as 0 | 90 | 180 | 270,
              status:
                q.status === "done" || q.status === "error"
                  ? "queued"
                  : q.status,
              uploaded: undefined,
              progress: 0,
            }
          : q,
      ),
    );
    if (autoUpload) {
      window.setTimeout(() => {
        void uploadRef.current([id]);
      }, 30);
    }
  }

  async function applyCrop() {
    if (!cropId) return;
    const item = queue.find((q) => q.id === cropId);
    if (!item || item.kind !== "image") {
      setCropId(null);
      return;
    }
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new window.Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("Crop failed."));
        el.src = item.previewUrl;
      });
      const crop = {
        x: Math.round((cropDraft.x / 100) * img.naturalWidth),
        y: Math.round((cropDraft.y / 100) * img.naturalHeight),
        w: Math.round((cropDraft.w / 100) * img.naturalWidth),
        h: Math.round((cropDraft.h / 100) * img.naturalHeight),
      };
      const next = await processImageFile(item.file, {
        crop,
        rotate: item.rotate,
      });
      URL.revokeObjectURL(item.previewUrl);
      const previewUrl = URL.createObjectURL(next);
      setQueue((prev) =>
        prev.map((q) =>
          q.id === cropId
            ? {
                ...q,
                file: next,
                previewUrl,
                rotate: 0,
                status: "queued",
                uploaded: undefined,
                progress: 0,
              }
            : q,
        ),
      );
      setCropId(null);
      if (autoUpload) void uploadRef.current([cropId]);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Crop failed.");
      setCropId(null);
    }
  }

  const aspectClass =
    variant === "avatar"
      ? "aspect-square max-w-[160px] rounded-full"
      : variant === "banner"
        ? "aspect-[3/1] w-full"
        : "min-h-[140px] w-full";

  return (
    <div className={`space-y-3 ${className}`}>
      {label ? (
        <p className="text-sm font-medium text-text">{label}</p>
      ) : null}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void stageFiles(e.dataTransfer.files);
        }}
        className={`border border-dashed px-4 py-6 transition-colors ${
          dragOver
            ? "border-accent bg-accent-soft/30"
            : "border-border bg-surface/20 hover:border-metal/40"
        } ${aspectClass.includes("rounded-full") ? "" : ""}`}
      >
        <div className={`mx-auto flex flex-col items-center justify-center gap-3 ${aspectClass}`}>
          <p className="text-center text-sm text-text-muted">
            Drag &amp; drop files here, or upload from your device
          </p>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setPickerOpen(true)}
            className="border border-border bg-surface px-5 py-2.5 text-sm text-text transition-colors hover:border-metal/40 disabled:opacity-50"
          >
            Upload Photo
          </button>
        </div>
      </div>

      {/* Hidden inputs */}
      <input
        ref={cameraRef}
        id={`${inputId}-camera`}
        type="file"
        accept={acceptString}
        capture="environment"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          void stageFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={deviceRef}
        id={`${inputId}-device`}
        type="file"
        accept={acceptString}
        multiple={multiple}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          void stageFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {pickerOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setPickerOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm border border-border bg-surface p-6 shadow-2xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
              Media
            </p>
            <h3 className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold text-text">
              Upload Photo
            </h3>
            <div className="mt-6 space-y-3">
              <button
                type="button"
                className="flex w-full items-center gap-3 border border-border px-4 py-3 text-left text-sm text-text transition-colors hover:border-accent"
                onClick={() => {
                  setPickerOpen(false);
                  // Prefer camera; fallback is same file input
                  cameraRef.current?.click();
                }}
              >
                <span aria-hidden className="text-lg">
                  📷
                </span>
                <span>
                  <span className="block font-medium">Take Photo</span>
                  <span className="text-xs text-text-muted">
                    Opens camera on supported devices
                  </span>
                </span>
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-3 border border-border px-4 py-3 text-left text-sm text-text transition-colors hover:border-accent"
                onClick={() => {
                  setPickerOpen(false);
                  deviceRef.current?.click();
                }}
              >
                <span aria-hidden className="text-lg">
                  🖼
                </span>
                <span>
                  <span className="block font-medium">Choose From Device</span>
                  <span className="text-xs text-text-muted">
                    Photos{accept !== "image" ? " & videos" : ""} from your library
                  </span>
                </span>
              </button>
            </div>
            <button
              type="button"
              className="mt-4 w-full text-sm text-text-muted hover:text-text"
              onClick={() => setPickerOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {queue.length > 0 ? (
        <ul className="space-y-3">
          {queue.map((item, index) => (
            <li
              key={item.id}
              className="border border-border bg-bg/40 p-3"
            >
              <div className="flex gap-3">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden border border-border bg-surface-elevated">
                  {item.kind === "image" ? (
                    <Image
                      src={item.previewUrl}
                      alt=""
                      fill
                      className="object-cover"
                      style={{ transform: `rotate(${item.rotate}deg)` }}
                      unoptimized
                      sizes="80px"
                    />
                  ) : (
                    <video
                      src={item.previewUrl}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="truncate text-sm text-text">{item.file.name}</p>
                  <div className="h-1 overflow-hidden bg-surface-elevated">
                    <div
                      className={`h-full transition-all duration-300 ${
                        item.status === "error" ? "bg-accent" : "bg-accent"
                      }`}
                      style={{
                        width: `${item.progress}%`,
                        opacity: item.status === "queued" ? 0.35 : 1,
                      }}
                    />
                  </div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-metal">
                    {item.status === "uploading" || item.status === "processing"
                      ? `${item.progress}%`
                      : item.status === "done"
                        ? "Complete"
                        : item.status === "error"
                          ? item.error || "Failed"
                          : "Queued"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {item.kind === "image" ? (
                      <>
                        <button
                          type="button"
                          className="text-[11px] text-text-muted hover:text-text"
                          onClick={() => rotateItem(item.id)}
                        >
                          Rotate
                        </button>
                        <button
                          type="button"
                          className="text-[11px] text-text-muted hover:text-text"
                          onClick={() => {
                            setCropDraft({ x: 10, y: 10, w: 80, h: 80 });
                            setCropId(item.id);
                          }}
                        >
                          Crop
                        </button>
                      </>
                    ) : null}
                    {multiple ? (
                      <>
                        <button
                          type="button"
                          className="text-[11px] text-text-muted hover:text-text"
                          disabled={index === 0}
                          onClick={() => moveItem(item.id, -1)}
                        >
                          Up
                        </button>
                        <button
                          type="button"
                          className="text-[11px] text-text-muted hover:text-text"
                          disabled={index === queue.length - 1}
                          onClick={() => moveItem(item.id, 1)}
                        >
                          Down
                        </button>
                      </>
                    ) : null}
                    {item.status === "error" || item.status === "queued" ? (
                      <button
                        type="button"
                        className="text-[11px] text-text-muted hover:text-text"
                        onClick={() => void uploadRef.current([item.id])}
                      >
                        Retry
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="text-[11px] text-accent hover:underline"
                      onClick={() => removeItem(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {!autoUpload && queue.some((q) => q.status === "queued") ? (
        <button
          type="button"
          onClick={() => void uploadRef.current()}
          className="border border-accent bg-accent px-4 py-2 text-sm text-white hover:opacity-90"
        >
          Upload queue
        </button>
      ) : null}

      {message ? (
        <p className="text-xs text-text-muted" role="status">
          {message}
        </p>
      ) : null}

      {cropId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-bg/85 backdrop-blur-sm"
            aria-label="Close crop"
            onClick={() => setCropId(null)}
          />
          <div className="relative z-10 w-full max-w-md space-y-4 border border-border bg-surface p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-metal">
              Crop
            </p>
            <p className="text-sm text-text-muted">
              Adjust crop box as percent of the image (simple controls).
            </p>
            {(
              [
                ["x", "X %"],
                ["y", "Y %"],
                ["w", "Width %"],
                ["h", "Height %"],
              ] as const
            ).map(([key, lab]) => (
              <label key={key} className="block text-xs text-text">
                {lab}
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={cropDraft[key]}
                  onChange={(e) =>
                    setCropDraft((d) => ({
                      ...d,
                      [key]: Number(e.target.value),
                    }))
                  }
                  className="mt-1 w-full accent-[var(--color-accent)]"
                />
              </label>
            ))}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="border border-border px-4 py-2 text-sm text-text-muted"
                onClick={() => setCropId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="border border-accent bg-accent px-4 py-2 text-sm text-white"
                onClick={() => void applyCrop()}
              >
                Apply crop
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
