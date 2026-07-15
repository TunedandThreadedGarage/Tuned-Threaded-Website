"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import {
  createCommunityPost,
  type FeedVehicle,
} from "@/features/community/actions";
import {
  COMMUNITY_FILTERS,
  COMMUNITY_POST_TYPES,
} from "@/features/community/constants";
import { Button } from "@/components/ui/Button";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? "Publishing…" : "Publish"}
    </Button>
  );
}

export function CreatePostButton({
  signedIn,
  vehicles,
}: {
  signedIn: boolean;
  vehicles: FeedVehicle[];
}) {
  const [open, setOpen] = useState(false);

  if (!signedIn) {
    return (
      <Button
        href="/garage/sign-in"
        variant="accent"
        className="fixed bottom-6 right-6 z-40 shadow-lg"
      >
        Create Post
      </Button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 border border-accent bg-accent px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Create Post
      </button>
      {open ? (
        <CreatePostModal vehicles={vehicles} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}

function CreatePostModal({
  vehicles,
  onClose,
}: {
  vehicles: FeedVehicle[];
  onClose: () => void;
}) {
  const [state, action] = useActionState(createCommunityPost, {});
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setUploadStatus("Uploading…");
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setUploadStatus("Sign in required.");
        return;
      }
      const urls: string[] = [];
      for (const file of Array.from(files).slice(0, 6)) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          setUploadStatus("Use JPG, PNG, or WebP.");
          continue;
        }
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/community/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const { error } = await supabase.storage
          .from("garage")
          .upload(path, file, { upsert: true, contentType: file.type });
        if (error) {
          setUploadStatus(error.message);
          continue;
        }
        const {
          data: { publicUrl },
        } = supabase.storage.from("garage").getPublicUrl(path);
        urls.push(publicUrl);
      }
      setMediaUrls((prev) => [...prev, ...urls]);
      setUploadStatus(urls.length ? "Photos added." : null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[92vh] w-full max-w-xl overflow-y-auto border border-border bg-surface p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
              Community
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold text-text">
              Create post
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-text-muted hover:text-text"
          >
            Close
          </button>
        </div>

        <form action={action} className="mt-6 space-y-4">
          {mediaUrls.map((url) => (
            <input key={url} type="hidden" name="media_urls" value={url} />
          ))}
          <input type="hidden" name="tags" value={selectedTags.join(",")} />

          <label className="block text-sm text-text">
            <span className="font-medium">Type</span>
            <select
              name="post_type"
              defaultValue="status"
              className="mt-1.5 w-full border border-border bg-bg px-3 py-2.5 text-sm text-text"
            >
              {COMMUNITY_POST_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-text">
            <span className="font-medium">Title</span>
            <input
              name="title"
              className="mt-1.5 w-full border border-border bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-metal/50"
            />
          </label>

          <label className="block text-sm text-text">
            <span className="font-medium">Details</span>
            <textarea
              name="body"
              rows={4}
              className="mt-1.5 w-full border border-border bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-metal/50"
              placeholder="Share an update from the bay…"
            />
          </label>

          <label className="block text-sm text-text">
            <span className="font-medium">Vehicle</span>
            <select
              name="vehicle_id"
              defaultValue=""
              className="mt-1.5 w-full border border-border bg-bg px-3 py-2.5 text-sm text-text"
            >
              <option value="">None</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {[v.year, v.make, v.model].filter(Boolean).join(" ")}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-text">
              <span className="font-medium">YouTube URL</span>
              <input
                name="youtube_url"
                placeholder="https://youtube.com/…"
                className="mt-1.5 w-full border border-border bg-bg px-3 py-2.5 text-sm text-text"
              />
            </label>
            <label className="block text-sm text-text">
              <span className="font-medium">Video URL</span>
              <input
                name="video_url"
                placeholder="https://…"
                className="mt-1.5 w-full border border-border bg-bg px-3 py-2.5 text-sm text-text"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-text">
              <span className="font-medium">Manufacturer</span>
              <input
                name="manufacturer"
                className="mt-1.5 w-full border border-border bg-bg px-3 py-2.5 text-sm text-text"
              />
            </label>
            <label className="block text-sm text-text">
              <span className="font-medium">Horsepower</span>
              <input
                name="horsepower"
                type="number"
                className="mt-1.5 w-full border border-border bg-bg px-3 py-2.5 text-sm text-text"
              />
            </label>
            <label className="block text-sm text-text">
              <span className="font-medium">Engine</span>
              <input
                name="engine"
                className="mt-1.5 w-full border border-border bg-bg px-3 py-2.5 text-sm text-text"
              />
            </label>
            <label className="block text-sm text-text">
              <span className="font-medium">Transmission</span>
              <input
                name="transmission"
                className="mt-1.5 w-full border border-border bg-bg px-3 py-2.5 text-sm text-text"
              />
            </label>
            <label className="block text-sm text-text">
              <span className="font-medium">State</span>
              <input
                name="state"
                className="mt-1.5 w-full border border-border bg-bg px-3 py-2.5 text-sm text-text"
              />
            </label>
            <label className="block text-sm text-text">
              <span className="font-medium">Location</span>
              <input
                name="location"
                className="mt-1.5 w-full border border-border bg-bg px-3 py-2.5 text-sm text-text"
              />
            </label>
          </div>

          <div>
            <p className="text-sm font-medium text-text">Tags</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {COMMUNITY_FILTERS.map((f) => {
                const on = selectedTags.includes(f.key);
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() =>
                      setSelectedTags((prev) =>
                        on
                          ? prev.filter((t) => t !== f.key)
                          : [...prev, f.key],
                      )
                    }
                    className={`border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
                      on
                        ? "border-accent text-text"
                        : "border-border text-metal hover:border-metal/40"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="inline-flex cursor-pointer border border-border px-4 py-2 text-sm text-text hover:border-metal/40">
              {busy ? "Uploading…" : "Add photos"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                disabled={busy}
                onChange={(e) => void onFiles(e.target.files)}
              />
            </label>
            {uploadStatus ? (
              <p className="mt-2 text-xs text-text-muted">{uploadStatus}</p>
            ) : null}
            {mediaUrls.length ? (
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-metal">
                {mediaUrls.length} photo{mediaUrls.length === 1 ? "" : "s"} ready
              </p>
            ) : null}
          </div>

          {state.error ? (
            <p className="text-sm text-accent" role="alert">
              {state.error}
            </p>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="border border-border px-4 py-2 text-sm text-text-muted hover:text-text"
            >
              Cancel
            </button>
            <Submit />
          </div>
        </form>
      </div>
    </div>
  );
}
