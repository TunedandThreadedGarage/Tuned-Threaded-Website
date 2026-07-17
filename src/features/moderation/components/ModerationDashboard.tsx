"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  updateFlagStatus,
  updateReportStatus,
} from "@/features/moderation/actions";
import { REPORT_REASON_LABELS } from "@/features/moderation/constants";
import type { ContentReport, ModerationFlag, ReportStatus } from "@/types/database";

const STATUSES: ReportStatus[] = ["open", "reviewed", "actioned", "dismissed"];

export function ModerationDashboard({
  reports,
  flags,
}: {
  reports: ContentReport[];
  flags: ModerationFlag[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"reports" | "flags">("reports");
  const [pending, start] = useTransition();

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
          Admin
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold text-text">
          Moderation
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Review user reports and behavior-based auto-flags. Normal profanity is
          not censored.
        </p>
      </div>

      <div className="flex gap-4 text-sm">
        <button
          type="button"
          onClick={() => setTab("reports")}
          className={tab === "reports" ? "text-text" : "text-text-muted"}
        >
          Reports ({reports.filter((r) => r.status === "open").length} open)
        </button>
        <button
          type="button"
          onClick={() => setTab("flags")}
          className={tab === "flags" ? "text-text" : "text-text-muted"}
        >
          Auto-flags ({flags.filter((f) => f.status === "open").length} open)
        </button>
      </div>

      {tab === "reports" ? (
        <ul className="divide-y divide-border border border-border">
          {reports.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-text-muted">
              No reports.
            </li>
          ) : null}
          {reports.map((r) => (
            <li key={r.id} className="space-y-2 px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-text">
                    {REPORT_REASON_LABELS[r.reason]} · {r.target_type}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    Target {r.target_id}
                    {r.target_user_id ? ` · user ${r.target_user_id}` : ""}
                  </p>
                  {r.details ? (
                    <p className="mt-2 text-sm text-text-muted">{r.details}</p>
                  ) : null}
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-metal">
                    {r.status} · {new Date(r.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={pending || r.status === s}
                      className="border border-border px-2 py-1 text-[11px] text-text-muted hover:text-text disabled:opacity-40"
                      onClick={() =>
                        start(async () => {
                          await updateReportStatus(r.id, s);
                          router.refresh();
                        })
                      }
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="divide-y divide-border border border-border">
          {flags.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-text-muted">
              No auto-flags.
            </li>
          ) : null}
          {flags.map((f) => (
            <li key={f.id} className="space-y-2 px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-text">
                    {f.category} · score {f.score} · {f.source_type}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    Source {f.source_id}
                    {f.user_id ? ` · user ${f.user_id}` : ""}
                  </p>
                  {f.excerpt ? (
                    <p className="mt-2 text-sm text-text-muted">“{f.excerpt}”</p>
                  ) : null}
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-metal">
                    {f.status} · {new Date(f.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={pending || f.status === s}
                      className="border border-border px-2 py-1 text-[11px] text-text-muted hover:text-text disabled:opacity-40"
                      onClick={() =>
                        start(async () => {
                          await updateFlagStatus(f.id, s);
                          router.refresh();
                        })
                      }
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
