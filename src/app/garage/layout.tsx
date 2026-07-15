import Link from "next/link";
import { GarageNav } from "@/components/garage-profile/GarageNav";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signOut } from "@/features/auth/actions";

export const dynamic = "force-dynamic";

export default async function GarageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <SiteHeader />
        <div className="mx-auto max-w-lg px-5 py-24 text-center">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-text">
            Connect Supabase
          </h1>
          <p className="mt-3 text-sm text-text-muted">
            Add <code className="text-text">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="text-text">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
            <code className="text-text">.env.local</code>, then run the SQL in{" "}
            <code className="text-text">supabase/migrations/</code>. See README.
          </p>
          <Link href="/" className="mt-8 inline-block text-sm text-text underline">
            Back home
          </Link>
        </div>
      </>
    );
  }

  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  return (
    <>
      <SiteHeader />
      <div className="mx-auto w-full max-w-[1100px] px-5 pb-20 pt-24 md:px-8">
        {user ? (
          <>
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
                  Member area
                </p>
                <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-text">
                  Garage Profile
                </h1>
              </div>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-sm text-text-muted transition-colors hover:text-text"
                >
                  Sign out
                </button>
              </form>
            </div>
            <GarageNav />
            <div className="mt-8">{children}</div>
          </>
        ) : (
          children
        )}
      </div>
    </>
  );
}
