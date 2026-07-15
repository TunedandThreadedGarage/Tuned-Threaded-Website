import type { ReactNode } from "react";
import { FadeIn } from "@/components/ui/FadeIn";

export function SectionCard({
  title,
  description,
  action,
  children,
  id,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  return (
    <FadeIn>
      <section id={id} className="border border-border bg-surface/30">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-text">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-text-muted">{description}</p>
            ) : null}
          </div>
          {action}
        </div>
        <div className="p-5">{children}</div>
      </section>
    </FadeIn>
  );
}
