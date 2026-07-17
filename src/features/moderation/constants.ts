import type { ReportReason } from "@/types/database";

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  harassment: "Harassment or Bullying",
  hate_speech: "Hate Speech",
  spam: "Spam",
  impersonation: "Impersonation",
  explicit: "Explicit Content",
  scam: "Scam",
  other: "Other",
};

export type ReportReasonKey = ReportReason;
