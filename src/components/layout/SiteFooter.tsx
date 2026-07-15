import Link from "next/link";
import { footerLinks } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-bg">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-10 px-5 py-14 md:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-10 lg:py-16">
        <div>
          <p className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-text">
            Tuned &amp; Threaded
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-text-muted">
            Built by enthusiasts for enthusiasts. A garage lifestyle brand,
            not just a clothing company.
          </p>
        </div>

        <nav aria-label="Footer">
          <ul className="grid grid-cols-2 gap-x-10 gap-y-3 sm:grid-cols-4">
            {footerLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-sm text-text-muted transition-colors hover:text-text"
                  {...("external" in link && link.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-5 py-6 text-xs text-text-muted md:flex-row md:items-center md:justify-between md:px-8 lg:px-10">
          <p>© {new Date().getFullYear()} Tuned &amp; Threaded. All rights reserved.</p>
          <p className="font-mono uppercase tracking-[0.18em]">Garage lifestyle</p>
        </div>
      </div>
    </footer>
  );
}
