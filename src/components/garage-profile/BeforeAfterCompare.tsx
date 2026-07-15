"use client";

import Image from "next/image";
import { useState } from "react";

export function BeforeAfterCompare({
  beforeUrl,
  afterUrl,
}: {
  beforeUrl: string;
  afterUrl: string;
}) {
  const [pos, setPos] = useState(50);

  return (
    <div className="relative aspect-[16/10] overflow-hidden border border-border bg-surface-elevated">
      <Image src={afterUrl} alt="After" fill className="object-cover" sizes="800px" />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${pos}%` }}
      >
        <div className="relative h-full w-[100vw] max-w-none">
          <Image
            src={beforeUrl}
            alt="Before"
            fill
            className="object-cover"
            sizes="800px"
          />
        </div>
      </div>
      <input
        type="range"
        min={5}
        max={95}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        className="absolute inset-x-4 bottom-4 z-10"
        aria-label="Before and after comparison"
      />
      <div className="pointer-events-none absolute inset-y-0 left-[var(--pos)] w-px bg-white/70" style={{ left: `${pos}%` }} />
      <span className="absolute left-3 top-3 font-mono text-[10px] uppercase tracking-[0.14em] text-white/80">
        Before
      </span>
      <span className="absolute right-3 top-3 font-mono text-[10px] uppercase tracking-[0.14em] text-white/80">
        After
      </span>
    </div>
  );
}
