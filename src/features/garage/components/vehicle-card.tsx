"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatNumber } from "@/lib/utils";
import type { Vehicle } from "@/types/garage";

export function VehicleCard({
  vehicle,
  username,
  accentColor,
  index = 0,
}: {
  vehicle: Vehicle;
  username: string;
  accentColor?: string;
  index?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.55,
        delay: index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Link
        href={`/garage/${username}/vehicles/${vehicle.id}`}
        className="group block overflow-hidden rounded-[1.25rem] border border-border bg-background-elevated transition-colors hover:border-border-strong"
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={vehicle.photoUrl}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-foreground-muted">
              {vehicle.year}
            </p>
            <h3 className="font-[family-name:var(--font-instrument)] text-2xl text-foreground">
              {vehicle.make} {vehicle.model}
            </h3>
            <p className="text-sm text-foreground-muted">{vehicle.trim}</p>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Meta label="Engine" value={vehicle.engine} />
            <Meta label="Transmission" value={vehicle.transmission} />
            <Meta label="Mileage" value={`${formatNumber(vehicle.mileage)} mi`} />
            <Meta
              label="Horsepower"
              value={`${formatNumber(vehicle.currentHorsepower)} / ${formatNumber(vehicle.targetHorsepower)}`}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.14em]">
              <span className="text-foreground-subtle">Current stage</span>
              <span style={{ color: accentColor ?? "var(--accent)" }}>
                {vehicle.currentStage}
              </span>
            </div>
            <ProgressBar
              value={vehicle.progressPercent}
              showValue
              accentColor={accentColor}
            />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.14em] text-foreground-subtle">
        {label}
      </p>
      <p className="mt-1 text-foreground-muted">{value}</p>
    </div>
  );
}

export function VehicleGrid({
  vehicles,
  username,
  accentColor,
}: {
  vehicles: Vehicle[];
  username: string;
  accentColor?: string;
}) {
  return (
    <section className="mx-auto mt-16 w-full max-w-7xl px-5 md:px-8">
      <div className="mb-8">
        <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-foreground-subtle">
          Vehicles
        </p>
        <h2 className="font-[family-name:var(--font-instrument)] text-3xl tracking-tight md:text-4xl">
          In the garage
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-foreground-muted md:text-base">
          Every vehicle gets its own card, progress, and dedicated build page.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {vehicles.map((vehicle, index) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            username={username}
            accentColor={accentColor}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}
