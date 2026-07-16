"use client";

import { usePathname } from "next/navigation";
import {
  GarageNav,
  isGarageShowcasePath,
} from "@/components/garage-profile/GarageNav";

export function GarageChrome({
  signedIn,
  children,
}: {
  signedIn: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const showcase = signedIn && isGarageShowcasePath(pathname);

  if (!signedIn) return <>{children}</>;

  if (!showcase) {
    return <div className="pt-2">{children}</div>;
  }

  return (
    <>
      <div className="mb-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
          The Garage
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-text">
          Showcase your vehicles
        </h1>
        <p className="mt-2 max-w-xl text-sm text-text-muted">
          Profile, Discover, Builds, and Gallery — the bay where members put
          metal on display.
        </p>
      </div>
      <GarageNav />
      <div className="mt-8">{children}</div>
    </>
  );
}
