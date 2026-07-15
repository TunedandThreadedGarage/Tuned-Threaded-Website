"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Avatar } from "@/components/garage-profile/Avatar";
import { searchCommunity } from "@/features/community/actions";
import { PostCard } from "@/features/community/components/PostCard";
import { SkillBadge } from "@/components/garage-profile/SkillBadge";
import { reputationBand } from "@/features/community/constants";

export function CommunitySearch({ signedIn }: { signedIn: boolean }) {
  const [q, setQ] = useState("");
  const [pending, start] = useTransition();
  const [result, setResult] = useState<Awaited<
    ReturnType<typeof searchCommunity>
  > | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onQueryChange(value: string) {
    setQ(value);
    if (timer.current) clearTimeout(timer.current);
    const trimmed = value.trim();
    if (!trimmed) {
      setResult(null);
      return;
    }
    timer.current = setTimeout(() => {
      start(async () => {
        const r = await searchCommunity(trimmed);
        setResult(r);
      });
    }, 280);
  }

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <div className="space-y-10">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
          Search
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-text">
          Find the garage
        </h1>
        <p className="mt-2 max-w-xl text-sm text-text-muted">
          Users, vehicles, builds, posts, engines, manufacturers, horsepower,
          states, transmissions, and tags.
        </p>
        <input
          value={q}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search community…"
          className="mt-6 w-full border border-border bg-surface px-4 py-3 text-sm text-text outline-none focus:border-metal/50"
        />
      </div>

      {pending ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-metal">
          Searching…
        </p>
      ) : null}

      {result && q.trim() ? (
        <div className="space-y-12">
          <section>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-text">
              Users
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {result.users.length === 0 ? (
                <li className="text-sm text-text-muted">No users found.</li>
              ) : (
                result.users.map((u) => (
                  <li key={u.id}>
                    <Link
                      href={u.username ? `/garage/${u.username}` : "#"}
                      className="flex items-center gap-3 border border-border bg-surface/20 p-4 transition-colors hover:border-metal/30"
                    >
                      <Avatar
                        url={u.avatar_url}
                        name={u.display_name ?? u.username}
                        size="md"
                      />
                      <div>
                        <p className="text-text">
                          {u.display_name ?? u.username}
                        </p>
                        <p className="text-sm text-text-muted">@{u.username}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <SkillBadge level={u.skill_level} />
                          <span className="font-mono text-[10px] text-metal">
                            {reputationBand(u.reputation_cached)} ·{" "}
                            {u.reputation_cached} rep
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-text">
              Vehicles
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {result.vehicles.length === 0 ? (
                <li className="text-sm text-text-muted">No vehicles found.</li>
              ) : (
                result.vehicles.map((v) => {
                  const href =
                    v.username && v.id
                      ? `/garage/${v.username}/vehicles/${v.id}`
                      : v.username
                        ? `/garage/${v.username}`
                        : "#";
                  return (
                    <li key={v.id}>
                      <Link
                        href={href}
                        className="block border border-border bg-surface/20 px-4 py-3 text-sm text-text transition-colors hover:border-metal/30"
                      >
                        {[v.year, v.make, v.model].filter(Boolean).join(" ")}
                        {v.trim ? ` · ${v.trim}` : ""}
                        {v.username ? (
                          <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.12em] text-metal">
                            @{v.username}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })
              )}
            </ul>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-text">
              Builds
            </h2>
            <ul className="mt-4 space-y-2">
              {result.builds.length === 0 ? (
                <li className="text-sm text-text-muted">No builds found.</li>
              ) : (
                result.builds.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={`/garage/builds/${b.id}`}
                      className="text-sm text-text hover:underline"
                    >
                      {b.title}
                    </Link>
                    {b.username ? (
                      <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.12em] text-metal">
                        @{b.username}
                      </span>
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-text">
              Posts
            </h2>
            {result.posts.length === 0 ? (
              <p className="text-sm text-text-muted">No posts found.</p>
            ) : (
              result.posts.map((p) => (
                <PostCard key={p.id} post={p} signedIn={signedIn} />
              ))
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
