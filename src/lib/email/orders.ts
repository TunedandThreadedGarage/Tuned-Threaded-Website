import { createAdminClient } from "@/lib/supabase/admin";
import { sendOrderEmail } from "@/lib/email/dispatch";
import { getChannelDecision } from "@/lib/email/preferences";

/**
 * Send branded order/shipping email + optional in-app notification while
 * honoring the recipient's `orders` preference (paymentFailed email is forced).
 */
export async function notifyOrderUpdate(input: {
  userId?: string | null;
  email: string;
  kind:
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
}): Promise<void> {
  const admin = createAdminClient();

  await sendOrderEmail(input.email, input.kind, {
    orderId: input.orderId,
    label: input.label,
    tracking: input.tracking,
    carrier: input.carrier,
    status: input.status,
    userId: input.userId ?? undefined,
    supabase: admin ?? undefined,
  });

  if (!input.userId || !admin) return;

  const type =
    input.kind === "confirmation"
      ? "order_confirmation"
      : input.kind === "shipped"
        ? "order_shipped"
        : input.kind === "delivered"
          ? "order_delivered"
          : input.kind === "shippingUpdate"
            ? "shipping_update"
            : "order_update";

  const decision = await getChannelDecision(admin, input.userId, type);
  if (!decision.inApp) return;

  const label = input.label ?? `Order ${input.orderId.slice(0, 8)}`;
  const message =
    input.kind === "confirmation"
      ? `${label} is confirmed.`
      : input.kind === "shipped"
        ? `${label} shipped${input.tracking ? ` · ${input.tracking}` : ""}.`
        : input.kind === "delivered"
          ? `${label} was delivered.`
          : input.kind === "shippingUpdate"
            ? `Shipping update: ${input.status ?? "In transit"}`
            : input.kind === "cancelled"
              ? `${label} was cancelled.`
              : input.kind === "refund"
                ? `A refund was issued for ${label}.`
                : input.kind === "paymentFailed"
                  ? `Payment failed for ${label}.`
                  : `Order update for ${label}.`;

  await admin.from("notifications").insert({
    user_id: input.userId,
    actor_id: null,
    type,
    entity_type: "order",
    entity_id: input.orderId,
    message,
    action: null,
    href: "/garage/orders",
  });
}
