"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

export function AnimatedStat({
  value,
  label,
  format,
}: {
  value: number;
  label: string;
  format?: (n: number) => string;
}) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const shownValue = reduce ? value : display;

  useEffect(() => {
    if (reduce) return;

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || started.current) return;
        started.current = true;
        const duration = 900;
        const start = performance.now();
        const from = 0;
        const to = value;

        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplay(Math.round(from + (to - from) * eased));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, reduce]);

  const text = format ? format(shownValue) : String(shownValue);

  return (
    <div ref={ref}>
      <p className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-text tabular-nums">
        {text}
      </p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-metal">
        {label}
      </p>
    </div>
  );
}
