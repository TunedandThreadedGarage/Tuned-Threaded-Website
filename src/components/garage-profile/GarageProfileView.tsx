import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { ProfileHero } from "@/components/garage-profile/ProfileHero";
import { GarageStatsGrid } from "@/components/garage-profile/GarageStatsGrid";
import { VehicleGarageCard } from "@/components/garage-profile/VehicleGarageCard";
import { ProgressBar } from "@/components/garage-profile/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";
import { formatMoneyFromCents } from "@/lib/garage-stats";
import type { GarageProfileBundle } from "@/lib/garage-profile-data";
import {
  OpenVehicleEditorButton,
  OpenVehicleEditorLink,
} from "@/features/garage-hub/components/OpenVehicleEditorButton";

export function GarageProfileView({
  data,
  isOwner,
  actions,
  username,
}: {
  data: GarageProfileBundle;
  isOwner: boolean;
  actions?: ReactNode;
  username: string;
}) {
  const {
    profile,
    vehicles,
    builds,
    photosByBuild,
    badgeKeys,
    stats,
    galleryPreview,
  } = data;

  const publicBuilds = isOwner
    ? builds
    : builds.filter((b) => b.is_public);

  return (
    <div
      className="space-y-12"
      style={
        {
          ["--garage-accent" as string]: profile.accent_color || "#c4121a",
        } as React.CSSProperties
      }
    >
      <ProfileHero
        profile={profile}
        badgeKeys={badgeKeys}
        isOwner={isOwner}
        actions={actions}
      />

      <GarageStatsGrid
        stats={stats}
        showJournal={isOwner}
        username={profile.username}
      />

      <FadeIn>
        <div className="grid gap-4 border border-border bg-surface/20 px-5 py-5 sm:grid-cols-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-metal">
              Years building
            </p>
            <p className="mt-1 text-lg text-text">
              {stats.yearsBuilding ?? "—"}
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-metal">
              Favorite brand
            </p>
            <p className="mt-1 text-lg text-text">
              {stats.favoriteBrand ?? "—"}
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-metal">
              Est. invested
            </p>
            <p className="mt-1 text-lg text-text">
              {formatMoneyFromCents(stats.estimatedInvestedCents)}
            </p>
          </div>
        </div>
      </FadeIn>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-text">
            Vehicles
          </h2>
          {isOwner ? (
            <OpenVehicleEditorLink
              label="Manage"
              className="text-sm text-text-muted hover:text-text"
            />
          ) : null}
        </div>
        {vehicles.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {vehicles.map((vehicle) => (
              <VehicleGarageCard
                key={vehicle.id}
                vehicle={vehicle}
                href={`/garage/${username}/vehicles/${vehicle.id}`}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No vehicles yet"
            description="Add the cars and trucks that live in your garage."
            action={
              isOwner ? (
                <OpenVehicleEditorButton
                  label="Add a vehicle"
                  variant="secondary"
                />
              ) : undefined
            }
          />
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-text">
            Builds
          </h2>
          <Link
            href={isOwner ? "/garage/builds" : `/garage/${username}`}
            className="text-sm text-text-muted hover:text-text"
          >
            View all
          </Link>
        </div>
        {publicBuilds.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {publicBuilds.slice(0, 6).map((build) => {
              const photo = photosByBuild.get(build.id);
              return (
                <Link
                  key={build.id}
                  href={`/garage/builds/${build.id}`}
                  className="group block border border-border bg-surface transition-colors hover:border-metal/30"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-surface-elevated">
                    {photo?.url ? (
                      <Image
                        src={photo.url}
                        alt=""
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-text-muted">
                        No photo
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 p-4">
                    <h3 className="font-[family-name:var(--font-display)] text-base font-medium text-text">
                      {build.title}
                    </h3>
                    {build.current_stage ? (
                      <p className="text-xs text-text-muted">
                        {build.current_stage}
                        {build.upcoming_stage
                          ? ` → ${build.upcoming_stage}`
                          : ""}
                      </p>
                    ) : null}
                    <ProgressBar value={build.progress_pct} label="Progress" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No builds yet"
            description="Document your project — photos, notes, and progress."
            action={
              isOwner ? (
                <Button href="/garage/builds/new" variant="secondary">
                  Start a build
                </Button>
              ) : undefined
            }
          />
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-text">
            Gallery
          </h2>
          <Link
            href={
              isOwner ? "/garage/gallery" : `/garage/${username}/gallery`
            }
            className="text-sm text-text-muted hover:text-text"
          >
            Open gallery
          </Link>
        </div>
        {galleryPreview.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {galleryPreview.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-square overflow-hidden border border-border bg-surface-elevated"
              >
                <Image
                  src={photo.url}
                  alt={photo.caption ?? ""}
                  fill
                  className="object-cover"
                  sizes="25vw"
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No gallery photos yet"
            description="Albums for builds, rolling shots, dyno sheets, and more."
            action={
              isOwner ? (
                <Button href="/garage/gallery" variant="secondary">
                  Create album
                </Button>
              ) : undefined
            }
          />
        )}
      </section>

      {profile.username ? (
        <div className="flex flex-wrap gap-4 text-sm text-text-muted">
          <p className="text-xs text-metal">
            Tap Followers or Following above to search members.
          </p>
        </div>
      ) : null}
    </div>
  );
}
