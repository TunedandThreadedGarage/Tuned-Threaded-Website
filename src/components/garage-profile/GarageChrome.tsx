"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  GarageNav,
  isGarageShowcasePath,
} from "@/components/garage-profile/GarageNav";
import {
  GarageHubProvider,
  tabFromPath,
} from "@/features/garage-hub/GarageHubContext";

function isHubShellPath(pathname: string) {
  if (pathname === "/garage") return true;
  if (pathname === "/garage/vehicles") return true;
  if (pathname === "/garage/builds") return true;
  if (pathname === "/garage/gallery") return true;
  if (pathname === "/garage/journal") return true;
  return false;
}

function GarageChromeInner({
  signedIn,
  children,
}: {
  signedIn: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const showcase = signedIn && isGarageShowcasePath(pathname);
  const hubShell = signedIn && isHubShellPath(pathname);

  if (!signedIn) return <>{children}</>;

  if (!showcase) {
    return <div className="pt-2">{children}</div>;
  }

  const body = (
    <>
      <div className="mb-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
          The Garage
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-text">
          Vehicle management hub
        </h1>
        <p className="mt-2 max-w-xl text-sm text-text-muted">
          Overview, vehicles, builds, gallery, and journal — manage your bay
          without leaving the Garage.
        </p>
      </div>
      {hubShell ? <GarageNav /> : null}
      <div className="relative mt-8 min-h-[40vh]">{children}</div>
    </>
  );

  if (!hubShell) return body;

  return (
    <GarageHubProvider
      initialTab={tabFromPath(pathname, searchParams.get("tab"))}
    >
      {body}
    </GarageHubProvider>
  );
}

export function GarageChrome({
  signedIn,
  children,
}: {
  signedIn: boolean;
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="pt-2">{children}</div>}>
      <GarageChromeInner signedIn={signedIn}>{children}</GarageChromeInner>
    </Suspense>
  );
}
