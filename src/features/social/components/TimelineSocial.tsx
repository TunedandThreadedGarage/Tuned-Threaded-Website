"use client";

import { useActionState, useState, useTransition } from "react";
import {
  addTimelineComment,
  toggleTimelineLike,
} from "@/features/social/actions";
import type { TimelineEntryComment } from "@/types/database";
import { Button } from "@/components/ui/Button";

export function TimelineSocial({
  entryId,
  initiallyLiked,
  comments,
  canInteract,
}: {
  entryId: string;
  initiallyLiked: boolean;
  comments: TimelineEntryComment[];
  canInteract: boolean;
}) {
  const [liked, setLiked] = useState(initiallyLiked);
  const [pending, startTransition] = useTransition();
  const [state, action] = useActionState(addTimelineComment, {});

  return (
    <div className="space-y-3 border-t border-border pt-3">
      <div className="flex items-center gap-4 text-xs text-text-muted">
        <button
          type="button"
          disabled={!canInteract || pending}
          className="hover:text-text disabled:opacity-40"
          onClick={() => {
            if (!canInteract) return;
            startTransition(async () => {
              const res = await toggleTimelineLike(entryId);
              if (!res.error) setLiked((v) => !v);
            });
          }}
        >
          {liked ? "Liked" : "Like"}
        </button>
        <span>{comments.length} comments</span>
      </div>
      <ul className="space-y-2">
        {comments.slice(0, 5).map((c) => (
          <li key={c.id} className="text-sm text-text-muted">
            {c.body}
          </li>
        ))}
      </ul>
      {canInteract ? (
        <form action={action} className="flex gap-2">
          <input type="hidden" name="entry_id" value={entryId} />
          <input
            name="body"
            required
            placeholder="Add a comment…"
            className="flex-1 border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-metal/50"
          />
          <Button type="submit" variant="secondary">
            Post
          </Button>
        </form>
      ) : null}
      {state.error ? <p className="text-xs text-accent">{state.error}</p> : null}
    </div>
  );
}
