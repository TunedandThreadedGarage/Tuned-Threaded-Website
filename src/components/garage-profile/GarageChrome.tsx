"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
  const reduce = useReducedMotion();
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
      <div className="relative mt-8 min-h-[40vh]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
