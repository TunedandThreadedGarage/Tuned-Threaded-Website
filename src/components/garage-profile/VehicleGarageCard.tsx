import Image from "next/image";
import Link from "next/link";
import type { Vehicle } from "@/types/database";
import { ProgressBar } from "@/components/garage-profile/ProgressBar";

export function VehicleGarageCard({
  vehicle,
  href,
}: {
  vehicle: Vehicle;
  href: string;
}) {
  const title =
    vehicle.nickname ||
    [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ");

  return (
    <Link
      href={href}
      className="group block border border-border bg-surface transition-colors hover:border-metal/30"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-elevated">
        {vehicle.photo_url ? (
          <Image
            src={vehicle.photo_url}
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
      <div className="space-y-3 p-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-metal">
            {vehicle.is_primary ? "Primary" : "Vehicle"}
          </p>
          <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg font-medium text-text">
            {title}
          </h3>
          {vehicle.trim ? (
            <p className="text-sm text-text-muted">{vehicle.trim}</p>
          ) : null}
        </div>

        <dl className="grid grid-cols-2 gap-2 text-xs text-text-muted">
          {vehicle.engine ? (
            <div>
              <dt className="font-mono uppercase tracking-[0.12em] text-metal">
                Engine
              </dt>
              <dd className="mt-0.5 text-text">{vehicle.engine}</dd>
            </div>
          ) : null}
          {vehicle.transmission ? (
            <div>
              <dt className="font-mono uppercase tracking-[0.12em] text-metal">
                Trans
              </dt>
              <dd className="mt-0.5 text-text">{vehicle.transmission}</dd>
            </div>
          ) : null}
          {vehicle.mileage != null ? (
            <div>
              <dt className="font-mono uppercase tracking-[0.12em] text-metal">
                Mileage
              </dt>
              <dd className="mt-0.5 text-text">
                {vehicle.mileage.toLocaleString()} mi
              </dd>
            </div>
          ) : null}
          {vehicle.current_hp != null || vehicle.target_hp != null ? (
            <div>
              <dt className="font-mono uppercase tracking-[0.12em] text-metal">
                HP
              </dt>
              <dd className="mt-0.5 text-text">
                {vehicle.current_hp ?? "—"}
                {vehicle.target_hp != null ? ` / ${vehicle.target_hp}` : ""}
              </dd>
            </div>
          ) : null}
        </dl>

        {vehicle.build_stage ? (
          <p className="text-sm text-text-muted">
            Stage: <span className="text-text">{vehicle.build_stage}</span>
          </p>
        ) : null}

        <ProgressBar value={vehicle.progress_pct} label="Progress" />
      </div>
    </Link>
  );
}
