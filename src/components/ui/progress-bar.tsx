"use client";

import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";

type ProgressBarProps = {
  value: number;
  className?: string;
  trackClassName?: string;
  label?: string;
  showValue?: boolean;
  accentColor?: string;
};

export function ProgressBar({
  value,
  className,
  trackClassName,
  label,
  showValue = true,
  accentColor,
}: ProgressBarProps) {
  const reduceMotion = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.14em] text-foreground-subtle">
          {label ? <span>{label}</span> : <span />}
          {showValue ? <span className="text-foreground-muted">{clamped}%</span> : null}
        </div>
      )}
      <div
        className={cn(
          "h-1.5 w-full overflow-hidden rounded-full bg-white/8",
          trackClassName,
        )}
      >
        <motion.div
          className="progress-shine h-full rounded-full"
          style={accentColor ? { background: accentColor } : undefined}
          initial={reduceMotion ? false : { width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
