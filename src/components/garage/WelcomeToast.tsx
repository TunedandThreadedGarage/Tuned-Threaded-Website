"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { GARAGE_WELCOME_DURATION_MS } from "@/lib/garage-storage";

type WelcomeToastProps = {
  returning: boolean;
  onDone: () => void;
};

export function WelcomeToast({ returning, onDone }: WelcomeToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, GARAGE_WELCOME_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-none fixed bottom-6 left-5 z-[60] max-w-[18rem] md:bottom-8 md:left-8"
    >
      <p className="font-[family-name:var(--font-display)] text-sm font-medium tracking-wide text-text/90 md:text-base">
        {returning ? "Welcome back." : "Welcome to the Garage."}
      </p>
      <p className="mt-1 text-xs text-text-muted md:text-sm">
        What&apos;s getting built today?
      </p>
    </motion.div>
  );
}
