import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-start justify-center px-5 py-20 md:px-8">
      <p className="text-[11px] uppercase tracking-[0.22em] text-foreground-subtle">
        404
      </p>
      <h1 className="mt-4 font-[family-name:var(--font-instrument)] text-4xl tracking-tight">
        Garage not found
      </h1>
      <p className="mt-3 text-sm text-foreground-muted">
        That profile or vehicle does not exist yet.
      </p>
      <Link
        href="/garage/tunedgarage"
        className="mt-8 inline-flex h-11 items-center rounded-full bg-foreground px-5 text-xs uppercase tracking-[0.08em] text-background"
      >
        Visit demo garage
      </Link>
    </main>
  );
}
