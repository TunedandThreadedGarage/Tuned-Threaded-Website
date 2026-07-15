import type { SkillLevel } from "@/types/database";

const LABELS: Record<SkillLevel, string> = {
  weekend_wrench: "Weekend Wrench",
  home_mechanic: "Home Mechanic",
  builder: "Builder",
  pro_shop: "Pro Shop",
};

export function SkillBadge({ level }: { level: SkillLevel | null | undefined }) {
  if (!level) return null;
  return (
    <span
      title="Garage rank"
      className="inline-flex border border-[var(--garage-accent,var(--color-border))] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-metal"
    >
      {LABELS[level]}
    </span>
  );
}

export const SKILL_LEVEL_OPTIONS: { value: SkillLevel; label: string }[] = [
  { value: "weekend_wrench", label: "Weekend Wrench" },
  { value: "home_mechanic", label: "Home Mechanic" },
  { value: "builder", label: "Builder" },
  { value: "pro_shop", label: "Pro Shop" },
];
