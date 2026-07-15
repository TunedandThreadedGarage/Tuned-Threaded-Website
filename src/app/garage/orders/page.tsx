import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadOrders } from "@/features/settings/actions";
import { OrderHistory } from "@/features/settings/components/OrderHistory";

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/garage/sign-in?next=/garage/orders");

  const { orders, error } = await loadOrders();

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
          Store
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold text-text">
          Order History
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Status, tracking, carrier, estimated delivery, items, invoices, and
          receipts — always know where your order is.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-accent" role="alert">
          {error}
        </p>
      ) : null}

      <OrderHistory orders={orders} />
    </div>
  );
}
