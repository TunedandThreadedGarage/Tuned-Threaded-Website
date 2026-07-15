"use client";

import Link from "next/link";
import { useActionState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import {
  addModification,
  deleteVehicle,
  upsertVehicle,
  type ActionResult,
} from "@/features/vehicles/actions";
import { FormField, TextAreaField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import type { Modification, Vehicle } from "@/types/database";

const initial: ActionResult = {};

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

export function VehicleManager({
  vehicles,
  modifications,
  username,
}: {
  vehicles: Vehicle[];
  modifications: Modification[];
  username?: string | null;
}) {
  const [vehicleState, vehicleAction] = useActionState(upsertVehicle, initial);
  const [modState, modAction] = useActionState(addModification, initial);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        {vehicles.map((vehicle) => (
          <div key={vehicle.id} className="border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-[family-name:var(--font-display)] text-base font-medium text-text">
                  {[vehicle.year, vehicle.make, vehicle.model]
                    .filter(Boolean)
                    .join(" ")}
                </p>
                {vehicle.trim ? (
                  <p className="text-sm text-text-muted">{vehicle.trim}</p>
                ) : null}
                <p className="mt-1 text-xs text-text-muted">
                  {vehicle.build_stage ?? "No stage"} · {vehicle.progress_pct}%
                  {vehicle.current_hp != null
                    ? ` · ${vehicle.current_hp} hp`
                    : ""}
                </p>
                <ul className="mt-3 space-y-1 text-sm text-text-muted">
                  {modifications
                    .filter((m) => m.vehicle_id === vehicle.id)
                    .map((m) => (
                      <li key={m.id}>
                        · {m.title}
                        {m.status === "wishlist" ? " (future)" : ""}
                      </li>
                    ))}
                </ul>
                {username ? (
                  <Link
                    href={`/garage/${username}/vehicles/${vehicle.id}`}
                    className="mt-3 inline-block text-sm text-text underline"
                  >
                    Open vehicle page
                  </Link>
                ) : null}
              </div>
              <button
                type="button"
                disabled={pending}
                className="text-xs text-text-muted hover:text-accent"
                onClick={() =>
                  startTransition(async () => {
                    await deleteVehicle(vehicle.id);
                  })
                }
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <form
        action={vehicleAction}
        className="max-w-2xl space-y-3 border border-border p-5"
      >
        <p className="text-sm font-medium text-text">Add vehicle</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <FormField label="Year" name="year" type="number" />
          <FormField label="Make" name="make" required />
          <FormField label="Model" name="model" required />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Trim" name="trim" />
          <FormField label="Nickname" name="nickname" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Engine" name="engine" />
          <FormField label="Transmission" name="transmission" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <FormField label="Mileage" name="mileage" type="number" />
          <FormField label="Current HP" name="current_hp" type="number" />
          <FormField label="Target HP" name="target_hp" type="number" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Build stage" name="build_stage" />
          <FormField
            label="Progress %"
            name="progress_pct"
            type="number"
            defaultValue="0"
          />
        </div>
        <FormField label="Cover photo URL" name="photo_url" />
        <TextAreaField label="Notes / goals" name="notes" />
        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" name="is_primary" className="accent-accent" />
          Primary vehicle
        </label>
        {vehicleState.error ? (
          <p className="text-sm text-accent">{vehicleState.error}</p>
        ) : null}
        <Submit label="Add vehicle" />
      </form>

      {vehicles.length > 0 ? (
        <form
          action={modAction}
          className="max-w-xl space-y-3 border border-border p-5"
        >
          <p className="text-sm font-medium text-text">Add part</p>
          <label className="block text-sm text-text">
            <span className="font-medium">Vehicle</span>
            <select
              name="vehicle_id"
              required
              className="mt-1.5 w-full border border-border bg-bg px-3 py-2.5 text-sm text-text"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {[v.year, v.make, v.model].filter(Boolean).join(" ")}
                </option>
              ))}
            </select>
          </label>
          <FormField label="Title" name="title" required />
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Brand" name="part_brand" />
            <FormField label="Part #" name="part_number" />
          </div>
          <label className="block text-sm text-text">
            <span className="font-medium">Status</span>
            <select
              name="status"
              className="mt-1.5 w-full border border-border bg-bg px-3 py-2.5 text-sm text-text"
              defaultValue="installed"
            >
              <option value="installed">Installed</option>
              <option value="wishlist">Future / wishlist</option>
            </select>
          </label>
          <FormField label="Cost ($)" name="cost" type="number" />
          <TextAreaField label="Notes" name="description" />
          {modState.error ? (
            <p className="text-sm text-accent">{modState.error}</p>
          ) : null}
          <Submit label="Add part" />
        </form>
      ) : null}
    </div>
  );
}
