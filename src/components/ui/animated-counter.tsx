"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

type AnimatedCounterProps = {
  value: number;
  durationMs?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
};

export function AnimatedCounter({
  value,
  durationMs = 1200,
  className,
  suffix = "",
  prefix = "",
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const format = (n: number) =>
      `${prefix}${Math.round(n).toLocaleString("en-US")}${suffix}`;

    if (reduceMotion) {
      node.textContent = format(value);
      return;
    }

    let frame = 0;
    let start: number | null = null;

    const tick = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      node.textContent = format(value * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs, prefix, suffix]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}0{suffix}
    </span>
  );
}
