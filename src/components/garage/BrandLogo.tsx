"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type BrandLogoProps = {
  size?: "hero" | "nav";
  asLink?: boolean;
  className?: string;
};

const sizeClass: Record<NonNullable<BrandLogoProps["size"]>, string> = {
  hero: "text-[clamp(1.75rem,6vw,3.25rem)] tracking-[0.08em]",
  nav: "text-[0.95rem] tracking-[0.04em] md:text-base",
};

export function BrandLogo({
  size = "nav",
  asLink = true,
  className = "",
}: BrandLogoProps) {
  const content = (
    <motion.span
      layoutId="tt-brand-logo"
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      className={`relative inline-block font-[family-name:var(--font-display)] font-semibold text-text ${sizeClass[size]} ${className}`}
    >
      Tuned &amp; Threaded
      <span
        className={`absolute left-0 bg-accent ${size === "hero" ? "-bottom-1 h-[2px] w-10" : "-bottom-0.5 h-px w-6"}`}
        aria-hidden
      />
    </motion.span>
  );

  if (!asLink) {
    return content;
  }

  return (
    <Link href="/" className="relative z-10 inline-flex" aria-label="Tuned & Threaded home">
      {content}
    </Link>
  );
}
