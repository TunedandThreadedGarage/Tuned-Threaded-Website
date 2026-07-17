/**
 * Central notification service.
 *
 * Activity:
 *   Event → create in-app (if prefs allow) → check email prefs → check presence
 *     → online: no email
 *     → away/offline: queue a delayed email (cancelled automatically if the
 *       user returns, opens Messages, reads the message, or opens/dismisses
 *       the notification). The queue is drained by /api/notifications/process-queue.
 *
 * Transactional / mandatory mail (welcome, verification, password reset,
 * orders, security) always sends immediately via `sendMandatoryEmail`,
 * bypassing both presence and notification preferences.
 *
 * All social/activity notifications must flow through `notify()` / `createNotification()`.
 * Do not call Resend directly from feature actions.
 */

import type { NotificationType } from "@/features/notifications/constants";
import { getChannelDecision } from "@/lib/email/preferences";
import {
  dispatchNotificationEmail,
  renderNotificationEmail,
  sendWelcomeEmail as dispatchWelcome,
  sendVerifyEmail as dispatchVerify,
  sendPasswordResetEmail as dispatchPasswordReset,
  sendSecurityEmail as dispatchSecurity,
  sendOrderEmail as dispatchOrder,
} from "@/lib/email/dispatch";
import { resolveRecipientEmail } from "@/lib/email/preferences";
import {
  emailDelaySeconds,
  resolvePresence,
  type PresenceState,
} from "@/lib/email/deliveryPolicy";
import { eventKeyForNotificationType } from "@/lib/email/channelDecision";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/client";

/** Types that must email immediately regardless of presence / preferences. */
const ALWAYS_IMMEDIATE_TYPES = new Set([
  "order_update",
  "order_confirmation",
  "order_shipped",
  "order_delivered",
  "shipping_update",
  "security_alert",
]);

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
  emailQueued?: boolean;
  presence?: PresenceState;
  skippedReason?: string;
};

type LogFields = Record<string, string | number | boolean | null | undefined>;

