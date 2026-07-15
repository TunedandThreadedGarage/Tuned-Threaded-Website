"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  addDynoResult,
  addMaintenanceLog,
  addQuarterMileTime,
  addTimelineEntry,
  upsertVehicle,
  type ActionResult,
} from "@/features/vehicles/actions";
import { FormField, TextAreaField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import type { Vehicle } from "@/types/database";

const initial: ActionResult = {};

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

export function VehicleOwnerForms({ vehicle }: { vehicle: Vehicle }) {
  const [timelineState, timelineAction] = useActionState(
    addTimelineEntry,
    initial,
  );
  const [maintState, maintAction] = useActionState(addMaintenanceLog, initial);
  const [dynoState, dynoAction] = useActionState(addDynoResult, initial);
  const [etState, etAction] = useActionState(addQuarterMileTime, initial);
  const [updateState, updateAction] = useActionState(upsertVehicle, initial);

  return (
    <div className="space-y-8">
      <form
        action={updateAction}
        className="grid gap-3 border border-border p-4 sm:grid-cols-2"
      >
        <p className="sm:col-span-2 text-sm font-medium text-text">
          Update vehicle
        </p>
        <input type="hidden" name="id" value={vehicle.id} />
        <FormField label="Make" name="make" defaultValue={vehicle.make} required />
        <FormField
          label="Model"
          name="model"
          defaultValue={vehicle.model}
          required
        />
        <FormField
          label="Year"
          name="year"
          type="number"
          defaultValue={vehicle.year?.toString() ?? ""}
        />
        <FormField
          label="Trim"
          name="trim"
          defaultValue={vehicle.trim ?? ""}
        />
        <FormField
          label="Engine"
          name="engine"
          defaultValue={vehicle.engine ?? ""}
        />
        <FormField
          label="Transmission"
          name="transmission"
          defaultValue={vehicle.transmission ?? ""}
        />
        <FormField
          label="Current HP"
          name="current_hp"
          type="number"
          defaultValue={vehicle.current_hp?.toString() ?? ""}
        />
        <FormField
          label="Target HP"
          name="target_hp"
          type="number"
          defaultValue={vehicle.target_hp?.toString() ?? ""}
        />
        <FormField
          label="Build stage"
          name="build_stage"
          defaultValue={vehicle.build_stage ?? ""}
        />
        <FormField
          label="Progress %"
          name="progress_pct"
          type="number"
          defaultValue={String(vehicle.progress_pct ?? 0)}
        />
        <FormField
          label="Mileage"
          name="mileage"
          type="number"
          defaultValue={vehicle.mileage?.toString() ?? ""}
        />
        <FormField
          label="Photo URL"
          name="photo_url"
          defaultValue={vehicle.photo_url ?? ""}
        />
        <div className="sm:col-span-2">
          <TextAreaField
            label="Notes / goals"
            name="notes"
            defaultValue={vehicle.notes ?? ""}
          />
        </div>
        {updateState.error ? (
          <p className="sm:col-span-2 text-sm text-accent">{updateState.error}</p>
        ) : null}
        <div className="sm:col-span-2">
          <Submit label="Save vehicle" />
        </div>
      </form>

      <form action={timelineAction} className="space-y-3 border border-border p-4">
        <p className="text-sm font-medium text-text">Add timeline update</p>
        <input type="hidden" name="vehicle_id" value={vehicle.id} />
        <FormField label="Title" name="title" required />
        <FormField label="Date" name="entry_date" type="date" />
        <TextAreaField label="Description" name="description" />
        <TextAreaField
          label="Parts installed"
          name="parts_installed"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Cost ($)" name="cost" type="number" />
          <FormField label="Hours" name="hours_spent" type="number" />
        </div>
        <FormField label="Video URL" name="video_url" />
        <TextAreaField
          label="Photo URLs (one per line)"
          name="photos"
        />
        {timelineState.error ? (
          <p className="text-sm text-accent">{timelineState.error}</p>
        ) : null}
        <Submit label="Add update" />
      </form>

      <form action={maintAction} className="space-y-3 border border-border p-4">
        <p className="text-sm font-medium text-text">Maintenance log</p>
        <input type="hidden" name="vehicle_id" value={vehicle.id} />
        <FormField label="Title" name="title" required />
        <FormField label="Date" name="service_date" type="date" />
        <FormField label="Mileage" name="mileage" type="number" />
        <FormField label="Cost ($)" name="cost" type="number" />
        <TextAreaField label="Notes" name="notes" />
        {maintState.error ? (
          <p className="text-sm text-accent">{maintState.error}</p>
        ) : null}
        <Submit label="Add maintenance" />
      </form>

      <div className="grid gap-4 lg:grid-cols-2">
        <form action={dynoAction} className="space-y-3 border border-border p-4">
          <p className="text-sm font-medium text-text">Dyno result</p>
          <input type="hidden" name="vehicle_id" value={vehicle.id} />
          <FormField label="Date" name="result_date" type="date" />
          <FormField label="WHP" name="whp" type="number" />
          <FormField label="WTQ" name="wtq" type="number" />
          <TextAreaField label="Notes" name="notes" />
          {dynoState.error ? (
            <p className="text-sm text-accent">{dynoState.error}</p>
          ) : null}
          <Submit label="Add dyno" />
        </form>
        <form action={etAction} className="space-y-3 border border-border p-4">
          <p className="text-sm font-medium text-text">Quarter mile</p>
          <input type="hidden" name="vehicle_id" value={vehicle.id} />
          <FormField label="Date" name="result_date" type="date" />
          <FormField label="ET (sec)" name="et_seconds" type="number" />
          <FormField label="Trap MPH" name="trap_mph" type="number" />
          <TextAreaField label="Notes" name="notes" />
          {etState.error ? (
            <p className="text-sm text-accent">{etState.error}</p>
          ) : null}
          <Submit label="Add time" />
        </form>
      </div>
    </div>
  );
}
