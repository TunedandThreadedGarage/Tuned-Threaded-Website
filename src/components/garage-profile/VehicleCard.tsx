import type { Vehicle } from "@/types/database";

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <article className="border border-border bg-surface p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-metal">
        {vehicle.is_primary ? "Primary" : "Vehicle"}
      </p>
      <h3 className="mt-2 font-[family-name:var(--font-display)] text-lg font-medium text-text">
        {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ")}
      </h3>
      {vehicle.trim ? (
        <p className="mt-1 text-sm text-text-muted">{vehicle.trim}</p>
      ) : null}
      {vehicle.notes ? (
        <p className="mt-3 text-sm leading-relaxed text-text-muted">{vehicle.notes}</p>
      ) : null}
    </article>
  );
}
