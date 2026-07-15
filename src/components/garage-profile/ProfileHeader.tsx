import Link from "next/link";
import { Avatar } from "@/components/garage-profile/Avatar";
import { Banner } from "@/components/garage-profile/Banner";
import { SkillBadge } from "@/components/garage-profile/SkillBadge";
import type { Profile } from "@/types/database";
import type { ReactNode } from "react";

type ProfileHeaderProps = {
  profile: Profile;
  isOwner?: boolean;
  actions?: ReactNode;
  stats?: { label: string; value: number | string }[];
};

export function ProfileHeader({
  profile,
  isOwner,
  actions,
  stats,
}: ProfileHeaderProps) {
  return (
    <div>
      <Banner url={profile.banner_url} />
      <div className="relative px-0 pb-6">
        <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="rounded-full bg-bg p-1">
              <Avatar
                url={profile.avatar_url}
                name={profile.display_name ?? profile.username}
                size="lg"
              />
            </div>
            <div className="pb-1">
              <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-text sm:text-3xl">
                {profile.display_name ?? "Garage Profile"}
              </h1>
              {profile.username ? (
                <p className="mt-0.5 text-sm text-text-muted">@{profile.username}</p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SkillBadge level={profile.skill_level} />
            {isOwner ? (
              <Link
                href="/garage/settings"
                className="border border-border px-4 py-2 text-sm text-text transition-colors hover:border-metal/40"
              >
                Edit profile
              </Link>
            ) : null}
            {actions}
          </div>
        </div>

        {profile.bio ? (
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-text-muted sm:text-base">
            {profile.bio}
          </p>
        ) : null}
        {profile.location ? (
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.14em] text-metal">
            {profile.location}
          </p>
        ) : null}

        {stats && stats.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-6 border-t border-border pt-5">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-text">
                  {stat.value}
                </p>
                <p className="text-xs text-text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
