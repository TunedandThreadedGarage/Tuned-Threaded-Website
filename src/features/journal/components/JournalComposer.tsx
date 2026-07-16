"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { upsertJournalEntry, type ActionResult } from "@/features/journal/actions";
import { JOURNAL_CATEGORIES } from "@/features/journal/constants";
import { RichTextEditor } from "@/features/journal/components/RichTextEditor";
import { MediaUpload } from "@/components/media/MediaUpload";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";

const initial: ActionResult = {};

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

export function JournalComposer({
  userId,
  builds,
}: {
  userId: string;
  builds: { id: string; title: string }[];
}) {
  const [state, formAction] = useActionState(upsertJournalEntry, initial);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full border border-dashed border-border bg-surface/30 px-5 py-6 text-left transition-colors hover:border-metal/50 hover:bg-surface/50"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-metal">
          Create
        </p>
        <p className="mt-1 font-[family-name:var(--font-display)] text-lg text-text">
          Create Journal Entry
        </p>
        <p className="mt-1 text-sm text-text-muted">
          Build logs, photos, videos — public or private.
        </p>
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-4 border border-border bg-surface/20 p-5 md:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-metal">
            New entry
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold text-text">
            Create Journal Entry
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-text-muted hover:text-text"
        >
          Cancel
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Date" name="entry_date" type="date" defaultValue={today} />
        <FormField label="Title" name="title" required placeholder="Late night torque…" />
      </div>

      <RichTextEditor />

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm text-text-muted">
          Visibility
          <select
            name="visibility"
            defaultValue="private"
            className="mt-2 w-full border border-border bg-surface px-3 py-2.5 text-sm text-text"
          >
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
        </label>
        <label className="block text-sm text-text-muted">
          Status
          <select
            name="status"
            defaultValue="published"
            className="mt-2 w-full border border-border bg-surface px-3 py-2.5 text-sm text-text"
          >
            <option value="published">Publish</option>
            <option value="draft">Save draft</option>
          </select>
        </label>
        <label className="block text-sm text-text-muted">
          Category
          <select
            name="category"
            defaultValue="Build Log"
            className="mt-2 w-full border border-border bg-surface px-3 py-2.5 text-sm text-text"
          >
            {JOURNAL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      {builds.length > 0 ? (
        <label className="block text-sm text-text-muted">
          Link build (optional)
          <select
            name="build_id"
            defaultValue=""
            className="mt-2 w-full border border-border bg-surface px-3 py-2.5 text-sm text-text"
          >
            <option value="">None</option>
            {builds.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div>
        <p className="mb-2 text-sm text-text-muted">Photos & videos</p>
        <MediaUpload
          bucket="garage"
          pathPrefix={`${userId}/journal`}
          accept="both"
          multiple
          maxFiles={8}
          variant="compact"
          onUrlsChange={setMediaUrls}
        />
        <input type="hidden" name="media_urls" value={JSON.stringify(mediaUrls)} />
      </div>

      {state.error ? <p className="text-sm text-accent">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-text-muted">Entry saved.</p>
      ) : null}

      <Submit label="Save entry" />
    </form>
  );
}
