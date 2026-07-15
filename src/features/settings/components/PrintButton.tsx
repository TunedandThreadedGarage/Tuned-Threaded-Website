"use client";

export function PrintButton({ label = "Print / download" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="border border-border px-4 py-2 text-sm text-text transition-colors hover:border-metal/40 print:hidden"
    >
      {label}
    </button>
  );
}
