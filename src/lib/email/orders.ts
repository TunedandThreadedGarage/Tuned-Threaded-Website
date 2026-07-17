import { createAdminClient } from "@/lib/supabase/admin";
import { sendMandatoryEmail } from "@/lib/notify";

/**
 * Send branded order/shipping email + optional in-app notification.
 * Order confirmation and shipping updates always email (bypass presence
 * and preferences) per the smart notification delivery policy.
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
  await sendMandatoryEmail({
    kind: "order",
    to: input.email,
    orderKind: input.kind,
    orderId: input.orderId,
    label: input.label,
    tracking: input.tracking,
    carrier: input.carrier,
    status: input.status,
    userId: input.userId ?? undefined,
  });

  if (!input.userId) return;
  const admin = createAdminClient();
  if (!admin) return;

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

  // Email already sent via sendMandatoryEmail; create in-app row only.
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
