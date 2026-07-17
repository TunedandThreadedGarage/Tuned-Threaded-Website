"use client";

import { motion } from "framer-motion";
import {
  useGarageHubOptional,
  type GarageTab,
} from "@/features/garage-hub/GarageHubContext";

const LINKS: { id: GarageTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "vehicles", label: "Vehicles" },
  { id: "builds", label: "Builds" },
  { id: "gallery", label: "Gallery" },
  { id: "journal", label: "Journal" },
];

export function GarageNav() {
  const hub = useGarageHubOptional();
  if (!hub) return null;

  const { tab, setTab } = hub;

  return (
    <nav
      aria-label="Garage"
      className="flex gap-1 overflow-x-auto border-b border-border pb-px"
    >
      {LINKS.map((link) => {
        const active = tab === link.id;
        return (
          <button
            key={link.id}
            type="button"
            onClick={() => setTab(link.id)}
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
          </button>
        );
      })}
    </nav>
  );
}

/** Routes that should show the vehicle-showcase Garage chrome. */
export function isGarageShowcasePath(pathname: string) {
  if (pathname === "/garage") return true;
  return (
    pathname.startsWith("/garage/vehicles") ||
    pathname.startsWith("/garage/builds") ||
    pathname.startsWith("/garage/gallery") ||
    pathname.startsWith("/garage/journal") ||
    pathname.startsWith("/garage/discover") ||
    pathname.startsWith("/garage/followers") ||
    pathname.startsWith("/garage/following")
  );
}
