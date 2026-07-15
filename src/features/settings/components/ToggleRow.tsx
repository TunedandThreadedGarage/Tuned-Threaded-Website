"use client";

type ToggleRowProps = {
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  locked?: boolean;
  onChange: (next: boolean) => void;
};

export function ToggleRow({
  label,
  hint,
  checked,
  disabled,
  locked,
  onChange,
}: ToggleRowProps) {
  return (
    <label
      className={`flex items-center justify-between gap-4 py-3 ${
        disabled || locked ? "opacity-60" : ""
      }`}
    >
      <span className="min-w-0">
        <span className="block text-sm text-text">{label}</span>
        {hint ? (
          <span className="mt-0.5 block text-xs text-text-muted">{hint}</span>
        ) : null}
        {locked ? (
          <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-metal">
            Always on
          </span>
        ) : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled || locked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 border transition-colors ${
          checked
            ? "border-accent bg-accent"
            : "border-border bg-surface-elevated"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 bg-text transition-transform ${
            checked ? "left-6" : "left-0.5"
          }`}
        />
      </button>
    </label>
  );
}
