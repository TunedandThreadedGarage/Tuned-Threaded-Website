"use client";

import { useState, useSyncExternalStore } from "react";

const THEME_KEY = "tt-theme-preference";

type ThemePref = "dark" | "system";

const emptySubscribe = () => () => {};

function readStoredPref(): ThemePref {
  const raw = window.localStorage.getItem(THEME_KEY);
  return raw === "system" ? "system" : "dark";
}

export function ThemePreferenceForm() {
  // Server renders the default; after hydration the stored value is shown.
  const hydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const [override, setOverride] = useState<ThemePref | null>(null);
  const [saved, setSaved] = useState(false);
  const pref: ThemePref = override ?? (hydrated ? readStoredPref() : "dark");

  function save(next: ThemePref) {
    setOverride(next);
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
