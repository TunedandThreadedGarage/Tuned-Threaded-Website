"use client";

import { useState, useTransition } from "react";
import {
  loadBuildsCatalog,
  type ShowcaseBuild,
} from "@/features/builds-hub/actions";
import {
  BUILD_FILTERS,
  BUILDS_TABS,
  type BuildsTab,
} from "@/features/builds-hub/constants";
import { BuildShowcaseCard } from "@/features/builds-hub/components/BuildShowcaseCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export function BuildsCatalog({
  initialBuilds,
  signedIn,
}: {
  initialBuilds: ShowcaseBuild[];
  signedIn: boolean;
}) {
  const [tab, setTab] = useState<BuildsTab>("newest");
  const [tag, setTag] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [builds, setBuilds] = useState(initialBuilds);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function reload(nextTab: BuildsTab, nextTag: string | null, nextQ: string) {
    start(async () => {
      setError(null);
      const res = await loadBuildsCatalog({
        tab: nextTab,
        tag: nextTag,
        q: nextQ || null,
      });
      if (res.error) setError(res.error);
      setBuilds(res.builds);
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2 border-b border-border pb-4 sm:border-0 sm:pb-0">
          {BUILDS_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                reload(t.id, tag, q);
              }}
              className={`px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
                tab === t.id
                  ? "border border-accent text-text"
                  : "border border-transparent text-metal hover:text-text"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => {
            const value = e.target.value;
            setQ(value);
            reload(tab, tag, value);
          }}
          placeholder="Search make, model, engine, HP, user…"
          className="w-full border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-metal/50 sm:max-w-sm"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => {
            setTag(null);
            reload(tab, null, q);
          }}
          className={`shrink-0 border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] ${
            !tag
              ? "border-accent text-text"
              : "border-border text-metal hover:border-metal/40"
          }`}
        >
          All
        </button>
        {BUILD_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => {
              const next = tag === f.key ? null : f.key;
              setTag(next);
              reload(tab, next, q);
            }}
            className={`shrink-0 border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] ${
              tag === f.key
                ? "border-accent text-text"
                : "border-border text-metal hover:border-metal/40"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="border border-border bg-surface/40 px-4 py-3 text-sm text-accent">
          {error.includes("builds") || error.includes("column")
            ? "Builds hub tables are not set up yet. Run supabase/migrations/20260715_builds_hub.sql."
            : error}
        </p>
      ) : null}

      {pending ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-metal">
          Loading…
        </p>
      ) : null}

      {!pending && builds.length === 0 ? (
        <EmptyState
          title="No builds yet"
          description="Public project builds will land here. Start one from your Garage."
          action={
            <Button
              href={signedIn ? "/garage/builds/new" : "/garage/sign-up"}
              variant="primary"
            >
              {signedIn ? "Start a build" : "Join the Garage"}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {builds.map((b) => (
            <BuildShowcaseCard key={b.id} build={b} />
          ))}
        </div>
      )}
    </div>
  );
}
