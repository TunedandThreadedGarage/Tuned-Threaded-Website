"use client";

import { ProgressBar } from "@/components/ui/progress-bar";
import { formatDate } from "@/lib/utils";
import type { Vehicle } from "@/types/garage";

export function VehicleProgressPanel({
  vehicle,
  accentColor,
}: {
  vehicle: Vehicle;
  accentColor?: string;
}) {
  return (
    <div className="premium-card p-6 md:p-7">
      <p className="text-[11px] uppercase tracking-[0.2em] text-foreground-subtle">
        Build Progress
      </p>
      <div className="mt-5 grid gap-5 sm:grid-cols-3">
        <Stat label="Current stage" value={vehicle.currentStage} />
        <Stat
          label="Upcoming stage"
          value={vehicle.upcomingStage ?? "—"}
        />
        <Stat
          label="Estimated completion"
          value={
            vehicle.estimatedCompletion
              ? formatDate(vehicle.estimatedCompletion)
              : "—"
          }
        />
      </div>
      <div className="mt-6">
        <ProgressBar
          value={vehicle.progressPercent}
          label="Completion"
          accentColor={accentColor}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.16em] text-foreground-subtle">
        {label}
      </p>
      <p className="mt-2 text-sm text-foreground md:text-base">{value}</p>
    </div>
  );
}
