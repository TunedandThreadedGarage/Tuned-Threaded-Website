"use client";

import { motion, useReducedMotion } from "framer-motion";

export function ProgressBar({
  value,
  label,
  className = "",
}: {
  value: number;
  label?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const pct = Math.max(0, Math.min(100, value || 0));

  return (
    <div className={className}>
      {label ? (
        <div className="mb-1.5 flex items-center justify-between text-xs text-text-muted">
          <span>{label}</span>
          <span className="font-mono text-metal">{pct}%</span>
        </div>
      ) : null}
      <div className="h-1 overflow-hidden bg-surface-elevated">
        <motion.div
          className="h-full bg-[var(--garage-accent,var(--color-accent))]"
          initial={reduce ? false : { width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={reduce ? { width: `${pct}%` } : undefined}
        />
      </div>
    </div>
  );
}
