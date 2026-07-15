import { createClient } from "@/lib/supabase/server";
import {
  loadBuildsCatalog,
  loadFeaturedBundles,
} from "@/features/builds-hub/actions";
import { BuildsCatalog } from "@/features/builds-hub/components/BuildsCatalog";
import { FeaturedSections } from "@/features/builds-hub/components/FeaturedSections";
import { Button } from "@/components/ui/Button";

export default async function BuildsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ builds, error }, featured] = await Promise.all([
    loadBuildsCatalog({ tab: "newest" }),
    loadFeaturedBundles(),
  ]);

  return (
    <div className="space-y-16">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
            Builds
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-text sm:text-5xl">
            Project journals
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">
            Document real automotive projects — stages, parts, dyno sheets, and
            the long road between ambition and finished metal.
          </p>
        </div>
        <Button
          href={user ? "/garage/builds/new" : "/garage/sign-up"}
          variant="accent"
        >
          {user ? "Start a build" : "Join to build"}
        </Button>
      </header>

      {error && !error.includes("column") && !error.includes("relation") ? (
        <p className="text-sm text-accent">{error}</p>
      ) : null}

      <FeaturedSections
        featured={featured.featured}
        trending={featured.trending}
        newest={featured.newest}
        mostViewed={featured.mostViewed}
        staffPicks={featured.staffPicks}
        recentlyUpdated={featured.recentlyUpdated}
      />

      <section className="space-y-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
            Discover
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-text">
            All public builds
          </h2>
        </div>
        <BuildsCatalog
          initialBuilds={builds}
          signedIn={Boolean(user)}
        />
      </section>
    </div>
  );
}
