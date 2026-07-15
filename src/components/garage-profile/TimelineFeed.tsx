import Image from "next/image";
import type { TimelineEntryComment, VehicleTimelineEntry } from "@/types/database";
import { formatMoneyFromCents } from "@/lib/garage-stats";
import { TimelineSocial } from "@/features/social/components/TimelineSocial";

export function TimelineFeed({
  entries,
  commentsByEntry,
  likedEntryIds,
  canInteract,
  isOwner,
}: {
  entries: VehicleTimelineEntry[];
  commentsByEntry: Map<string, TimelineEntryComment[]>;
  likedEntryIds: Set<string>;
  canInteract: boolean;
  isOwner?: boolean;
}) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        {isOwner
          ? "Add your first timeline update to start the build history."
          : "No timeline updates yet."}
      </p>
    );
  }

  return (
    <ol className="relative space-y-8 border-l border-border pl-6">
      {entries.map((entry) => (
        <li key={entry.id} className="relative">
          <span className="absolute -left-[1.9rem] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--garage-accent,var(--color-accent))]" />
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-metal">
            {entry.entry_date}
          </p>
          <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg font-medium text-text">
            {entry.title}
          </h3>
          {entry.description ? (
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              {entry.description}
            </p>
          ) : null}
          {entry.parts_installed ? (
            <p className="mt-2 text-sm text-text">
              Parts:{" "}
              <span className="text-text-muted">{entry.parts_installed}</span>
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-text-muted">
            {entry.cost_cents != null ? (
              <span>{formatMoneyFromCents(entry.cost_cents)}</span>
            ) : null}
            {entry.hours_spent != null ? (
              <span>{entry.hours_spent} hrs</span>
            ) : null}
            {entry.video_url ? (
              <a
                href={entry.video_url}
                target="_blank"
                rel="noreferrer"
                className="text-text underline"
              >
                Watch video
              </a>
            ) : null}
          </div>
          {entry.photos?.length ? (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {entry.photos.map((url) => (
                <div
                  key={url}
                  className="relative aspect-[4/3] overflow-hidden border border-border bg-surface-elevated"
                >
                  <Image
                    src={url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="200px"
                  />
                </div>
              ))}
            </div>
          ) : null}
          <div className="mt-4">
            <TimelineSocial
              entryId={entry.id}
              initiallyLiked={likedEntryIds.has(entry.id)}
              comments={commentsByEntry.get(entry.id) ?? []}
              canInteract={canInteract}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
