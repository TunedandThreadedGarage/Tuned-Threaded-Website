import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "@/features/settings/components/PrintButton";

export default async function OrderReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/garage/sign-in?next=/garage/orders/${id}/receipt`);

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", order.id);

  const total = (order.total_cents / 100).toFixed(2);

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
            Receipt
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-text">
            Tuned &amp; Threaded
          </h1>
        </div>
        <PrintButton />
      </div>

      <div className="border border-border bg-surface/30 p-6">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-text">
          {order.summary ?? `Order ${order.id.slice(0, 8)}`}
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          {new Date(order.created_at).toLocaleString()} · {order.status}
        </p>
        <p className="mt-1 text-sm text-text-muted">
          {order.carrier ?? "Carrier TBD"}
          {order.tracking_number ? ` · ${order.tracking_number}` : ""}
        </p>

        <ul className="mt-6 divide-y divide-border border border-border">
          {(items ?? []).length === 0 ? (
            <li className="px-3 py-3 text-sm text-text-muted">No line items.</li>
          ) : (
            (items ?? []).map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 px-3 py-3 text-sm"
              >
                <span className="text-text">
                  {item.product_name ?? item.product_ref} × {item.quantity}
                </span>
                <span className="font-mono text-text-muted">
                  ${(item.unit_price_cents / 100).toFixed(2)}
                </span>
              </li>
            ))
          )}
        </ul>

        <p className="mt-4 text-right font-mono text-lg text-text">
          Total ${total}
        </p>
      </div>

      <Link
        href="/garage/orders"
        className="inline-block text-sm text-text-muted hover:text-text print:hidden"
      >
        ← Back to orders
      </Link>
    </div>
  );
}
