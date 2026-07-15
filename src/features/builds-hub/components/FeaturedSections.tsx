import { FadeIn } from "@/components/ui/FadeIn";
import type { ShowcaseBuild } from "@/features/builds-hub/actions";
import { BuildShowcaseCard } from "@/features/builds-hub/components/BuildShowcaseCard";

function Section({
  eyebrow,
  title,
  builds,
  delay = 0,
}: {
  eyebrow: string;
  title: string;
  builds: ShowcaseBuild[];
  delay?: number;
}) {
  if (builds.length === 0) return null;
  return (
    <FadeIn delay={delay}>
      <section className="space-y-5">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
            {eyebrow}
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-text">
            {title}
          </h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {builds.slice(0, 4).map((b) => (
            <BuildShowcaseCard key={b.id} build={b} />
          ))}
        </div>
      </section>
    </FadeIn>
  );
}

export function FeaturedSections({
  featured,
  trending,
  newest,
  mostViewed,
  staffPicks,
  recentlyUpdated,
}: {
  featured: ShowcaseBuild[];
  trending: ShowcaseBuild[];
  newest: ShowcaseBuild[];
  mostViewed: ShowcaseBuild[];
  staffPicks: ShowcaseBuild[];
  recentlyUpdated: ShowcaseBuild[];
}) {
  return (
    <div className="space-y-16">
      <Section
        eyebrow="This week"
        title="Featured builds"
        builds={featured}
      />
      <Section
        eyebrow="Heat"
        title="Trending builds"
        builds={trending}
        delay={0.05}
      />
      <Section
        eyebrow="Fresh"
        title="Newest builds"
        builds={newest}
        delay={0.08}
      />
      <Section
        eyebrow="Attention"
        title="Most viewed"
        builds={mostViewed}
        delay={0.1}
      />
      <Section
        eyebrow="Editorial"
        title="Staff picks"
        builds={staffPicks}
        delay={0.12}
      />
      <Section
        eyebrow="Active"
        title="Recently updated"
        builds={recentlyUpdated}
        delay={0.14}
      />
    </div>
  );
}
