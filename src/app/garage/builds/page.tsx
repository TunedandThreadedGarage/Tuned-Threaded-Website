import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BuildCard } from "@/components/garage-profile/BuildCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default async function BuildsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/garage/sign-in");

  const { data: builds } = await supabase
    .from("builds")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const ids = (builds ?? []).map((b) => b.id);
  const { data: photos } =
    ids.length > 0
      ? await supabase.from("build_photos").select("*").in("build_id", ids)
      : { data: [] as { build_id: string; id: string; url: string }[] };

  const firstPhoto = new Map<string, { build_id: string; id: string; url: string }>();
  for (const p of photos ?? []) {
    if (!firstPhoto.has(p.build_id)) firstPhoto.set(p.build_id, p);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-text">
            Your builds
          </h2>
          <p className="mt-1 text-sm text-text-muted">Projects documented your way.</p>
        </div>
        <Button href="/garage/builds/new" variant="primary">
          New build
        </Button>
      </div>

      {builds && builds.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {builds.map((build) => (
            <BuildCard
              key={build.id}
              build={build}
              photo={firstPhoto.get(build.id)}
              href={`/garage/builds/${build.id}`}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No builds yet"
          description="Start your first build post."
          action={
            <Button href="/garage/builds/new" variant="secondary">
              Create build
            </Button>
          }
        />
      )}

      <Link href="/garage" className="text-sm text-text-muted hover:text-text">
        ← Profile
      </Link>
    </div>
  );
}
