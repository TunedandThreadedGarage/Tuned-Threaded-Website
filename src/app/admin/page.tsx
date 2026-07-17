import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/printify/config";
import { SiteHeader } from "@/components/layout/SiteHeader";

export const dynamic = "force-dynamic";

export default async function AdminIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/garage/sign-in?next=/admin");

  if (!isAdminEmail(user.email)) {
    return (
      <>
        <SiteHeader />
        <div className="mx-auto max-w-lg px-5 py-24 text-center">
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-text">
            Admin access required
          </h1>
          <p className="mt-3 text-sm text-text-muted">
            Add your email to <code className="text-text">ADMIN_EMAILS</code>.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <div className="mx-auto w-full max-w-[800px] px-5 pb-20 pt-24 md:px-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
          Admin
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold text-text">
          Dashboard
        </h1>
        <ul className="mt-8 divide-y divide-border border border-border">
          <li>
            <Link
              href="/admin/printify"
              className="block px-5 py-4 text-text transition-colors hover:bg-white/[0.03]"
            >
              Printify
              <span className="mt-1 block text-sm text-text-muted">
                Create and publish POD products
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/admin/moderation"
              className="block px-5 py-4 text-text transition-colors hover:bg-white/[0.03]"
            >
              Moderation
              <span className="mt-1 block text-sm text-text-muted">
                Reports and behavior auto-flags
              </span>
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
}
