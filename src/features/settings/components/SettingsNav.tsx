"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SETTINGS_SECTIONS } from "@/features/settings/constants";

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Settings sections"
      className="flex gap-1 overflow-x-auto border-b border-border pb-px"
    >
      <Link
        href="/garage/settings"
        className={`shrink-0 px-3 py-3 text-sm transition-colors ${
          pathname === "/garage/settings"
            ? "border-b-2 border-text text-text"
            : "border-b-2 border-transparent text-text-muted hover:text-text"
        }`}
      >
        Overview
      </Link>
      {SETTINGS_SECTIONS.map((section) => {
        const active = pathname.startsWith(section.href);
        return (
          <Link
            key={section.key}
            href={section.href}
            className={`shrink-0 px-3 py-3 text-sm transition-colors ${
              active
                ? "border-b-2 border-text text-text"
                : "border-b-2 border-transparent text-text-muted hover:text-text"
            }`}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
