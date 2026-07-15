import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@/components/garage-profile/Avatar";
import { ProgressBar } from "@/components/garage-profile/ProgressBar";
import type { ShowcaseBuild } from "@/features/builds-hub/actions";
import { relativeTime } from "@/features/builds-hub/constants";

export function BuildShowcaseCard({ build }: { build: ShowcaseBuild }) {
  const username = build.author?.username;
  const vehicleLine = build.vehicle
    ? [build.vehicle.year, build.vehicle.make, build.vehicle.model]
        .filter(Boolean)
        .join(" ")
    : null;

  return (
    <Link
      href={`/builds/${build.id}`}
      className="group block border border-border bg-surface/30 transition-colors hover:border-metal/30"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-elevated">
        {build.coverUrl ? (
          <Image
            src={build.coverUrl}
            alt=""
            fill
            loading="lazy"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-[11px] uppercase tracking-[0.16em] text-metal">
            No cover
          </div>
        )}
      </div>
      <div className="space-y-4 p-5 md:p-6">
        <div className="flex items-start gap-3">
          <Avatar
            url={build.author?.avatar_url}
            name={build.author?.display_name ?? username}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-text">
              {build.title}
            </h3>
            <p className="mt-1 text-sm text-text-muted">
              {build.author?.display_name ?? "Member"}
              {username ? (
                <span className="text-metal"> @{username}</span>
              ) : null}
            </p>
          </div>
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-metal">
            {relativeTime(build.updated_at)}
          </span>
        </div>

        {vehicleLine ? (
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-metal">
            {vehicleLine}
            {build.vehicle?.trim ? ` · ${build.vehicle.trim}` : ""}
          </p>
        ) : null}

        <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <div>
            <p className="font-mono uppercase tracking-[0.12em] text-metal">
              Stage
            </p>
            <p className="mt-0.5 text-text">
              {build.current_stage || build.status}
            </p>
          </div>
          <div>
            <p className="font-mono uppercase tracking-[0.12em] text-metal">HP</p>
            <p className="mt-0.5 text-text">
              {build.vehicle?.current_hp ?? "—"}
              {build.vehicle?.target_hp != null
                ? ` / ${build.vehicle.target_hp}`
                : ""}
            </p>
          </div>
          <div>
            <p className="font-mono uppercase tracking-[0.12em] text-metal">
              Reputation
            </p>
            <p className="mt-0.5 text-text">
              {build.author?.reputation_cached ?? 0}
            </p>
          </div>
          <div>
            <p className="font-mono uppercase tracking-[0.12em] text-metal">
              Followers
            </p>
            <p className="mt-0.5 text-text">
              {build.followerCount}
              <span className="text-metal">
                {" "}
                · {build.garageFollowers} garage
              </span>
            </p>
          </div>
        </div>

        <ProgressBar value={build.progress_pct} label="Progress" />

        <div className="flex gap-5 border-t border-border pt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-metal">
          <span>{build.likeCount} likes</span>
          <span>{build.commentCount} comments</span>
          <span className="ml-auto">{build.view_count} views</span>
        </div>
      </div>
    </Link>
  );
}
