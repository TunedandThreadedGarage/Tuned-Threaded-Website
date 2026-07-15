import { cn } from "@/lib/utils";
import type { BadgeDefinition } from "@/types/garage";

type ReputationBadgeProps = {
  badge: BadgeDefinition;
  size?: "sm" | "md";
  className?: string;
};

export function ReputationBadge({
  badge,
  size = "sm",
  className,
}: ReputationBadgeProps) {
  return (
    <span
      title={badge.description}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-white/[0.03] text-foreground-muted",
        size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
        className,
      )}
    >
      <span aria-hidden>{badge.emoji}</span>
      <span className="tracking-wide">{badge.label}</span>
    </span>
  );
}

export function ReputationBadgeRow({
  badges,
  className,
}: {
  badges: BadgeDefinition[];
  className?: string;
}) {
  if (!badges.length) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {badges.map((badge) => (
        <ReputationBadge key={badge.id} badge={badge} />
      ))}
    </div>
  );
}
