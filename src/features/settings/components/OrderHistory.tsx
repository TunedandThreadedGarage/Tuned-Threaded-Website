"use client";

import Link from "next/link";
import Image from "next/image";
import { EmptyState } from "@/components/ui/EmptyState";
import type { OrderWithItems } from "@/features/settings/types";

function money(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function statusTone(status: string) {
  const s = status.toLowerCase();
  if (s.includes("deliver")) return "text-text";
  if (s.includes("ship") || s.includes("transit")) return "text-metal";
  if (s.includes("cancel") || s.includes("fail")) return "text-accent";
  return "text-text-muted";
}

export function OrderHistory({ orders }: { orders: OrderWithItems[] }) {
  if (orders.length === 0) {
    return (
      <EmptyState
        title="No orders yet"
        description="When you purchase from the shop, tracking, receipts, and shipping updates live here."
      />
    );
  }

  return (
    <ul className="space-y-4">
      {orders.map((order) => (
        <li key={order.id} className="border border-border bg-surface/20 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-metal">
                {new Date(order.created_at).toLocaleDateString()}
              </p>
              <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg font-semibold text-text">
                {order.summary ?? `Order ${order.id.slice(0, 8)}`}
              </h3>
              <p className={`mt-1 text-sm capitalize ${statusTone(order.status)}`}>
                Status · {order.status.replaceAll("_", " ")}
              </p>
            </div>
            <p className="font-mono text-sm text-text">
              {money(order.total_cents, order.currency)}
            </p>
          </div>

          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-metal">
                Tracking
              </dt>
              <dd className="mt-1 text-text">
                {order.tracking_number ?? "Not available yet"}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-metal">
                Carrier
              </dt>
              <dd className="mt-1 text-text">{order.carrier ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-metal">
                Est. delivery
              </dt>
              <dd className="mt-1 text-text">
                {order.estimated_delivery
                  ? new Date(order.estimated_delivery).toLocaleDateString()
                  : "—"}
              </dd>
            </div>
          </dl>

          {order.items.length > 0 ? (
            <ul className="mt-5 divide-y divide-border border border-border">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-3 py-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden border border-border bg-surface-elevated">
                    {item.product_image_url ? (
                      <Image
                        src={item.product_image_url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-text">
                      {item.product_name ?? item.product_ref}
                    </p>
                    <p className="text-xs text-text-muted">
                      Qty {item.quantity} ·{" "}
                      {money(item.unit_price_cents, order.currency)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link
              href={`/garage/orders/${order.id}/receipt`}
              className="border border-border px-3 py-2 text-text-muted transition-colors hover:border-metal/40 hover:text-text"
            >
              Download receipt
            </Link>
            {order.invoice_url ? (
              <a
                href={order.invoice_url}
                target="_blank"
                rel="noreferrer"
                className="border border-border px-3 py-2 text-text-muted transition-colors hover:border-metal/40 hover:text-text"
              >
                Invoice
              </a>
            ) : null}
            {order.receipt_url ? (
              <a
                href={order.receipt_url}
                target="_blank"
                rel="noreferrer"
                className="border border-border px-3 py-2 text-text-muted transition-colors hover:border-metal/40 hover:text-text"
              >
                External receipt
              </a>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
