import { adminFetch } from "@/lib/shopify/client";
import { isShopifyConfigured } from "@/lib/shopify/config";
import { ADMIN_ORDERS_BY_EMAIL } from "@/lib/shopify/queries";
import type { OrderWithItems } from "@/features/settings/types";

type AdminOrderNode = {
  id: string;
  name: string;
  createdAt: string;
  displayFinancialStatus: string | null;
  displayFulfillmentStatus: string | null;
  statusPageUrl: string | null;
  totalPriceSet: {
    shopMoney: { amount: string; currencyCode: string };
  };
  fulfillments: Array<{
    trackingInfo: Array<{
      number: string | null;
      company: string | null;
      url: string | null;
    }>;
    estimatedDeliveryAt: string | null;
  }>;
  lineItems: {
    nodes: Array<{
      id: string;
      title: string;
      quantity: number;
      sku: string | null;
      originalUnitPriceSet: {
        shopMoney: { amount: string; currencyCode: string };
      };
      image: { url: string } | null;
    }>;
  };
};

function statusFromShopify(
  financial: string | null,
  fulfillment: string | null,
): string {
  const f = (fulfillment || "").toUpperCase();
  const pay = (financial || "").toUpperCase();
  if (f.includes("DELIVERED")) return "delivered";
  if (f.includes("IN_TRANSIT") || f.includes("OUT_FOR_DELIVERY")) return "shipped";
  if (f.includes("FULFILLED")) return "shipped";
  if (pay.includes("REFUNDED")) return "refunded";
  if (pay.includes("VOIDED")) return "cancelled";
  if (pay.includes("PAID") || pay.includes("AUTHORIZED")) return "confirmed";
  return (fulfillment || financial || "pending").toLowerCase();
}

function toCents(amount: string) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export async function getShopifyOrdersForEmail(
  email: string,
): Promise<OrderWithItems[]> {
  if (!isShopifyConfigured() || !email) return [];

  try {
    const data = await adminFetch<{
      orders: { nodes: AdminOrderNode[] };
    }>(ADMIN_ORDERS_BY_EMAIL, {
      query: `email:${email}`,
    });

    return (data.orders.nodes ?? []).map((o) => {
      const tracking = o.fulfillments[0]?.trackingInfo?.[0];
      const currency = o.totalPriceSet.shopMoney.currencyCode.toLowerCase();
      return {
        id: o.id,
        user_id: "",
        status: statusFromShopify(
          o.displayFinancialStatus,
          o.displayFulfillmentStatus,
        ),
        summary: o.name,
        total_cents: toCents(o.totalPriceSet.shopMoney.amount),
        currency,
        tracking_number: tracking?.number ?? null,
        carrier: tracking?.company ?? null,
        estimated_delivery: o.fulfillments[0]?.estimatedDeliveryAt ?? null,
        shipped_at: null,
        delivered_at: null,
        cancelled_at: null,
        refunded_at: null,
        receipt_url: o.statusPageUrl,
        invoice_url: o.statusPageUrl,
        created_at: o.createdAt,
        items: o.lineItems.nodes.map((item) => ({
          id: item.id,
          product_ref: item.sku || item.id,
          product_name: item.title,
          product_image_url: item.image?.url ?? null,
          quantity: item.quantity,
          unit_price_cents: toCents(item.originalUnitPriceSet.shopMoney.amount),
        })),
      } satisfies OrderWithItems;
    });
  } catch (e) {
    console.error("[shopify:orders]", e);
    return [];
  }
}
