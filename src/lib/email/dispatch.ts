import { sendEmail } from "@/lib/email/client";
import { templates } from "@/lib/email/templates";
import {
  getChannelDecision,
  resolveRecipientEmail,
} from "@/lib/email/preferences";
import { siteUrl } from "@/lib/email/brand";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

/** Map notification types to branded templates and send if prefs allow. */
export async function dispatchNotificationEmail(
  supabase: AnySupabase,
  input: {
    userId: string;
    type: string;
    message: string;
    href?: string | null;
    actorName?: string | null;
  },
): Promise<void> {
  const decision = await getChannelDecision(
    supabase,
    input.userId,
    input.type,
  );
  if (!decision.email) return;

  const to = await resolveRecipientEmail(input.userId);
  if (!to) return;

  const href = input.href?.startsWith("http")
    ? input.href
    : `${siteUrl()}${input.href || "/notifications"}`;
  const actor = input.actorName ?? "Someone";

  let tpl = templates.someoneCommented(actor, "your content", href);
  switch (input.type) {
    case "follow":
    case "garage_follow":
      tpl = templates.newFollower(actor, href);
      break;
    case "build_follow":
      tpl = templates.buildFollowed(actor, "your build", href);
      break;
    case "build_like":
    case "like":
      tpl = templates.buildLiked(actor, "your build", href);
      break;
    case "post_like":
      tpl = templates.postLiked(actor, href);
      break;
    case "comment":
    case "build_comment":
      tpl = templates.someoneCommented(actor, "your content", href);
      break;
    case "reply":
    case "build_reply":
      tpl = templates.someoneReplied(actor, href);
      break;
    case "mention":
      tpl = templates.someoneMentioned(actor, href);
      break;
    case "post_share":
      tpl = templates.buildShared(actor, "your post", href);
      break;
    case "build_trending":
      tpl = templates.buildFeatured("your build", href);
      break;
    case "garage_featured":
      tpl = templates.garageFeatured(href);
      break;
    case "marketplace_inquiry":
      tpl = templates.newMessage(actor, href);
      break;
    default:
      tpl = {
        subject: input.message.slice(0, 80) || "Tuned & Threaded activity",
        html: templates.someoneCommented(actor, "your garage", href).html,
      };
  }

  await sendEmail({ to, subject: tpl.subject, html: tpl.html });
}

export async function sendWelcomeEmail(to: string): Promise<void> {
  const tpl = templates.welcome();
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
  },
): Promise<void> {
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

  await sendEmail({ to, subject: tpl.subject, html: tpl.html, force: true });
}
