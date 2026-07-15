"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { MapPin, CalendarDays } from "lucide-react";
import { ReputationBadgeRow } from "@/components/ui/reputation-badge";
import { Button } from "@/components/ui/button";
import { getBadges } from "@/lib/garage/badges";
import { formatMemberSince } from "@/lib/utils";
import type { GarageProfile } from "@/types/garage";
import { FollowButton } from "@/features/garage/components/follow-button";
import { SocialLinksRow } from "@/features/garage/components/social-links-row";

export function GarageProfileHeader({
  profile,
  isOwner = false,
}: {
  profile: GarageProfile;
  isOwner?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const badges = getBadges(profile.badges);

  return (
    <section className="relative overflow-hidden">
      <div className="relative h-48 w-full md:h-72 lg:h-80">
        <Image
          src={profile.bannerUrl}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-background/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-transparent" />
      </div>

      <div className="relative mx-auto -mt-20 w-full max-w-7xl px-5 md:-mt-28 md:px-8">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            <div
              className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full border border-border-strong bg-background-soft shadow-[0_20px_50px_rgba(0,0,0,0.45)] md:h-40 md:w-40"
              style={{ boxShadow: `0 0 0 3px ${profile.accentColor}33` }}
            >
              <Image
                src={profile.avatarUrl}
                alt={profile.displayName}
                fill
                className="object-cover"
                sizes="160px"
              />
            </div>

            <div className="min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-[family-name:var(--font-instrument)] text-4xl tracking-tight text-foreground md:text-5xl">
                  {profile.displayName}
                </h1>
                <span
                  className="rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.16em]"
                  style={{
                    color: profile.accentColor,
                    backgroundColor: `${profile.accentColor}18`,
                  }}
                >
                  {profile.garageRank}
                </span>
              </div>

              <p className="mt-2 text-sm text-foreground-muted">
                @{profile.username}
              </p>

              <ReputationBadgeRow badges={badges} className="mt-4" />

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-foreground-muted">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-foreground-subtle" />
                  {profile.location}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-foreground-subtle" />
                  Member since {formatMemberSince(profile.memberSince)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isOwner ? <FollowButton initiallyFollowing={profile.isFollowing} /> : null}
            {isOwner ? (
              <Link href={`/garage/${profile.username}/customize`}>
                <Button variant="outline" size="sm">
                  Customize
                </Button>
              </Link>
            ) : null}
            <SocialLinksRow links={profile.socialLinks} />
          </div>
        </motion.div>

        <div className="mt-8 grid gap-6 border-t border-border pt-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-foreground-subtle">
              Bio
            </p>
            <p className="mt-3 max-w-3xl text-base leading-relaxed text-foreground-muted md:text-lg">
              {profile.bio}
            </p>
            {profile.favoriteQuote ? (
              <p className="mt-4 font-[family-name:var(--font-instrument)] text-xl text-foreground/90">
                “{profile.favoriteQuote}”
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <FavoriteChip label="Favorite manufacturer" value={profile.favoriteManufacturer} />
            <FavoriteChip label="Favorite engine" value={profile.favoriteEngine} />
            <FavoriteChip label="Favorite build style" value={profile.favoriteBuildStyle} />
          </div>
        </div>
      </div>
    </section>
  );
}

function FavoriteChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white/[0.02] px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-foreground-subtle">
        {label}
      </p>
      <p className="mt-1.5 text-sm text-foreground">{value}</p>
    </div>
  );
}
