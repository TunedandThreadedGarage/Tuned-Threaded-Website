/**
 * Drains the delayed notification email queue.
 *
 * Uses the service-role client. `claim_due_notification_emails` cancels rows
 * whose recipient came back online, already read the notification/message,
 * or disabled email — then claims what's left. We render + send via Resend
 * and finalize with provider message IDs / retry-aware failures.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { renderNotificationEmail } from "@/lib/email/dispatch";
import { isEmailConfigured, sendEmail } from "@/lib/email/client";

type QueueRow = {
  id: string;
  user_id: string;
  type: string;
  event_key: string;
  payload: {
    message?: string;
    href?: string | null;
    actorName?: string | null;
  } | null;
  email: string | null;
  idempotency_key?: string | null;
  attempts?: number | null;
};

export type QueueProcessResult = {
  claimed: number;
  sent: number;
  failed: number;
  cancelled: number;
};

function log(step: string, fields: Record<string, unknown> = {}) {
  console.info(
    JSON.stringify({
      scope: "notify.queue",
      event: step,
      ...fields,
    }),
  );
}

async function finalize(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  row: QueueRow,
  status: "sent" | "failed" | "cancelled",
  detail?: string,
  providerMessageId?: string | null,
) {
  const { error } = await supabase.rpc("finalize_notification_email", {
    p_id: row.id,
    p_status: status,
    p_error: detail ?? null,
    p_provider_message_id: providerMessageId ?? null,
  });
  if (error) {
    // Fallback to secret-guarded 4-arg overload if needed.
    const secret = process.env.NOTIFY_LOOKUP_SECRET;
    if (secret) {
      const fallback = await supabase.rpc("finalize_notification_email", {
        p_secret: secret,
        p_id: row.id,
        p_status: status,
        p_error: detail ?? null,
      });
      if (fallback.error) {
        log("finalize_failed", {
          queueId: row.id,
          error: fallback.error.message,
        });
      }
      return;
    }
    log("finalize_failed", { queueId: row.id, error: error.message });
  }
}

export async function processNotificationEmailQueue(
  limit = 20,
): Promise<QueueProcessResult> {
  if (!isSupabaseConfigured()) {
    log("skipped", { reason: "missing_supabase" });
    return { claimed: 0, sent: 0, failed: 0, cancelled: 0 };
  }

  const supabase = createAdminClient();
  if (!supabase) {
    log("skipped", { reason: "missing_service_role" });
    return { claimed: 0, sent: 0, failed: 0, cancelled: 0 };
  }

  if (!isEmailConfigured()) {
    log("skipped", { reason: "missing_RESEND_API_KEY" });
    // Do not claim rows when we cannot send — leave them pending.
    return { claimed: 0, sent: 0, failed: 0, cancelled: 0 };
  }

  const { data, error } = await supabase.rpc("claim_due_notification_emails", {
    p_limit: limit,
  });
  if (error) {
    // Transitional secret-guarded overload
    const secret = process.env.NOTIFY_LOOKUP_SECRET;
    if (!secret) {
      log("claim_failed", { error: error.message });
      return { claimed: 0, sent: 0, failed: 0, cancelled: 0 };
    }
    const fallback = await supabase.rpc("claim_due_notification_emails", {
      p_secret: secret,
      p_limit: limit,
    });
    if (fallback.error) {
      log("claim_failed", { error: fallback.error.message });
      return { claimed: 0, sent: 0, failed: 0, cancelled: 0 };
    }
    return processRows(supabase, (fallback.data ?? []) as QueueRow[]);
  }

  return processRows(supabase, (data ?? []) as QueueRow[]);
}

async function processRows(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  rows: QueueRow[],
): Promise<QueueProcessResult> {
  if (rows.length === 0) {
    return { claimed: 0, sent: 0, failed: 0, cancelled: 0 };
  }

  log("claimed", { count: rows.length });

  let sent = 0;
  let failed = 0;
  let cancelled = 0;

  // Bounded concurrency (max 5 in parallel).
  const concurrency = Math.min(5, rows.length);
  let cursor = 0;

  async function worker() {
    while (cursor < rows.length) {
      const idx = cursor;
      cursor += 1;
      const row = rows[idx];
      await handleRow(supabase, row, {
        onSent: () => {
          sent += 1;
        },
        onFailed: () => {
          failed += 1;
        },
        onCancelled: () => {
          cancelled += 1;
        },
      });
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  return { claimed: rows.length, sent, failed, cancelled };
}

async function handleRow(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  row: QueueRow,
  counters: {
    onSent: () => void;
    onFailed: () => void;
    onCancelled: () => void;
  },
) {
  if (!row.email) {
    counters.onFailed();
    log("no_recipient", {
      queueId: row.id,
      userId: row.user_id,
      type: row.type,
    });
    await finalize(supabase, row, "failed", "no_recipient_email");
    return;
  }

  // Final pre-send recheck: online presence.
  try {
    const { data: presence } = await supabase
      .from("user_presence")
      .select("status, last_seen_at")
      .eq("user_id", row.user_id)
      .maybeSingle();
    if (
      presence?.status === "online" &&
      presence.last_seen_at &&
      Date.now() - new Date(presence.last_seen_at).getTime() < 2 * 60 * 1000
    ) {
      counters.onCancelled();
      log("email_cancelled", {
        queueId: row.id,
        userId: row.user_id,
        type: row.type,
        reason: "user_active_presend",
      });
      await finalize(supabase, row, "cancelled", "user_active");
      return;
    }
  } catch {
    // Proceed if presence check fails.
  }

  const tpl = renderNotificationEmail({
    type: row.type,
    message: row.payload?.message ?? "You have new activity",
    href: row.payload?.href ?? null,
    actorName: row.payload?.actorName ?? null,
  });

  const idempotencyKey =
    row.idempotency_key ?? `notify-queue:${row.id}:attempt:${row.attempts ?? 1}`;

  log("sending", {
    queueId: row.id,
    userId: row.user_id,
    type: row.type,
    to: row.email,
    subject: tpl.subject,
    attempt: row.attempts ?? 1,
    idempotencyKey,
  });

  const result = await sendEmail({
    to: row.email,
    subject: tpl.subject,
    html: tpl.html,
    idempotencyKey,
  });

  if (result.ok) {
    counters.onSent();
    log("email_sent", {
      queueId: row.id,
      userId: row.user_id,
      type: row.type,
      to: row.email,
      resendId: "id" in result ? result.id : null,
      resendResponse: result,
    });
    await finalize(supabase, row, "sent", undefined, result.id ?? null);
  } else {
    counters.onFailed();
    log("send_failed", {
      queueId: row.id,
      userId: row.user_id,
      type: row.type,
      error: result.error,
      attempt: row.attempts ?? 1,
    });
    await finalize(supabase, row, "failed", result.error);
  }
}
