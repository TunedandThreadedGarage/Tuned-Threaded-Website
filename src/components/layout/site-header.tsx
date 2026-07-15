import Link from "next/link";

const nav = [
  { href: "/", label: "Home" },
  { href: "/garage/tunedgarage", label: "Garage" },
  { href: "/auth/login", label: "Sign In" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-[color-mix(in_srgb,var(--background)_82%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 md:px-8">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-[family-name:var(--font-instrument)] text-xl tracking-tight text-foreground">
            Tuned &amp; Threaded
          </span>
          <span className="hidden text-[10px] uppercase tracking-[0.24em] text-foreground-subtle sm:inline">
            Garage
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs uppercase tracking-[0.18em] text-foreground-muted transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/garage/tunedgarage"
            className="hidden h-9 items-center rounded-full border border-border-strong px-3.5 text-xs uppercase tracking-[0.04em] text-foreground transition-colors hover:bg-white/[0.04] sm:inline-flex"
          >
            Enter Garage
          </Link>
          <Link
            href="/garage/tunedgarage"
            className="text-xs uppercase tracking-[0.16em] text-foreground md:hidden"
          >
            Garage
          </Link>
        </div>
      </div>
    </header>
  );
}
