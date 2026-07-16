"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS: { href: string; label: string; exact?: boolean }[] = [
  { href: "/garage", label: "Profile", exact: true },
  { href: "/garage/discover", label: "Discover" },
  { href: "/garage/builds", label: "Builds" },
  { href: "/garage/gallery", label: "Gallery" },
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

/** Routes that should show the vehicle-showcase Garage chrome. */
export function isGarageShowcasePath(pathname: string) {
  if (pathname === "/garage") return true;
  return (
    pathname.startsWith("/garage/discover") ||
    pathname.startsWith("/garage/builds") ||
    pathname.startsWith("/garage/gallery") ||
    pathname.startsWith("/garage/vehicles") ||
    pathname.startsWith("/garage/followers") ||
    pathname.startsWith("/garage/following")
  );
}
