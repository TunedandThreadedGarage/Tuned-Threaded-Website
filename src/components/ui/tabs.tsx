"use client";

import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";

export function Tabs({
  tabs,
  defaultValue,
  className,
  onChange,
}: {
  tabs: { id: string; label: string; content: ReactNode }[];
  defaultValue?: string;
  className?: string;
  onChange?: (id: string) => void;
}) {
  const [active, setActive] = useState(defaultValue ?? tabs[0]?.id);

  return (
    <div className={cn("w-full", className)}>
      <div
        role="tablist"
        className="mb-8 flex gap-1 overflow-x-auto border-b border-border pb-px"
      >
        {tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={selected}
              type="button"
              onClick={() => {
                setActive(tab.id);
                onChange?.(tab.id);
              }}
              className={cn(
                "relative shrink-0 px-4 py-3 text-xs uppercase tracking-[0.16em] transition-colors",
                selected
                  ? "text-foreground"
                  : "text-foreground-subtle hover:text-foreground-muted",
              )}
            >
              {tab.label}
              {selected ? (
                <span className="absolute inset-x-3 -bottom-px h-px bg-accent" />
              ) : null}
            </button>
          );
        })}
      </div>
      <div role="tabpanel">{tabs.find((tab) => tab.id === active)?.content}</div>
    </div>
  );
}
