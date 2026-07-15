import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar } from "@/components/garage-profile/Avatar";
import { Banner } from "@/components/garage-profile/Banner";
import { BadgeRow } from "@/components/garage-profile/BadgeRow";
import { SkillBadge } from "@/components/garage-profile/SkillBadge";
import { formatMemberSince } from "@/lib/garage-stats";
import type { Profile } from "@/types/database";

function SocialLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-mono text-[10px] uppercase tracking-[0.14em] text-metal transition-colors hover:text-text"
    >
      {label}
    </a>
  );
}

export function ProfileHero({
  profile,
  badgeKeys,
  isOwner,
  actions,
}: {
  profile: Profile;
  badgeKeys: string[];
  isOwner?: boolean;
  actions?: ReactNode;
}) {
  const favorites = [
    profile.favorite_manufacturer
      ? { label: "Manufacturer", value: profile.favorite_manufacturer }
      : null,
    profile.favorite_engine
      ? { label: "Engine", value: profile.favorite_engine }
      : null,
    profile.favorite_build_style
      ? { label: "Build style", value: profile.favorite_build_style }
      : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div
      style={
        {
          ["--garage-accent" as string]: profile.accent_color || "#c4121a",
        } as React.CSSProperties
      }
    >
      <Banner url={profile.banner_url} />
      <div className="relative pb-2">
        <div className="-mt-14 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-5">
            <div className="rounded-full bg-bg p-1.5">
              <Avatar
                url={profile.avatar_url}
                name={profile.display_name ?? profile.username}
                size="lg"
              />
            </div>
            <div className="pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-text sm:text-4xl">
                  {profile.display_name ?? "Garage Profile"}
                </h1>
                <SkillBadge level={profile.skill_level} />
              </div>
              {profile.username ? (
                <p className="mt-1 text-sm text-text-muted">@{profile.username}</p>
              ) : null}
              <BadgeRow badgeKeys={badgeKeys} className="mt-3" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
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

        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-muted">
          {profile.location ? <span>{profile.location}</span> : null}
          <span className="font-mono text-xs uppercase tracking-[0.14em] text-metal">
            Member since {formatMemberSince(profile.created_at)}
          </span>
        </div>

        {profile.bio ? (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-muted sm:text-base">
            {profile.bio}
          </p>
        ) : null}

        {profile.favorite_quote ? (
          <p className="mt-4 max-w-2xl border-l border-[var(--garage-accent)] pl-4 text-sm italic text-text">
            “{profile.favorite_quote}”
          </p>
        ) : null}

        {favorites.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {favorites.map((fav) => (
              <div key={fav.label}>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-metal">
                  {fav.label}
                </p>
                <p className="mt-1 text-sm text-text">{fav.value}</p>
              </div>
            ))}
          </div>
        ) : null}

        {(profile.youtube_url ||
          profile.instagram_url ||
          profile.tiktok_url ||
          profile.website_url) && (
          <div className="mt-5 flex flex-wrap gap-4">
            {profile.youtube_url ? (
              <SocialLink href={profile.youtube_url} label="YouTube" />
            ) : null}
            {profile.instagram_url ? (
              <SocialLink href={profile.instagram_url} label="Instagram" />
            ) : null}
            {profile.tiktok_url ? (
              <SocialLink href={profile.tiktok_url} label="TikTok" />
            ) : null}
            {profile.website_url ? (
              <SocialLink href={profile.website_url} label="Website" />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
