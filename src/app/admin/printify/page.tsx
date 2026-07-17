import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { GarageExperience } from "@/components/garage/GarageExperience";
import { createClient } from "@/lib/supabase/server";
import {
  isAdminEmail,
  isPrintifyConfigured,
  printifyShopId,
} from "@/lib/printify";
import { PrintifyProductCreator } from "@/features/printify/components/PrintifyProductCreator";

export const dynamic = "force-dynamic";

export default async function AdminPrintifyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/garage/sign-in?next=/admin/printify");
  }

  if (!isAdminEmail(user.email)) {
    return (
      <GarageExperience>
        <SiteHeader />
        <main className="mx-auto w-full max-w-[720px] flex-1 px-5 pb-24 pt-28">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
            Admin
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-text">
            Access denied
          </h1>
          <p className="mt-3 text-sm text-text-muted">
            Your account is not listed in{" "}
            <code className="text-text">ADMIN_EMAILS</code>. Add{" "}
            <span className="text-text">{user.email}</span> and redeploy.
          </p>
          <Link href="/garage" className="mt-8 inline-block text-sm underline">
            Back to Garage
          </Link>
        </main>
        <SiteFooter />
      </GarageExperience>
    );
  }

  const configured = isPrintifyConfigured();
  const shopId = printifyShopId();

  return (
    <GarageExperience>
      <SiteHeader />
      <main className="mx-auto w-full max-w-[960px] flex-1 px-5 pb-24 pt-24 md:px-8 md:pt-28">
        <div className="mb-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
            Admin · Printify
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-text md:text-4xl">
            Create product
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-text-muted">
            Upload artwork, pick a blueprint, choose colors and sizes, set
            retail price, then create and publish straight to Shopify through
            Printify.
            {shopId != null ? (
              <>
                {" "}
                Shop ID <span className="text-text">{shopId}</span>.
              </>
            ) : null}
          </p>
          <nav className="mt-4 flex gap-4 font-mono text-[11px] uppercase tracking-[0.14em] text-metal">
            <Link href="/admin/printify" className="text-text">
              Create
            </Link>
            <Link href="/admin/printify/orders" className="hover:text-text">
              Orders
            </Link>
            <Link href="/store" className="hover:text-text">
              Store
            </Link>
          </nav>
        </div>

        <PrintifyProductCreator
          initialError={
            configured
              ? null
              : "Printify is not configured. Set PRINTIFY_API_TOKEN and PRINTIFY_SHOP_ID."
          }
        />
      </main>
      <SiteFooter />
    </GarageExperience>
  );
}
