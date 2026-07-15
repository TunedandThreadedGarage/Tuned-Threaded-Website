import Image from "next/image";
import Link from "next/link";
import { listFeaturedGarages } from "@/lib/garage/queries";

export default async function HomePage() {
  const featured = await listFeaturedGarages();
  const garage = featured[0];

  return (
    <main className="relative flex-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 surface-grid opacity-60" />

      <section className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl flex-col justify-center px-5 py-16 md:px-8 md:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="animate-fade-up">
            <p className="text-[11px] uppercase tracking-[0.28em] text-foreground-subtle">
              Tuned &amp; Threaded
            </p>
            <h1 className="mt-5 max-w-xl font-[family-name:var(--font-instrument)] text-5xl leading-[1.05] tracking-tight text-foreground md:text-7xl">
              Your garage,
              <br />
              center stage.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-foreground-muted md:text-lg">
              Document builds, track horsepower, earn reputation, and follow the
              people who spend more time under the hood than on the couch.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/garage/${garage.username}`}
                className="inline-flex h-12 items-center rounded-full bg-foreground px-6 text-xs uppercase tracking-[0.08em] text-background transition-colors hover:bg-zinc-200"
              >
                Enter demo garage
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex h-12 items-center rounded-full border border-border-strong px-6 text-xs uppercase tracking-[0.08em] text-foreground transition-colors hover:bg-white/[0.04]"
              >
                Create your garage
              </Link>
            </div>
          </div>

          <Link
            href={`/garage/${garage.username}`}
            className="animate-fade-up delay-2 group relative aspect-[4/5] overflow-hidden rounded-[1.75rem] border border-border md:aspect-[5/6]"
          >
            <Image
              src={garage.bannerUrl}
              alt={`${garage.displayName}'s garage`}
              fill
              priority
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              sizes="(max-width: 1024px) 100vw, 45vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
              <p className="text-[11px] uppercase tracking-[0.2em] text-foreground-muted">
                Featured garage
              </p>
              <p className="mt-2 font-[family-name:var(--font-instrument)] text-3xl text-foreground">
                {garage.displayName}
              </p>
              <p className="mt-1 text-sm text-foreground-muted">
                @{garage.username} · {garage.garageRank}
              </p>
            </div>
          </Link>
        </div>
      </section>
    </main>
  );
}
