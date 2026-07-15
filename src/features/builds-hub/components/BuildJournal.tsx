"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { Avatar } from "@/components/garage-profile/Avatar";
import { ProgressBar } from "@/components/garage-profile/ProgressBar";
import { FollowButton } from "@/features/social/components/FollowButton";
import {
  addBuildPart,
  addTimelineEntry,
  loadBuildShowcase,
  toggleBuildFollow,
  toggleHubBuildLike,
  toggleTimelineLike,
  upsertBuildGoals,
  type BuildShowcaseBundle,
} from "@/features/builds-hub/actions";
import {
  formatMoney,
  relativeTime,
} from "@/features/builds-hub/constants";
import { BuildGallery } from "@/features/builds-hub/components/BuildGallery";
import { BuildDiscussion } from "@/features/builds-hub/components/BuildDiscussion";
import { PerfCharts } from "@/features/builds-hub/components/PerfCharts";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";

export function BuildJournal({
  initial,
  signedIn,
}: {
  initial: BuildShowcaseBundle;
  signedIn: boolean;
}) {
  const [bundle, setBundle] = useState(initial);
  const [liked, setLiked] = useState(initial.build.liked);
  const [likes, setLikes] = useState(initial.build.likeCount);
  const [followingBuild, setFollowingBuild] = useState(
    initial.build.followingBuild,
  );
  const [followers, setFollowers] = useState(initial.build.followerCount);
  const [shareHint, setShareHint] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const [timelineState, timelineAction] = useActionState(addTimelineEntry, {});
  const [goalsState, goalsAction] = useActionState(upsertBuildGoals, {});
  const [partState, partAction] = useActionState(addBuildPart, {});

  const b = bundle.build;
  const username = b.author?.username;
  const vehicleLine = b.vehicle
    ? [b.vehicle.year, b.vehicle.make, b.vehicle.model].filter(Boolean).join(" ")
    : null;

  async function refresh() {
    const res = await loadBuildShowcase(b.id);
    if (res.bundle) setBundle(res.bundle);
    router.refresh();
  }

  function share() {
    const url = `${window.location.origin}/builds/${b.id}`;
    void navigator.clipboard?.writeText(url).then(() => {
      setShareHint(true);
      window.setTimeout(() => setShareHint(false), 1600);
    });
  }

  return (
    <div className="space-y-16">
      <FadeIn>
        <section className="overflow-hidden border border-border bg-surface/20">
          <div className="relative aspect-[21/9] max-h-[420px] w-full bg-surface-elevated">
            {b.coverUrl ? (
              <Image
                src={b.coverUrl}
                alt=""
                fill
                priority
                className="object-cover"
                sizes="100vw"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
                Build journal
              </p>
              <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-text md:text-5xl">
                {b.title}
              </h1>
              {vehicleLine ? (
                <p className="mt-2 font-mono text-[12px] uppercase tracking-[0.16em] text-metal">
                  {vehicleLine}
                  {b.vehicle?.trim ? ` · ${b.vehicle.trim}` : ""}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-8 p-6 md:grid-cols-[1fr_auto] md:p-8">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={username ? `/garage/${username}` : "#"}
                  className="flex items-center gap-3"
                >
                  <Avatar
                    url={b.author?.avatar_url}
                    name={b.author?.display_name ?? username}
                    size="md"
                  />
                  <div>
                    <p className="text-text">
                      {b.author?.display_name ?? "Member"}
                    </p>
                    {username ? (
                      <p className="text-sm text-text-muted">@{username}</p>
                    ) : null}
                  </div>
                </Link>
                {signedIn && !bundle.isOwner ? (
                  <FollowButton
                    followingId={b.user_id}
                    initiallyFollowing={bundle.followingOwner}
                  />
                ) : null}
              </div>

              {b.body ? (
                <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
                  {b.body}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={!signedIn || pending}
                  onClick={() =>
                    start(async () => {
                      const res = await toggleHubBuildLike(b.id);
                      if (!res.error) {
                        setLiked((v) => !v);
                        setLikes((n) => (liked ? Math.max(0, n - 1) : n + 1));
                      }
                    })
                  }
                  className={`border px-4 py-2 text-sm transition-colors ${
                    liked
                      ? "border-accent text-accent"
                      : "border-border text-text-muted hover:border-metal/40 hover:text-text"
                  }`}
                >
                  {liked ? "Liked" : "Like"} · {likes}
                </button>
                <button
                  type="button"
                  disabled={!signedIn || pending || bundle.isOwner}
                  onClick={() =>
                    start(async () => {
                      const res = await toggleBuildFollow(b.id);
                      if (!res.error) {
                        setFollowingBuild((v) => !v);
                        setFollowers((n) =>
                          followingBuild ? Math.max(0, n - 1) : n + 1,
                        );
                      }
                    })
                  }
                  className={`border px-4 py-2 text-sm transition-colors ${
                    followingBuild
                      ? "border-metal/50 text-text"
                      : "border-border text-text-muted hover:border-metal/40 hover:text-text"
                  }`}
                >
                  {followingBuild ? "Following build" : "Follow build"} ·{" "}
                  {followers}
                </button>
                <button
                  type="button"
                  onClick={share}
                  className="border border-border px-4 py-2 text-sm text-text-muted hover:border-metal/40 hover:text-text"
                >
                  {shareHint ? "Link copied" : "Share"}
                </button>
                {bundle.isOwner ? (
                  <Button href={`/garage/builds/${b.id}`} variant="secondary">
                    Owner tools
                  </Button>
                ) : null}
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-4 border border-border bg-bg/40 p-4 text-xs sm:grid-cols-3 md:min-w-[320px]">
              <div>
                <dt className="font-mono uppercase tracking-[0.12em] text-metal">
                  Stage
                </dt>
                <dd className="mt-1 text-text">
                  {b.current_stage || b.status}
                </dd>
              </div>
              <div>
                <dt className="font-mono uppercase tracking-[0.12em] text-metal">
                  HP
                </dt>
                <dd className="mt-1 text-text">
                  {b.vehicle?.current_hp ?? "—"}
                  {b.vehicle?.target_hp != null
                    ? ` → ${b.vehicle.target_hp}`
                    : ""}
                </dd>
              </div>
              <div>
                <dt className="font-mono uppercase tracking-[0.12em] text-metal">
                  Complete
                </dt>
                <dd className="mt-1 text-text">{b.progress_pct}%</dd>
              </div>
              <div>
                <dt className="font-mono uppercase tracking-[0.12em] text-metal">
                  Invested
                </dt>
                <dd className="mt-1 text-text">
                  {formatMoney(b.invested_cents_cached)}
                </dd>
              </div>
              <div>
                <dt className="font-mono uppercase tracking-[0.12em] text-metal">
                  Labor
                </dt>
                <dd className="mt-1 text-text">
                  {b.labor_hours_cached != null
                    ? `${b.labor_hours_cached}h`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="font-mono uppercase tracking-[0.12em] text-metal">
                  Updated
                </dt>
                <dd className="mt-1 text-text">{relativeTime(b.updated_at)}</dd>
              </div>
            </dl>
          </div>
          <div className="px-6 pb-6 md:px-8">
            <ProgressBar value={b.progress_pct} label="Build progress" />
          </div>
        </section>
      </FadeIn>

      <FadeIn delay={0.05}>
        <section className="space-y-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
              Timeline
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-text">
              Project history
            </h2>
          </div>
          <ul className="space-y-0 border-l border-border">
            {bundle.timeline.length === 0 ? (
              <li className="ml-6 text-sm text-text-muted">
                No timeline entries yet.
              </li>
            ) : (
              bundle.timeline.map((entry) => (
                <li key={entry.id} className="relative ml-6 py-5 pl-6">
                  <span className="absolute -left-[5px] top-7 h-2.5 w-2.5 rounded-full border border-accent bg-bg" />
                  <div className="border border-border bg-surface/20 p-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-[family-name:var(--font-display)] text-lg text-text">
                        {entry.title}
                      </h3>
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-metal">
                        {entry.entry_date}
                      </span>
                      {entry.stage ? (
                        <span className="border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-metal">
                          {entry.stage}
                        </span>
                      ) : null}
                    </div>
                    {entry.description ? (
                      <p className="mt-2 text-sm text-text-muted whitespace-pre-wrap">
                        {entry.description}
                      </p>
                    ) : null}
                    {entry.parts_installed ? (
                      <p className="mt-2 text-xs text-text">
                        Parts: {entry.parts_installed}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-4 font-mono text-[10px] uppercase tracking-[0.12em] text-metal">
                      {entry.cost_cents != null ? (
                        <span>{formatMoney(entry.cost_cents)}</span>
                      ) : null}
                      {entry.hours_spent != null ? (
                        <span>{entry.hours_spent}h labor</span>
                      ) : null}
                    </div>
                    {entry.photos?.length ? (
                      <div className="mt-3 grid grid-cols-2 gap-1 sm:grid-cols-3">
                        {entry.photos.slice(0, 6).map((url) => (
                          <div
                            key={url}
                            className="relative aspect-[4/3] overflow-hidden bg-surface-elevated"
                          >
                            <Image
                              src={url}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="200px"
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {entry.video_url ? (
                      <video
                        src={entry.video_url}
                        controls
                        className="mt-3 w-full border border-border"
                        preload="metadata"
                      />
                    ) : null}
                    <div className="mt-4 flex gap-4">
                      <button
                        type="button"
                        disabled={!signedIn || pending}
                        className={`text-xs ${
                          entry.liked
                            ? "text-accent"
                            : "text-text-muted hover:text-text"
                        }`}
                        onClick={() =>
                          start(async () => {
                            await toggleTimelineLike(entry.id, b.id);
                            void refresh();
                          })
                        }
                      >
                        Like · {entry.like_count}
                      </button>
                      <button
                        type="button"
                        className="text-xs text-text-muted hover:text-text"
                        onClick={share}
                      >
                        Share
                      </button>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>

          {bundle.isOwner ? (
            <form
              action={timelineAction}
              className="space-y-3 border border-border bg-surface/20 p-5"
            >
              <input type="hidden" name="build_id" value={b.id} />
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-metal">
                Add timeline update
              </p>
              <input
                name="title"
                required
                placeholder="Title"
                className="w-full border border-border bg-bg px-3 py-2.5 text-sm text-text"
              />
              <textarea
                name="description"
                rows={3}
                placeholder="What happened in the bay…"
                className="w-full border border-border bg-bg px-3 py-2.5 text-sm text-text"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  name="entry_date"
                  type="date"
                  className="border border-border bg-bg px-3 py-2.5 text-sm text-text"
                />
                <input
                  name="stage"
                  placeholder="Stage"
                  className="border border-border bg-bg px-3 py-2.5 text-sm text-text"
                />
                <input
                  name="parts_installed"
                  placeholder="Parts installed"
                  className="border border-border bg-bg px-3 py-2.5 text-sm text-text"
                />
                <input
                  name="video_url"
                  placeholder="Video URL"
                  className="border border-border bg-bg px-3 py-2.5 text-sm text-text"
                />
                <input
                  name="cost_cents"
                  type="number"
                  placeholder="Cost (cents)"
                  className="border border-border bg-bg px-3 py-2.5 text-sm text-text"
                />
                <input
                  name="hours_spent"
                  type="number"
                  step="0.5"
                  placeholder="Labor hours"
                  className="border border-border bg-bg px-3 py-2.5 text-sm text-text"
                />
              </div>
              {timelineState.error ? (
                <p className="text-sm text-accent">{timelineState.error}</p>
              ) : null}
              <Button type="submit" variant="primary">
                Publish update
              </Button>
            </form>
          ) : null}
        </section>
      </FadeIn>

      <FadeIn delay={0.08}>
        <section className="space-y-5">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
              Gallery
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-text">
              Photos &amp; video
            </h2>
          </div>
          <BuildGallery photos={bundle.photos} videos={bundle.videos} />
        </section>
      </FadeIn>

      <FadeIn delay={0.1}>
        <section className="space-y-5">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
              Parts
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-text">
              Inventory
            </h2>
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-metal">
                Installed
              </h3>
              <ul className="mt-3 divide-y divide-border border border-border">
                {bundle.parts.filter((p) => p.status === "installed").length ===
                0 ? (
                  <li className="px-4 py-3 text-sm text-text-muted">
                    No installed parts listed.
                  </li>
                ) : (
                  bundle.parts
                    .filter((p) => p.status === "installed")
                    .map((p) => (
                      <li key={p.id} className="px-4 py-3 text-sm">
                        <p className="text-text">
                          {p.brand ? `${p.brand} · ` : ""}
                          {p.name}
                        </p>
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-metal">
                          {formatMoney(p.price_cents)}
                          {p.install_date ? ` · ${p.install_date}` : ""}
                          {p.purchase_url ? (
                            <>
                              {" · "}
                              <a
                                href={p.purchase_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-text hover:underline"
                              >
                                Link
                              </a>
                            </>
                          ) : null}
                        </p>
                      </li>
                    ))
                )}
              </ul>
            </div>
            <div>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-metal">
                Wishlist
              </h3>
              <ul className="mt-3 divide-y divide-border border border-border">
                {bundle.parts.filter((p) => p.status === "wishlist").length ===
                0 ? (
                  <li className="px-4 py-3 text-sm text-text-muted">
                    Wishlist empty.
                  </li>
                ) : (
                  bundle.parts
                    .filter((p) => p.status === "wishlist")
                    .map((p) => (
                      <li key={p.id} className="px-4 py-3 text-sm">
                        <p className="text-text">{p.name}</p>
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-metal">
                          Priority {p.priority} · {formatMoney(p.price_cents)}
                        </p>
                      </li>
                    ))
                )}
              </ul>
            </div>
          </div>

          {bundle.garageMods.length > 0 ? (
            <div>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-metal">
                From garage vehicle
              </h3>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {bundle.garageMods.map((m) => (
                  <li
                    key={m.id}
                    className="border border-border bg-bg/40 px-4 py-3 text-sm text-text"
                  >
                    {m.part_brand ? `${m.part_brand} · ` : ""}
                    {m.title}
                    <span className="ml-2 font-mono text-[10px] uppercase text-metal">
                      {m.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {bundle.isOwner ? (
            <form
              action={partAction}
              className="grid gap-3 border border-border bg-surface/20 p-5 sm:grid-cols-2"
            >
              <input type="hidden" name="build_id" value={b.id} />
              <p className="sm:col-span-2 font-mono text-[11px] uppercase tracking-[0.16em] text-metal">
                Add part
              </p>
              <input
                name="name"
                required
                placeholder="Part name"
                className="border border-border bg-bg px-3 py-2.5 text-sm text-text"
              />
              <input
                name="brand"
                placeholder="Brand"
                className="border border-border bg-bg px-3 py-2.5 text-sm text-text"
              />
              <input
                name="price_cents"
                type="number"
                placeholder="Price (cents)"
                className="border border-border bg-bg px-3 py-2.5 text-sm text-text"
              />
              <input
                name="purchase_url"
                placeholder="Purchase URL"
                className="border border-border bg-bg px-3 py-2.5 text-sm text-text"
              />
              <input
                name="install_date"
                type="date"
                className="border border-border bg-bg px-3 py-2.5 text-sm text-text"
              />
              <select
                name="status"
                className="border border-border bg-bg px-3 py-2.5 text-sm text-text"
                defaultValue="installed"
              >
                <option value="installed">Installed</option>
                <option value="wishlist">Wishlist</option>
              </select>
              <input
                name="priority"
                type="number"
                placeholder="Priority"
                className="border border-border bg-bg px-3 py-2.5 text-sm text-text"
              />
              {partState.error ? (
                <p className="sm:col-span-2 text-sm text-accent">
                  {partState.error}
                </p>
              ) : null}
              <div className="sm:col-span-2">
                <Button type="submit" variant="secondary">
                  Save part
                </Button>
              </div>
            </form>
          ) : null}
        </section>
      </FadeIn>

      <FadeIn delay={0.12}>
        <section className="space-y-5">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
              Performance
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-text">
              Numbers that matter
            </h2>
          </div>
          <PerfCharts
            dyno={bundle.dyno}
            quarterMile={bundle.quarterMile}
            performance={bundle.performance}
          />
        </section>
      </FadeIn>

      <FadeIn delay={0.14}>
        <section className="space-y-5">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
              Goals
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-text">
              Where this build is headed
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                label: "Current goal",
                value: bundle.goals?.current_goal,
              },
              { label: "Next goal", value: bundle.goals?.next_goal },
              {
                label: "Long-term",
                value: bundle.goals?.long_term_goal,
              },
            ].map((g) => (
              <div key={g.label} className="border border-border bg-surface/20 p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-metal">
                  {g.label}
                </p>
                <p className="mt-3 text-sm text-text">{g.value || "—"}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-6 border border-border bg-bg/40 px-5 py-4 text-sm">
            <p>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-metal">
                Budget remaining
              </span>
              <span className="ml-3 text-text">
                {formatMoney(bundle.goals?.budget_remaining_cents)}
              </span>
            </p>
            <p>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-metal">
                Goal completion
              </span>
              <span className="ml-3 text-text">
                {bundle.goals?.completion_pct ?? b.progress_pct}%
              </span>
            </p>
          </div>
          {bundle.isOwner ? (
            <form
              action={goalsAction}
              className="grid gap-3 border border-border bg-surface/20 p-5 sm:grid-cols-2"
            >
              <input type="hidden" name="build_id" value={b.id} />
              <input
                name="current_goal"
                defaultValue={bundle.goals?.current_goal ?? ""}
                placeholder="Current goal"
                className="border border-border bg-bg px-3 py-2.5 text-sm text-text"
              />
              <input
                name="next_goal"
                defaultValue={bundle.goals?.next_goal ?? ""}
                placeholder="Next goal"
                className="border border-border bg-bg px-3 py-2.5 text-sm text-text"
              />
              <input
                name="long_term_goal"
                defaultValue={bundle.goals?.long_term_goal ?? ""}
                placeholder="Long-term goal"
                className="border border-border bg-bg px-3 py-2.5 text-sm text-text sm:col-span-2"
              />
              <input
                name="budget_remaining_cents"
                type="number"
                defaultValue={bundle.goals?.budget_remaining_cents ?? ""}
                placeholder="Budget remaining (cents)"
                className="border border-border bg-bg px-3 py-2.5 text-sm text-text"
              />
              <input
                name="completion_pct"
                type="number"
                min={0}
                max={100}
                defaultValue={bundle.goals?.completion_pct ?? b.progress_pct}
                placeholder="Completion %"
                className="border border-border bg-bg px-3 py-2.5 text-sm text-text"
              />
              {goalsState.error ? (
                <p className="sm:col-span-2 text-sm text-accent">
                  {goalsState.error}
                </p>
              ) : null}
              <div className="sm:col-span-2">
                <Button type="submit" variant="secondary">
                  Save goals
                </Button>
              </div>
            </form>
          ) : null}
        </section>
      </FadeIn>

      <FadeIn delay={0.16}>
        <section className="space-y-5">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
              Discussion
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-text">
              Build thread
            </h2>
          </div>
          <BuildDiscussion
            buildId={b.id}
            comments={bundle.comments}
            signedIn={signedIn}
            onRefresh={() => void refresh()}
          />
        </section>
      </FadeIn>
    </div>
  );
}
