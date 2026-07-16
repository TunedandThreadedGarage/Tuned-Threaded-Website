"use client";

import { useEffect, useState } from "react";

const THEME_KEY = "tt-theme-preference";

type ThemePref = "dark" | "system";

export function ThemePreferenceForm() {
  const [pref, setPref] = useState<ThemePref>("dark");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(THEME_KEY);
    if (raw === "system" || raw === "dark") setPref(raw);
  }, []);

  function save(next: ThemePref) {
    setPref(next);
    window.localStorage.setItem(THEME_KEY, next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  }

  return (
    <div className="max-w-md space-y-4 border border-border p-5">
      <p className="text-sm text-text-muted">
        Tuned &amp; Threaded ships a dark garage theme by default. System mode
        follows your OS preference when available.
      </p>
      <div className="flex flex-col gap-2">
        {(
          [
            ["dark", "Dark (default)"],
            ["system", "System"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => save(value)}
            className={`border px-4 py-3 text-left text-sm transition-colors ${
              pref === value
                ? "border-text text-text"
                : "border-border text-text-muted hover:text-text"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {saved ? (
        <p className="text-sm text-text-muted">Preference saved on this device.</p>
      ) : null}
    </div>
  );
}
