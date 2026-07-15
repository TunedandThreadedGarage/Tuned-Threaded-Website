import { BADGE_META } from "@/lib/garage-badges";

export function BadgePill({ badgeKey }: { badgeKey: string }) {
  const meta = BADGE_META[badgeKey];
  const label = meta?.label ?? badgeKey;
  return (
    <span
      title={meta?.description}
      className="inline-flex items-center border border-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-metal"
    >
      {label}
    </span>
  );
}

export function BadgeRow({
  badgeKeys,
  className = "",
}: {
  badgeKeys: string[];
  className?: string;
}) {
  if (badgeKeys.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {badgeKeys.map((key) => (
        <BadgePill key={key} badgeKey={key} />
      ))}
    </div>
  );
}
