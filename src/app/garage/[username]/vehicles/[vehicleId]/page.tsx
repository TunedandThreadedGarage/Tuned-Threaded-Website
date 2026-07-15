import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { VehicleDetailTabs } from "@/features/garage/components/vehicle-detail-tabs";
import { VehicleProgressPanel } from "@/features/garage/components/vehicle-progress";
import {
  getTimelineComments,
  getVehicleDetail,
} from "@/lib/garage/queries";

type PageProps = {
  params: Promise<{ username: string; vehicleId: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username, vehicleId } = await params;
  const data = await getVehicleDetail(username, vehicleId);
  if (!data) return { title: "Vehicle not found" };
  const { vehicle } = data.detail;
  return {
    title: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    description: vehicle.notes,
  };
}

export default async function VehiclePage({ params }: PageProps) {
  const { username, vehicleId } = await params;
  const data = await getVehicleDetail(username, vehicleId);
  if (!data) notFound();

  const { profile, detail } = data;
  const {
    vehicle,
    timeline,
    installedParts,
    futureParts,
    maintenance,
    dynoResults,
    quarterMileTimes,
    photos,
  } = detail;

  const commentsEntries = await Promise.all(
    timeline.map(
      async (update) =>
        [update.id, await getTimelineComments(update.id)] as const,
    ),
  );
  const commentsByUpdate = Object.fromEntries(commentsEntries);

  return (
    <main className="flex-1 pb-20">
      <section className="relative">
        <div className="relative h-64 w-full md:h-[28rem]">
          <Image
            src={vehicle.photoUrl}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/10" />
        </div>

        <div className="relative mx-auto -mt-24 w-full max-w-7xl px-5 md:px-8">
          <Link
            href={`/garage/${username}`}
            className="mb-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-foreground-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to garage
          </Link>

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-foreground-subtle">
                {vehicle.year} · {vehicle.trim}
              </p>
              <h1 className="mt-2 font-[family-name:var(--font-instrument)] text-4xl tracking-tight md:text-6xl">
                {vehicle.make} {vehicle.model}
              </h1>
              <p className="mt-2 text-sm text-foreground-muted">
                Owned by{" "}
                <Link
                  href={`/garage/${profile.username}`}
                  className="text-foreground hover:underline"
                >
                  @{profile.username}
                </Link>
              </p>
            </div>
            <div className="text-sm text-foreground-muted">
              {vehicle.currentHorsepower} / {vehicle.targetHorsepower} hp
            </div>
          </div>

          <div className="mt-8">
            <VehicleProgressPanel
              vehicle={vehicle}
              accentColor={profile.accentColor}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto mt-12 w-full max-w-7xl px-5 md:px-8">
        <VehicleDetailTabs
          vehicle={vehicle}
          timeline={timeline}
          commentsByUpdate={commentsByUpdate}
          installedParts={installedParts}
          futureParts={futureParts}
          maintenance={maintenance}
          dynoResults={dynoResults}
          quarterMileTimes={quarterMileTimes}
          photos={photos}
        />
      </section>
    </main>
  );
}
