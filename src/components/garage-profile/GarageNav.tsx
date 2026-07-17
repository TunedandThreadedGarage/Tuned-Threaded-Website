"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

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
            prefetch
            scroll={false}
            className={`relative shrink-0 px-3 py-3 text-sm transition-colors ${
              active ? "text-text" : "text-text-muted hover:text-text"
            }`}
          >
            {link.label}
            {active ? (
              <motion.span
                layoutId="garage-nav-underline"
                className="absolute inset-x-3 -bottom-px h-0.5 bg-text"
                transition={{ type: "spring", stiffness: 420, damping: 36 }}
              />
            ) : null}
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
    pathname.startsWith("/garage/following") ||
    pathname.startsWith("/garage/merch")
  );
}
