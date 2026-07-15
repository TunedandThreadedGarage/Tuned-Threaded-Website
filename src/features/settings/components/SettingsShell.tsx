import { SettingsNav } from "@/features/settings/components/SettingsNav";

export function SettingsShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
          Settings
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-text">
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-text-muted">{description}</p>
      </div>
      <SettingsNav />
      <div>{children}</div>
    </div>
  );
}
