import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { GarageExperience } from "@/components/garage/GarageExperience";
import { createClient } from "@/lib/supabase/server";
import { CustomMerchCreator } from "@/features/merch/components/CustomMerchCreator";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MerchCreatorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/garage/sign-in?next=/merch");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <GarageExperience>
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1100px] flex-1 px-5 pb-24 pt-24 md:px-8 md:pt-28">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
              Custom Merch Creator
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-text md:text-4xl">
              Your garage. Your mark.
            </h1>
            <p className="mt-2 max-w-xl text-sm text-text-muted">
              Upload a vehicle photo, pick a blank, add your handle, and preview
              the design. Printify fulfillment connects next.
            </p>
          </div>
          <Link
            href="/store"
            className="text-sm text-text-muted transition-colors hover:text-text"
          >
            Browse store →
          </Link>
        </div>
        <CustomMerchCreator defaultUsername={profile?.username ?? ""} />
      </main>
      <SiteFooter />
    </GarageExperience>
  );
}
