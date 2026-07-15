import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div>
        {eyebrow ? (
          <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-foreground-subtle">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-[family-name:var(--font-instrument)] text-3xl tracking-tight text-foreground md:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground-muted md:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
