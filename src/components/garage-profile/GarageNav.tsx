"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS: { href: string; label: string; exact?: boolean }[] = [
  { href: "/garage", label: "Profile", exact: true },
  { href: "/garage/discover", label: "Discover" },
  { href: "/garage/builds", label: "Builds" },
  { href: "/garage/gallery", label: "Gallery" },
  { href: "/garage/journal", label: "Journal" },
  { href: "/garage/wishlist", label: "Wishlist" },
  { href: "/garage/cart", label: "Cart" },
  { href: "/garage/orders", label: "Orders" },
  { href: "/notifications", label: "Alerts" },
  { href: "/garage/settings", label: "Settings" },
];

export function GarageNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Garage"
      className="flex gap-1 overflow-x-auto border-b border-border pb-px"
    >
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`shrink-0 px-3 py-3 text-sm transition-colors ${
              active
                ? "border-b-2 border-text text-text"
                : "border-b-2 border-transparent text-text-muted hover:text-text"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
