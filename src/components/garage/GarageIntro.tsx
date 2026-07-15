"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { BrandLogo } from "@/components/garage/BrandLogo";
import { EnterButton } from "@/components/garage/EnterButton";
import { GARAGE_DOOR_DURATION_S } from "@/lib/garage-storage";

/** Soft, cinematic garage interior — photographic, not illustrative. */
const GARAGE_PHOTO =
  "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=2400&q=80";

const doorEase = [0.55, 0.05, 0.2, 1] as const;

type GarageIntroProps = {
  opening: boolean;
  showLogo: boolean;
  onEnter: () => void;
  onOpenComplete: () => void;
};

export function GarageIntro({
  opening,
  showLogo,
  onEnter,
  onOpenComplete,
}: GarageIntroProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="fixed inset-0 z-[70] overflow-hidden bg-[#0a0a0b]"
      initial={false}
      animate={{ y: opening ? "-105%" : "0%" }}
      transition={
        opening
          ? { duration: GARAGE_DOOR_DURATION_S, ease: doorEase }
          : { duration: 0 }
      }
      onAnimationComplete={() => {
        if (opening) onOpenComplete();
      }}
      style={{ willChange: opening ? "transform" : undefined }}
    >
      <div className="absolute inset-0">
        <Image
          src={GARAGE_PHOTO}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Soft natural grade — calm overlay, not neon or glow stacks */}
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/40" />
      </div>

      <div className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-6 text-center">
        {showLogo ? (
          <motion.div
            className="mb-8 sm:mb-10"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <BrandLogo size="hero" asLink={false} />
          </motion.div>
        ) : (
          <div className="mb-8 h-[clamp(2.5rem,8vw,4rem)] sm:mb-10" aria-hidden />
        )}

        <motion.h1
          className="max-w-[14ch] font-[family-name:var(--font-display)] text-[clamp(2rem,6vw,3.75rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-white"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: opening ? 0 : 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        >
          Built in the Garage.
          <span className="block">Worn Everywhere.</span>
        </motion.h1>

        <motion.p
          className="mt-5 max-w-md text-sm leading-relaxed text-white/70 sm:text-[15px]"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: opening ? 0 : 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          This is where builders, racers, weekend mechanics and enthusiasts
          belong.
        </motion.p>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: opening ? 0 : 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <EnterButton onPress={onEnter} disabled={opening} />
        </motion.div>
      </div>
    </motion.div>
  );
}
