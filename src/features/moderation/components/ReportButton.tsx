"use client";

import { useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  createReport,
} from "@/features/moderation/actions";
import {
  REPORT_REASON_LABELS,
  type ReportReasonKey,
} from "@/features/moderation/constants";
import type { ReportTargetType } from "@/types/database";

export function ReportButton({
  targetType,
  targetId,
  targetUserId,
  label = "Report",
  className,
}: {
  targetType: ReportTargetType;
  targetId: string;
  targetUserId?: string | null;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReasonKey>("harassment");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={
          className ??
          "text-xs text-text-muted transition-colors hover:text-accent"
        }
        onClick={() => {
          setOpen(true);
          setStatus(null);
        }}
      >
        {label}
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              aria-label="Close"
              className="fixed inset-0 z-[90] bg-black/65 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal
              aria-label="Report content"
              className="fixed inset-x-4 top-[15%] z-[95] mx-auto w-full max-w-md border border-border bg-[#0c0c0e] p-5 shadow-[0_32px_80px_-32px_rgba(0,0,0,0.9)] sm:inset-x-auto"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
            >
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-text">
                Report
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                Tell us why this should be reviewed. We do not auto-censor normal language.
              </p>

              <label className="mt-4 block text-sm text-text">
                Reason
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as ReportReasonKey)}
                  className="mt-1.5 w-full border border-border bg-surface px-3 py-2.5 text-sm text-text"
                >
                  {(
                    Object.entries(REPORT_REASON_LABELS) as [
                      ReportReasonKey,
                      string,
                    ][]
                  ).map(([key, text]) => (
                    <option key={key} value={key}>
                      {text}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mt-3 block text-sm text-text">
                Details (optional)
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  className="mt-1.5 w-full resize-y border border-border bg-surface px-3 py-2.5 text-sm text-text"
                />
              </label>

              {status ? (
                <p className="mt-3 text-sm text-text-muted">{status}</p>
              ) : null}

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  disabled={pending}
                  className="bg-white px-4 py-2 text-sm font-medium text-bg"
                  onClick={() =>
                    start(async () => {
                      const res = await createReport({
                        targetType,
                        targetId,
                        targetUserId,
                        reason,
                        details,
                      });
                      if (res.error) setStatus(res.error);
                      else {
                        setStatus("Report submitted. Thank you.");
                        window.setTimeout(() => setOpen(false), 900);
                      }
                    })
                  }
                >
                  {pending ? "Sending…" : "Submit report"}
                </button>
                <button
                  type="button"
                  className="border border-border px-4 py-2 text-sm text-text-muted"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
