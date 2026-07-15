import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-12 md:flex-row md:items-center md:justify-between md:px-8">
        <div>
          <p className="font-[family-name:var(--font-instrument)] text-lg text-foreground">
            Tuned &amp; Threaded
          </p>
          <p className="mt-1 text-sm text-foreground-muted">
            Built by enthusiasts, for the garage.
          </p>
        </div>
        <div className="flex flex-wrap gap-6 text-xs uppercase tracking-[0.16em] text-foreground-subtle">
          <Link href="/garage/tunedgarage" className="hover:text-foreground">
            Demo Garage
          </Link>
          <Link href="/auth/signup" className="hover:text-foreground">
            Create Account
          </Link>
          <Link href="/auth/login" className="hover:text-foreground">
            Sign In
          </Link>
        </div>
      </div>
    </footer>
  );
}