function logNotify(step: string, fields: LogFields = {}) {
  console.info(
    JSON.stringify({
      scope: "notify",
      event: step,
      ...fields,
    }),
  );
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

  const isMandatory = ALWAYS_IMMEDIATE_TYPES.has(input.type);

  let decision: Awaited<ReturnType<typeof getChannelDecision>> = {
    inApp: true,
    email: false,
    push: false,
    frequency: "instant",
  };

  try {
    decision = await getChannelDecision(supabase, input.userId, input.type, {
      force: isMandatory,
    });
    logNotify("preference_checked", {
      type: input.type,
      userId: input.userId,
      inApp: decision.inApp,
      email: decision.email,
      frequency: decision.frequency,
      mandatory: isMandatory,
    });
  } catch (e) {
    logNotify("preference_error", {
      type: input.type,
      userId: input.userId,
      error: e instanceof Error ? e.message : "unknown",
    });
    decision = isMandatory
      ? { inApp: true, email: true, push: false, frequency: "instant" }
      : {
          inApp: true,
          email: false,
          push: false,
          frequency: "instant",
        };
  }

  let inAppCreated = false;
  let notificationId: string | null = null;
  if (decision.inApp) {
    // Generate the id client-side instead of INSERT...RETURNING: the actor's
    // client can insert for the recipient (insert policy) but cannot SELECT
    // the recipient's row, so RETURNING would fail RLS and abort the insert.
    const newId = crypto.randomUUID();
    const { error } = await supabase.from("notifications").insert({
      id: newId,
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
      notificationId = newId;
      logNotify("in_app_created", {
        type: input.type,
        userId: input.userId,
        notificationId,
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

  // Mandatory types always email (bypass prefs already applied via force).
  if (isMandatory) {
    emailAttempted = true;
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
        reason: "always_immediate",
      });
      const actorName = input.actorId
        ? await actorLabel(supabase, input.actorId)
        : null;
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
      logNotify(emailSent ? "email_sent" : "resend_result", {
        type: input.type,
        userId: input.userId,
        to: recipient,
        ok: result?.ok ?? false,
        resendId: result && "id" in result ? result.id : null,
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

  let actorName: string | null = null;
  if (input.actorId) {
    actorName = await actorLabel(supabase, input.actorId);
  }

  // Presence-aware delivery: online → no email; away/offline → delayed queue.
  const presence = await recipientPresence(supabase, input.userId);
  const delaySeconds = emailDelaySeconds(input.type, presence);

  logNotify("presence_checked", {
    type: input.type,
    userId: input.userId,
    presence,
    delaySeconds: delaySeconds ?? null,
  });

  if (delaySeconds === null) {
    logNotify("email_skipped", {
      type: input.type,
      userId: input.userId,
      reason: "recipient_online",
      presence,
    });
    return {
      ok: true,
      inAppCreated,
      emailAttempted: false,
      emailSent: false,
      presence,
      skippedReason: "recipient_online",
    };
  }

  emailAttempted = true;
  const conversationId =
    input.entityType === "dm_conversation" ? input.entityId ?? null : null;
  const eventKey = eventKeyForNotificationType(input.type);
  const idempotencyKey = notificationId
    ? `${input.userId}:${eventKey}:${notificationId}`
    : conversationId
      ? `${input.userId}:${eventKey}:${conversationId}:${Date.now()}`
      : `${input.userId}:${eventKey}:${Date.now()}`;

  // Prefer service-role; fall back to the caller's authenticated client.
  const queueClient = createAdminClient() ?? supabase;

  try {
    const { data: queueId, error: queueError } = await queueClient.rpc(
      "queue_notification_email",
      {
        p_user_id: input.userId,
        p_type: input.type,
        p_event_key: eventKey,
        p_payload: {
          message: input.message,
          href: input.href ?? null,
          actorName,
        },
        p_delay_seconds: delaySeconds,
        p_notification_id: notificationId,
        p_conversation_id: conversationId,
        p_idempotency_key: idempotencyKey,
      },
    );

    if (queueError) {
      logNotify("email_queue_failed", {
        type: input.type,
        userId: input.userId,
        error: queueError.message,
      });
      return {
        ok: false,
        inAppCreated,
        emailAttempted,
        emailSent: false,
        presence,
        skippedReason: "queue_failed",
      };
    }

    logNotify("email_queued", {
      type: input.type,
      userId: input.userId,
      presence,
      delaySeconds,
      queueId: queueId ?? null,
      notificationId,
      conversationId,
      eventKey,
    });
  } catch (e) {
    logNotify("email_queue_failed", {
      type: input.type,
      userId: input.userId,
      error: e instanceof Error ? e.message : "unknown",
    });
    return {
      ok: false,
      inAppCreated,
      emailAttempted,
      emailSent: false,
      presence,
      skippedReason: "queue_failed",
    };
  }

  return {
    ok: true,
    inAppCreated,
    emailAttempted,
    emailSent: false,
    emailQueued: true,
    presence,
  };
}

async function recipientPresence(
  supabase: AnySupabase,
  userId: string,
): Promise<PresenceState> {
  try {
    const { data } = await supabase
      .from("user_presence")
      .select("status, last_seen_at")
      .eq("user_id", userId)
      .maybeSingle();
    return resolvePresence(data);
  } catch {
    return "offline";
  }
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

// ---------------------------------------------------------------------------
// Mandatory / transactional email entry points (always send)
// ---------------------------------------------------------------------------

export type MandatoryEmailKind =
  | "welcome"
  | "verify"
  | "password_reset"
  | "security"
  | "order";

/**
 * Always-send transactional email. Bypasses presence and preferences.
 * Feature code should call these instead of Resend/dispatch directly.
 */
export async function sendMandatoryEmail(input: {
  kind: "welcome";
  to: string;
}): Promise<{ ok: boolean; error?: string }>;
export async function sendMandatoryEmail(input: {
  kind: "verify";
  to: string;
  verifyUrl: string;
}): Promise<{ ok: boolean; error?: string }>;
export async function sendMandatoryEmail(input: {
  kind: "password_reset";
  to: string;
  resetUrl: string;
}): Promise<{ ok: boolean; error?: string }>;
export async function sendMandatoryEmail(input: {
  kind: "security";
  to: string;
  securityKind:
    | "passwordChanged"
    | "emailChanged"
    | "newLogin"
    | "newDeviceLogin"
    | "twoFactorEnabled";
  detail?: string;
}): Promise<{ ok: boolean; error?: string }>;
export async function sendMandatoryEmail(input: {
  kind: "order";
  to: string;
  orderKind:
    | "confirmation"
    | "receipt"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "refund"
    | "paymentFailed"
    | "shippingUpdate";
  orderId: string;
  label?: string;
  tracking?: string;
  carrier?: string;
  status?: string;
  userId?: string;
}): Promise<{ ok: boolean; error?: string }>;
export async function sendMandatoryEmail(input: {
  kind: MandatoryEmailKind;
  to: string;
  verifyUrl?: string;
  resetUrl?: string;
  securityKind?:
    | "passwordChanged"
    | "emailChanged"
    | "newLogin"
    | "newDeviceLogin"
    | "twoFactorEnabled";
  detail?: string;
  orderKind?:
    | "confirmation"
    | "receipt"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "refund"
    | "paymentFailed"
    | "shippingUpdate";
  orderId?: string;
  label?: string;
  tracking?: string;
  carrier?: string;
  status?: string;
  userId?: string;
}): Promise<{ ok: boolean; error?: string }> {
  logNotify("mandatory_email", {
    kind: input.kind,
    to: input.to,
    userId: input.userId ?? null,
  });

  try {
    switch (input.kind) {
      case "welcome":
        await dispatchWelcome(input.to);
        break;
      case "verify":
        if (!input.verifyUrl) return { ok: false, error: "missing_verify_url" };
        await dispatchVerify(input.to, input.verifyUrl);
        break;
      case "password_reset":
        if (!input.resetUrl) return { ok: false, error: "missing_reset_url" };
        await dispatchPasswordReset(input.to, input.resetUrl);
        break;
      case "security":
        if (!input.securityKind) {
          return { ok: false, error: "missing_security_kind" };
        }
        await dispatchSecurity(input.to, input.securityKind, input.detail);
        break;
      case "order": {
        if (!input.orderKind || !input.orderId) {
          return { ok: false, error: "missing_order_fields" };
        }
        // Orders/shipping always send per product requirements.
        const tpl = renderNotificationEmail({
          type:
            input.orderKind === "confirmation"
              ? "order_confirmation"
              : input.orderKind === "shipped"
                ? "order_shipped"
                : input.orderKind === "delivered"
                  ? "order_delivered"
                  : input.orderKind === "shippingUpdate"
                    ? "shipping_update"
                    : "order_update",
          message: input.label ?? `Order ${input.orderId.slice(0, 8)}`,
          href: "/garage/orders",
        });
        // Prefer branded order templates via dispatchOrder with force path.
        await dispatchOrder(input.to, input.orderKind, {
          orderId: input.orderId,
          label: input.label,
          tracking: input.tracking,
          carrier: input.carrier,
          status: input.status,
          // Omit userId so preference check inside sendOrderEmail is skipped
          // for always-send order/shipping mail.
        });
        logNotify("email_sent", {
          kind: "order",
          to: input.to,
          subject: tpl.subject,
          orderKind: input.orderKind,
        });
        break;
      }
      default:
        return { ok: false, error: "unknown_kind" };
    }
    logNotify("email_sent", { kind: input.kind, to: input.to });
    return { ok: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "unknown";
    logNotify("resend_failure", { kind: input.kind, to: input.to, error });
    return { ok: false, error };
  }
}

/** Low-level forced send used by tests / edge cases. */
export async function sendForcedHtmlEmail(input: {
  to: string;
  subject: string;
  html: string;
  type: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  logNotify("resend_calling", {
    type: input.type,
    to: input.to,
    reason: "forced",
  });
  const result = await sendEmail({
    to: input.to,
    subject: input.subject,
    html: input.html,
    force: true,
  });
  if (!result.ok) {
    logNotify("resend_failure", {
      type: input.type,
      to: input.to,
      error: result.error,
    });
    return { ok: false, error: result.error };
  }
  logNotify("email_sent", {
    type: input.type,
    to: input.to,
    resendId: result.id ?? null,
    skipped: result.skipped ?? false,
  });
  return { ok: true, id: result.id };
}

/** Alias for clarity in call sites. */
export { notify as notificationService };
