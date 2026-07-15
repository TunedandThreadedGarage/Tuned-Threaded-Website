"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type CategoryCardProps = {
  title: string;
  description: string;
  href: string;
  index: number;
};

export function CategoryCard({
  title,
  description,
  href,
  index,
}: CategoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{
        duration: 0.65,
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Link
        href={href}
        className="group relative block aspect-[4/5] overflow-hidden bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        <div
          className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
          style={{
            background: `
              linear-gradient(160deg, rgba(28,28,31,0.2) 0%, rgba(10,10,11,0.85) 70%),
              radial-gradient(ellipse at ${20 + index * 18}% ${30 + index * 10}%, rgba(196,18,26,0.12), transparent 55%),
              linear-gradient(to bottom, #1a1a1d, #0c0c0e)
            `,
          }}
        />
        <div className="garage-grain absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-metal">
            0{index + 1}
          </p>
          <h3 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            {title}
          </h3>
          <p className="mt-2 max-w-[16rem] text-sm text-text-muted transition-colors duration-300 group-hover:text-text/90">
            {description}
          </p>
          <span className="mt-5 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-text">
            Explore
            <span
              aria-hidden
              className="inline-block transition-transform duration-300 group-hover:translate-x-1"
            >
              →
            </span>
          </span>
        </div>
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <div className="absolute inset-0 bg-gradient-to-t from-accent/10 via-transparent to-transparent" />
        </div>
      </Link>
    </motion.div>
  );
}
