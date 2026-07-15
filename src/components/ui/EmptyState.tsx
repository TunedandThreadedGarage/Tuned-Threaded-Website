import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="border border-dashed border-border px-6 py-14 text-center">
      <p className="font-[family-name:var(--font-display)] text-lg font-medium text-text">
        {title}
      </p>
      {description ? (
        <p className="mx-auto mt-2 max-w-sm text-sm text-text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
