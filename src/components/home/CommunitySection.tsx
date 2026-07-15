import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";

export function CommunitySection() {
  return (
    <section
      id="community"
      className="relative scroll-mt-24 overflow-hidden border-t border-border"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(196,18,26,0.12),transparent_58%)]" />
      <div className="absolute inset-0 bg-surface/60" />

      <div className="relative mx-auto flex max-w-[1440px] flex-col items-start px-5 py-24 md:px-8 md:py-32 lg:px-10">
        <FadeIn>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-metal">
            Community
          </p>
          <h2 className="mt-4 max-w-[14ch] font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-text sm:text-5xl md:text-6xl">
            This Is Where You Belong.
          </h2>
        </FadeIn>

        <FadeIn delay={0.12} className="mt-6 max-w-xl">
          <p className="text-base leading-relaxed text-text-muted sm:text-lg">
            Tuned &amp; Threaded is a community for home mechanics and
            automotive enthusiasts—not just a clothing brand. We exist for the
            people who build, modify, and live in the garage long after the
            driveway lights go out.
          </p>
        </FadeIn>

        <FadeIn delay={0.2} className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button href="/garage/sign-up" variant="accent">
            Create Garage Profile
          </Button>
          <Button href="/community" variant="secondary">
            Explore Community
          </Button>
        </FadeIn>
      </div>
    </section>
  );
}
