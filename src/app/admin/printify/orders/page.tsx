import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { GarageExperience } from "@/components/garage/GarageExperience";
import { createClient } from "@/lib/supabase/server";
import { getOrders, isAdminEmail, isPrintifyConfigured } from "@/lib/printify";

export const dynamic = "force-dynamic";

export default async function AdminPrintifyOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/garage/sign-in?next=/admin/printify/orders");
  if (!isAdminEmail(user.email)) redirect("/admin/printify");

  let error: string | null = null;
  let orders: Awaited<ReturnType<typeof getOrders>> | null = null;

  if (!isPrintifyConfigured()) {
    error = "Printify is not configured.";
  } else {
    try {
      orders = await getOrders({ limit: 25 });
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to load orders.";
    }
  }

  return (
    <GarageExperience>
      <SiteHeader />
      <main className="mx-auto w-full max-w-[960px] flex-1 px-5 pb-24 pt-24 md:px-8 md:pt-28">
        <div className="mb-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
            Admin · Printify
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-text">
            Orders
          </h1>
          <nav className="mt-4 flex gap-4 font-mono text-[11px] uppercase tracking-[0.14em] text-metal">
            <Link href="/admin/printify" className="hover:text-text">
              Create
            </Link>
            <Link href="/admin/printify/orders" className="text-text">
              Orders
            </Link>
          </nav>
        </div>

        {error ? (
          <p className="text-sm text-accent" role="alert">
            {error}
          </p>
        ) : null}

        {orders?.data?.length ? (
          <ul className="divide-y divide-border border border-border">
            {orders.data.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-4"
              >
                <div>
                  <p className="font-mono text-[11px] text-metal">{order.id}</p>
                  <p className="mt-1 text-sm text-text">
                    {order.status}
                    {order.created_at ? ` · ${order.created_at}` : ""}
                  </p>
                </div>
                <p className="text-sm text-text-muted">
                  {order.total_price != null
                    ? `$${(order.total_price / 100).toFixed(2)}`
                    : "—"}
                </p>
              </li>
            ))}
          </ul>
        ) : !error ? (
          <p className="border border-dashed border-border px-5 py-12 text-center text-sm text-text-muted">
            No Printify orders yet.
          </p>
        ) : null}
      </main>
      <SiteFooter />
    </GarageExperience>
  );
}
