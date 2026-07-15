import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/garage/sign-in");

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-text">
          Orders
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Placeholder history — wired for the future shop.
        </p>
      </div>

      {orders && orders.length > 0 ? (
        <ul className="divide-y divide-border border border-border">
          {orders.map((order) => (
            <li key={order.id} className="px-4 py-4">
              <p className="text-sm font-medium text-text">
                {order.summary ?? `Order ${order.id.slice(0, 8)}`}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                {order.status} · ${(order.total_cents / 100).toFixed(2)} ·{" "}
                {new Date(order.created_at).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No orders yet"
          description="When the shop opens, your history will live here."
        />
      )}
    </div>
  );
}
