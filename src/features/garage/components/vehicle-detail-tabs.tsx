"use client";

import { BuildTimeline } from "@/features/garage/components/build-timeline";
import { PhotoGallery } from "@/features/garage/components/photo-gallery";
import {
  DynoResults,
  MaintenanceLog,
  PartsList,
  QuarterMileTimes,
  VehicleOverview,
} from "@/features/garage/components/vehicle-sections";
import { Tabs } from "@/components/ui/tabs";
import type {
  DynoResult,
  GalleryPhoto,
  MaintenanceEntry,
  Part,
  QuarterMileTime,
  TimelineComment,
  TimelineUpdate,
  Vehicle,
} from "@/types/garage";

export function VehicleDetailTabs({
  vehicle,
  timeline,
  commentsByUpdate,
  installedParts,
  futureParts,
  maintenance,
  dynoResults,
  quarterMileTimes,
  photos,
}: {
  vehicle: Vehicle;
  timeline: TimelineUpdate[];
  commentsByUpdate: Record<string, TimelineComment[]>;
  installedParts: Part[];
  futureParts: Part[];
  maintenance: MaintenanceEntry[];
  dynoResults: DynoResult[];
  quarterMileTimes: QuarterMileTime[];
  photos: GalleryPhoto[];
}) {
  return (
    <Tabs
      defaultValue="overview"
      tabs={[
        {
          id: "overview",
          label: "Overview",
          content: <VehicleOverview vehicle={vehicle} />,
        },
        {
          id: "photos",
          label: "Photos",
          content: <PhotoGallery photos={photos} canUpload embedded />,
        },
        {
          id: "timeline",
          label: "Build Timeline",
          content: (
            <BuildTimeline
              updates={timeline}
              commentsByUpdate={commentsByUpdate}
            />
          ),
        },
        {
          id: "installed",
          label: "Installed Parts",
          content: (
            <PartsList
              title="Installed Parts"
              description="What is already bolted on."
              parts={installedParts}
            />
          ),
        },
        {
          id: "future",
          label: "Future Parts",
          content: (
            <PartsList
              title="Future Parts"
              description="The next boxes waiting on the shelf."
              parts={futureParts}
            />
          ),
        },
        {
          id: "maintenance",
          label: "Maintenance",
          content: <MaintenanceLog entries={maintenance} />,
        },
        {
          id: "dyno",
          label: "Dyno",
          content: <DynoResults results={dynoResults} />,
        },
        {
          id: "times",
          label: "Quarter Mile",
          content: <QuarterMileTimes times={quarterMileTimes} />,
        },
        {
          id: "notes",
          label: "Notes",
          content: (
            <div className="premium-card p-6">
              <h3 className="font-[family-name:var(--font-instrument)] text-2xl">
                Notes
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-foreground-muted">
                {vehicle.notes || "No notes yet."}
              </p>
              <h4 className="mt-8 text-[11px] uppercase tracking-[0.18em] text-foreground-subtle">
                Future goals
              </h4>
              <ul className="mt-3 space-y-2">
                {(vehicle.futureGoals ?? []).map((goal) => (
                  <li key={goal} className="text-sm text-foreground-muted">
                    {goal}
                  </li>
                ))}
              </ul>
              <p className="mt-8 text-sm text-foreground">
                Current progress: {vehicle.progressPercent}%
              </p>
            </div>
          ),
        },
      ]}
    />
  );
}
