/**
 * Central notification service.
 *
 * Event → create in-app (if prefs allow) → check email prefs → Resend (if allowed)
 *
 * All social/activity notifications must flow through `notify()` / `createNotification()`.
 * Do not call Resend directly from feature actions.
 */

import type { NotificationType } from "@/features/notifications/constants";
import { getChannelDecision } from "@/lib/email/preferences";
import { dispatchNotificationEmail } from "@/lib/email/dispatch";
import { resolveRecipientEmail } from "@/lib/email/preferences";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

export type NotifyInput = {
  userId: string;
  actorId?: string | null;
  type: NotificationType | string;
  message: string;
  action?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  href?: string | null;
  thumbnailUrl?: string | null;
};

export type NotifyResult = {
  ok: boolean;
  inAppCreated: boolean;
  emailAttempted: boolean;
  emailSent: boolean;
  skippedReason?: string;
};

type LogFields = Record<string, string | number | boolean | null | undefined>;

function logNotify(step: string, fields: LogFields = {}) {
  const payload = Object.entries(fields)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${v === null ? "null" : String(v)}`)
    .join(" ");
  console.info(`[notify:${step}] ${payload}`.trim());
}

/** Insert a notification for a recipient. Never notifies the actor themselves. */
export async function createNotification(
  supabase: AnySupabase,
  input: NotifyInput,
): Promise<NotifyResult> {
  return notify(supabase, input);
}

/**
 * Central pipeline — prefer this name in new code.
 */
export async function notify(
  supabase: AnySupabase,
  input: NotifyInput,
): Promise<NotifyResult> {
  logNotify("event_received", {
    type: input.type,
    userId: input.userId,
    actorId: input.actorId ?? null,
  });

  if (input.actorId && input.actorId === input.userId) {
    logNotify("skipped", { reason: "self_actor", type: input.type });
    return {
      ok: true,
      inAppCreated: false,
      emailAttempted: false,
      emailSent: false,
      skippedReason: "self_actor",
    };
  }

  let decision: Awaited<ReturnType<typeof getChannelDecision>> = {
    inApp: true,
    email: false,
    push: false,
    frequency: "instant",
  };

  try {
    decision = await getChannelDecision(supabase, input.userId, input.type);
    logNotify("preference_checked", {
      type: input.type,
      userId: input.userId,
      inApp: decision.inApp,
      email: decision.email,
      frequency: decision.frequency,
    });
  } catch (e) {
    logNotify("preference_error", {
      type: input.type,
      userId: input.userId,
      error: e instanceof Error ? e.message : "unknown",
    });
    // Keep in-app when prefs unavailable; email stays off until prefs resolve.
    decision = {
      inApp: true,
      email: false,
      push: false,
      frequency: "instant",
    };
  }

  let inAppCreated = false;
  if (decision.inApp) {
    const { error } = await supabase.from("notifications").insert({
      user_id: input.userId,
      actor_id: input.actorId ?? null,
      type: input.type,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      message: input.message,
      action: input.action ?? null,
      href: input.href ?? null,
      thumbnail_url: input.thumbnailUrl ?? null,
    });
    if (error) {
      logNotify("in_app_failed", {
        type: input.type,
        userId: input.userId,
        error: error.message,
      });
    } else {
      inAppCreated = true;
      logNotify("in_app_created", {
        type: input.type,
        userId: input.userId,
      });
    }
  } else {
    logNotify("in_app_skipped", {
      type: input.type,
      userId: input.userId,
      reason: "preference_disabled",
    });
  }

  let emailAttempted = false;
  let emailSent = false;

  if (!decision.email) {
    logNotify("email_skipped", {
      type: input.type,
      userId: input.userId,
      reason: "preference_disabled_or_digest",
      frequency: decision.frequency,
    });
    return {
      ok: true,
      inAppCreated,
      emailAttempted,
      emailSent,
      skippedReason: "email_preference",
    };
  }

  emailAttempted = true;
  logNotify("email_queued", {
    type: input.type,
    userId: input.userId,
  });

  let actorName: string | null = null;
  if (input.actorId) {
    actorName = await actorLabel(supabase, input.actorId);
  }

  try {
    const recipient = await resolveRecipientEmail(input.userId, supabase);
    if (!recipient) {
      logNotify("email_aborted", {
        type: input.type,
        userId: input.userId,
        reason: "no_recipient_email",
      });
      return {
        ok: true,
        inAppCreated,
        emailAttempted,
        emailSent: false,
        skippedReason: "no_recipient_email",
      };
    }

    logNotify("resend_calling", {
      type: input.type,
      userId: input.userId,
      to: recipient,
    });

    const result = await dispatchNotificationEmail(supabase, {
      userId: input.userId,
      type: input.type,
      message: input.message,
      href: input.href,
      actorName,
      skipPreferenceCheck: true,
      to: recipient,
    });

    emailSent = Boolean(result?.ok && !result.skipped);
    logNotify(emailSent ? "resend_success" : "resend_result", {
      type: input.type,
      userId: input.userId,
      to: recipient,
      ok: result?.ok ?? false,
      skipped: result?.skipped ?? false,
      id: result && "id" in result ? result.id : null,
      error: result && "error" in result ? result.error : null,
    });
  } catch (e) {
    logNotify("resend_failure", {
      type: input.type,
      userId: input.userId,
      error: e instanceof Error ? e.message : "unknown",
    });
  }

  return { ok: true, inAppCreated, emailAttempted, emailSent };
}

export async function createNotifications(
  supabase: AnySupabase,
  inputs: NotifyInput[],
): Promise<void> {
  for (const input of inputs) {
    await notify(supabase, input);
  }
}

export async function actorLabel(
  supabase: AnySupabase,
  actorId: string,
): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("id", actorId)
    .maybeSingle();
  return data?.display_name ?? data?.username ?? "Someone";
}

/** Alias for clarity in call sites. */
export { notify as notificationService };
