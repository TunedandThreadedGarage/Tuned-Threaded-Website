import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/printify/config";
import { loadModerationQueues } from "@/features/moderation/actions";
import { ModerationDashboard } from "@/features/moderation/components/ModerationDashboard";
import { SiteHeader } from "@/components/layout/SiteHeader";

export const dynamic = "force-dynamic";

export default async function AdminModerationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/garage/sign-in?next=/admin/moderation");
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
          <Link href="/admin" className="mt-6 inline-block text-sm underline">
            Back
          </Link>
        </div>
      </>
    );
  }

  const { reports, flags, error } = await loadModerationQueues();

  return (
    <>
      <SiteHeader />
      <div className="mx-auto w-full max-w-[960px] px-5 pb-20 pt-24 md:px-8">
        <div className="mb-6 flex gap-4 text-sm text-text-muted">
          <Link href="/admin" className="hover:text-text">
            Admin
          </Link>
          <Link href="/admin/printify" className="hover:text-text">
            Printify
          </Link>
          <span className="text-text">Moderation</span>
        </div>
        {error ? <p className="mb-4 text-sm text-accent">{error}</p> : null}
        <ModerationDashboard reports={reports} flags={flags} />
      </div>
    </>
  );
}
