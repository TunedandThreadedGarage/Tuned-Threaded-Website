import { sendEmail } from "@/lib/email/client";
import { templates } from "@/lib/email/templates";
import {
  getChannelDecision,
  resolveRecipientEmail,
} from "@/lib/email/preferences";
import { siteUrl } from "@/lib/email/brand";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

function resolveTemplate(input: {
  type: string;
  message: string;
  href: string;
  actor: string;
}) {
  const { type, message, href, actor } = input;
  switch (type) {
    case "follow":
    case "garage_follow":
      return templates.newFollower(actor, href);
    case "build_follow":
      return templates.buildFollowed(actor, "your build", href);
    case "build_like":
    case "like":
      return templates.buildLiked(actor, "your build", href);
    case "post_like":
      return templates.postLiked(actor, href);
    case "journal_like":
      return templates.journalLiked(actor, href);
    case "gallery_like":
      return templates.galleryLiked(actor, href);
    case "comment":
    case "build_comment":
      return templates.someoneCommented(actor, "your content", href);
    case "journal_comment":
      return templates.someoneCommented(actor, "your journal entry", href);
    case "gallery_comment":
      return templates.someoneCommented(actor, "your gallery photo", href);
    case "reply":
    case "build_reply":
      return templates.someoneReplied(actor, href);
    case "mention":
      return templates.someoneMentioned(actor, href);
    case "post_share":
      return templates.buildShared(actor, "your post", href);
    case "build_trending":
      return templates.buildFeatured("your build", href);
    case "garage_featured":
      return templates.garageFeatured(href);
    case "marketplace_inquiry":
      return templates.newMessage(actor, href);
    case "message":
      return templates.newMessage(actor, href);
    case "message_request":
      return templates.messageRequest(actor, href);
    case "badge_earned":
      return templates.badgeEarned(message.replace(/^.*:\s*/, "") || "Badge", href);
    case "build_milestone":
      return templates.buildMilestone("your build", message, href);
    case "order_update":
    case "order_confirmation":
    case "order_shipped":
    case "order_delivered":
    case "shipping_update":
      return {
        subject: message.slice(0, 80) || "Order update",
        html: templates.shippingUpdate(message, href).html,
      };
    case "vehicle_tag":
      return templates.someoneMentioned(actor, href);
    case "event_invite":
      return templates.someoneMentioned(actor, href);
    case "build_save":
      return templates.buildLiked(actor, "your build", href);
    default:
      return {
        subject: message.slice(0, 80) || "Tuned & Threaded activity",
        html: templates.someoneCommented(actor, "your garage", href).html,
      };
  }
}

/** Map notification types to branded templates and send if prefs allow. */
export async function dispatchNotificationEmail(
  supabase: AnySupabase,
  input: {
    userId: string;
    type: string;
    message: string;
    href?: string | null;
    actorName?: string | null;
    /** Skip preference check when already validated by caller. */
    skipPreferenceCheck?: boolean;
    /** Pre-resolved recipient (avoids a second lookup). */
    to?: string | null;
  },
): Promise<{ ok: boolean; id?: string; skipped?: boolean; error?: string }> {
  if (!input.skipPreferenceCheck) {
    const decision = await getChannelDecision(
      supabase,
      input.userId,
      input.type,
    );
    if (!decision.email) {
      console.info(
        `[notify:dispatch:skip] type=${input.type} userId=${input.userId} reason=preference`,
      );
      return { ok: true, skipped: true };
    }
  }

  const to =
    input.to ?? (await resolveRecipientEmail(input.userId, supabase));
  if (!to) {
    console.error(
      `[notify:dispatch:abort] type=${input.type} userId=${input.userId} reason=no_recipient`,
    );
    return { ok: false, error: "no_recipient" };
  }

  const href = input.href?.startsWith("http")
    ? input.href
    : `${siteUrl()}${input.href || "/notifications"}`;
  const actor = input.actorName ?? "Someone";
  const tpl = resolveTemplate({
    type: input.type,
    message: input.message,
    href,
    actor,
  });

  console.info(
    `[notify:dispatch:resend] type=${input.type} userId=${input.userId} to=${to} subject=${tpl.subject}`,
  );
  return sendEmail({ to, subject: tpl.subject, html: tpl.html });
}

export async function sendWelcomeEmail(to: string): Promise<void> {
  const tpl = templates.welcome();
  await sendEmail({ to, subject: tpl.subject, html: tpl.html, force: true });
}

export async function sendVerifyEmail(
  to: string,
  verifyUrl: string,
): Promise<void> {
  const tpl = templates.verifyEmail(verifyUrl);
  await sendEmail({ to, subject: tpl.subject, html: tpl.html, force: true });
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
): Promise<void> {
  const tpl = templates.passwordReset(resetUrl);
  await sendEmail({ to, subject: tpl.subject, html: tpl.html, force: true });
}

export async function sendSecurityEmail(
  to: string,
  kind:
    | "passwordChanged"
    | "emailChanged"
    | "newLogin"
    | "newDeviceLogin"
    | "twoFactorEnabled",
  detail?: string,
): Promise<void> {
  const map = {
    passwordChanged: () => templates.passwordChanged(),
    emailChanged: () => templates.emailChanged(detail ?? "your new email"),
    newLogin: () => templates.newLogin(detail ?? "Unknown device"),
    newDeviceLogin: () => templates.newDeviceLogin(detail ?? "Unknown device"),
    twoFactorEnabled: () => templates.twoFactorEnabled(),
  } as const;
  const tpl = map[kind]();
  await sendEmail({ to, subject: tpl.subject, html: tpl.html, force: true });
}

export async function sendOrderEmail(
  to: string,
  kind:
    | "confirmation"
    | "receipt"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "refund"
    | "paymentFailed"
    | "shippingUpdate",
  meta: {
    orderId: string;
    label?: string;
    tracking?: string;
    carrier?: string;
    status?: string;
    userId?: string;
    /** When provided, honor the orders preference (except paymentFailed). */
    supabase?: AnySupabase;
  },
): Promise<void> {
  // Payment failures stay mandatory; other order mail respects prefs when userId given.
  if (
    kind !== "paymentFailed" &&
    meta.userId &&
    meta.supabase
  ) {
    const decision = await getChannelDecision(
      meta.supabase,
      meta.userId,
      kind === "confirmation"
        ? "order_confirmation"
        : kind === "shipped"
          ? "order_shipped"
          : kind === "delivered"
            ? "order_delivered"
            : kind === "shippingUpdate"
              ? "shipping_update"
              : "order_update",
    );
    if (!decision.email) return;
  }

  const href = `${siteUrl()}/garage/orders`;
  const label = meta.label ?? `Order ${meta.orderId.slice(0, 8)}`;
  const tpl =
    kind === "confirmation"
      ? templates.orderConfirmation(label, href)
      : kind === "receipt"
        ? templates.orderReceipt(label, `${href}/${meta.orderId}/receipt`)
        : kind === "shipped"
          ? templates.orderShipped(
              meta.tracking ?? "—",
              meta.carrier ?? "Carrier",
              href,
            )
          : kind === "delivered"
            ? templates.orderDelivered(href)
            : kind === "cancelled"
              ? templates.orderCancelled(href)
              : kind === "refund"
                ? templates.refundIssued(href)
                : kind === "paymentFailed"
                  ? templates.paymentFailed(href)
                  : templates.shippingUpdate(meta.status ?? "In transit", href);

  await sendEmail({
    to,
    subject: tpl.subject,
    html: tpl.html,
    force: kind === "paymentFailed",
  });
}
