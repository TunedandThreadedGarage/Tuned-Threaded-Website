"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type {
  Build,
  BuildPhoto,
  GarageAlbum,
  GaragePhoto,
  Modification,
  Vehicle,
  VehiclePhoto,
} from "@/types/database";
import type { GarageProfileBundle } from "@/lib/garage-profile-data";
import type { JournalFeedItem } from "@/features/journal/actions";
import { GarageProfileView } from "@/components/garage-profile/GarageProfileView";
import { BuildCard } from "@/components/garage-profile/BuildCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { GalleryManager } from "@/features/gallery/components/GalleryManager";
import { JournalComposer } from "@/features/journal/components/JournalComposer";
import { JournalTimeline } from "@/features/journal/components/JournalTimeline";
import {
  useGarageHub,
  type GarageTab,
} from "@/features/garage-hub/GarageHubContext";
import { VehicleEditor } from "@/features/garage-hub/components/VehicleEditor";
import { OpenVehicleEditorButton } from "@/features/garage-hub/components/OpenVehicleEditorButton";

export type GarageHubData = {
  profileBundle: GarageProfileBundle;
  username: string;
  userId: string;
  vehicles: Vehicle[];
  vehiclePhotos: VehiclePhoto[];
  modifications: Modification[];
  builds: Build[];
  buildPhotos: BuildPhoto[];
  albums: GarageAlbum[];
  galleryPhotos: GaragePhoto[];
  journalItems: JournalFeedItem[];
  journalBuilds: { id: string; title: string }[];
};

function VehiclesSection({
  data,
}: {
  data: GarageHubData;
}) {
  const { editor, openEditor } = useGarageHub();
  const router = useRouter();

  const editingVehicle =
    editor !== "closed" && editor !== "new"
      ? data.vehicles.find((v) => v.id === editor) ?? null
      : null;
  const showEditor = editor !== "closed";

  const photosFor = (vehicleId: string) =>
    data.vehiclePhotos.filter((p) => p.vehicle_id === vehicleId);
  const modsFor = (vehicleId: string) =>
    data.modifications.filter((m) => m.vehicle_id === vehicleId);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-text">
            Vehicles
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Specs, photos, mods — edited in the Garage, not Settings.
          </p>
        </div>
        {!showEditor ? (
          <OpenVehicleEditorButton label="Add vehicle" variant="primary" />
        ) : null}
      </div>

      {showEditor ? (
        <VehicleEditor
          key={editor === "new" ? "new" : editor}
          vehicle={editor === "new" ? null : editingVehicle}
          photos={editingVehicle ? photosFor(editingVehicle.id) : []}
          modifications={editingVehicle ? modsFor(editingVehicle.id) : []}
          userId={data.userId}
          onSaved={() => router.refresh()}
        />
      ) : null}

      {!showEditor && data.vehicles.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {data.vehicles.map((vehicle) => (
            <li
              key={vehicle.id}
              className="border border-border bg-surface/30 p-4"
            >
              <div className="relative mb-3 aspect-[16/10] overflow-hidden bg-surface">
                {vehicle.photo_url ? (
                  <Image
                    src={vehicle.photo_url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="400px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-text-muted">
                    No cover
                  </div>
                )}
              </div>
              <p className="font-[family-name:var(--font-display)] text-lg text-text">
                {[vehicle.year, vehicle.make, vehicle.model]
                  .filter(Boolean)
                  .join(" ")}
              </p>
              {vehicle.trim ? (
                <p className="text-sm text-text-muted">{vehicle.trim}</p>
              ) : null}
              <p className="mt-1 text-xs text-text-muted">
                {[
                  vehicle.engine,
                  vehicle.transmission,
                  vehicle.drivetrain,
                  vehicle.current_hp != null ? `${vehicle.current_hp} hp` : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "No specs yet"}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => openEditor(vehicle.id)}
                  className="text-sm text-text underline-offset-2 hover:underline"
                >
                  Edit
                </button>
                <Link
                  href={`/garage/${data.username}/vehicles/${vehicle.id}`}
                  className="text-sm text-text-muted hover:text-text"
                >
                  Public page
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {!showEditor && data.vehicles.length === 0 ? (
        <EmptyState
          title="No vehicles yet"
          description="Add the cars and trucks that live in your garage."
          action={
            <OpenVehicleEditorButton label="Add a vehicle" variant="secondary" />
          }
        />
      ) : null}
    </div>
  );
}

function BuildsSection({ data }: { data: GarageHubData }) {
  const firstPhoto = new Map<string, BuildPhoto>();
  for (const p of data.buildPhotos) {
    if (!firstPhoto.has(p.build_id)) firstPhoto.set(p.build_id, p);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-text">
            Your builds
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Projects documented your way.
          </p>
        </div>
        <Button href="/garage/builds/new" variant="primary">
          New build
        </Button>
      </div>

      {data.builds.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.builds.map((build) => (
            <BuildCard
              key={build.id}
              build={build}
              photo={firstPhoto.get(build.id)}
              href={`/garage/builds/${build.id}`}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No builds yet"
          description="Start your first build post."
          action={
            <Button href="/garage/builds/new" variant="secondary">
              Create build
            </Button>
          }
        />
      )}
    </div>
  );
}

function GallerySection({ data }: { data: GarageHubData }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-text">
          Gallery
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Organize albums — builds, rolling shots, dyno sheets, garage photos.
        </p>
      </div>
      <GalleryManager
        albums={data.albums}
        photos={data.galleryPhotos}
        userId={data.userId}
      />
    </div>
  );
}

function JournalSection({ data }: { data: GarageHubData }) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-text">
          Journal
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Your garage log — private drafts and published entries.
        </p>
      </div>
      <JournalComposer userId={data.userId} builds={data.journalBuilds} />
      <JournalTimeline
        items={data.journalItems}
        currentUserId={data.userId}
        signedIn
      />
      <p className="text-sm text-text-muted">
        Browse the public community feed on{" "}
        <Link href="/journal" className="text-text underline-offset-2 hover:underline">
          /journal
        </Link>
        .
      </p>
    </div>
  );
}

const SECTIONS: GarageTab[] = [
  "overview",
  "vehicles",
  "builds",
  "gallery",
  "journal",
];

export function GarageHubExperience({ data }: { data: GarageHubData }) {
  const { tab } = useGarageHub();
  const reduce = useReducedMotion();

  return (
    <div className="relative min-h-[40vh]">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {tab === "overview" ? (
            <GarageProfileView
              data={data.profileBundle}
              isOwner
              username={data.username}
            />
          ) : null}
          {tab === "vehicles" ? <VehiclesSection data={data} /> : null}
          {tab === "builds" ? <BuildsSection data={data} /> : null}
          {tab === "gallery" ? <GallerySection data={data} /> : null}
          {tab === "journal" ? <JournalSection data={data} /> : null}
        </motion.div>
      </AnimatePresence>
      {/* Keep section list for a11y / future keep-alive */}
      <span className="sr-only">{SECTIONS.join(", ")}</span>
    </div>
  );
}
