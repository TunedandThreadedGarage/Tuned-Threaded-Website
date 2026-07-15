"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/Button";

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative flex min-h-[100svh] items-end overflow-hidden bg-bg md:items-center">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=2400&q=80"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_35%] opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/80 to-bg/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/45 to-bg/25" />
        <div className="garage-grain absolute inset-0 opacity-[0.12]" />

        {!reduceMotion ? (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-[-10%] top-[20%] h-[40vh] w-[40vh] rounded-full bg-accent/10 blur-[120px]"
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : null}
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-5 pb-20 pt-28 md:px-8 md:pb-24 md:pt-32 lg:px-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-metal">
          Inside the garage
        </p>
        <h1 className="mt-4 max-w-[13ch] font-[family-name:var(--font-display)] text-[clamp(2.4rem,7vw,4.75rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-text">
          Premium gear for the automotive lifestyle.
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-text-muted sm:text-lg">
          Apparel, garage essentials, and culture built by enthusiasts—for the
          people who stay after dark.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button href="#shop" variant="primary">
            Shop the Collection
          </Button>
          <Button href="/garage/sign-up" variant="secondary">
            Join the Garage
          </Button>
        </div>
      </div>
    </section>
  );
}
