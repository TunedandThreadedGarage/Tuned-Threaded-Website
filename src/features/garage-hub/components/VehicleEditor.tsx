"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import type { Modification, Vehicle, VehiclePhoto } from "@/types/database";
import {
  addModification,
  addVehiclePhoto,
  deleteModification,
  deleteVehicle,
  deleteVehiclePhoto,
  setVehicleCoverPhoto,
  upsertVehicle,
  type ActionResult,
} from "@/features/vehicles/actions";
import { MediaUpload } from "@/components/media/MediaUpload";
import { FormField, TextAreaField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { useGarageHub } from "@/features/garage-hub/GarageHubContext";

const initial: ActionResult = {};

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

function vehicleToDraft(v: Vehicle | null): Record<string, string> {
  if (!v) {
    return {
      year: "",
      make: "",
      model: "",
      trim: "",
      nickname: "",
      engine: "",
      transmission: "",
      drivetrain: "",
      horsepower: "",
      mileage: "",
      vin: "",
      paint_color: "",
      notes: "",
      is_primary: "",
      build_stage: "",
      progress_pct: "0",
      target_hp: "",
    };
  }
  return {
    id: v.id,
    year: v.year != null ? String(v.year) : "",
    make: v.make ?? "",
    model: v.model ?? "",
    trim: v.trim ?? "",
    nickname: v.nickname ?? "",
    engine: v.engine ?? "",
    transmission: v.transmission ?? "",
    drivetrain: v.drivetrain ?? "",
    horsepower: v.current_hp != null ? String(v.current_hp) : "",
    mileage: v.mileage != null ? String(v.mileage) : "",
    vin: v.vin ?? "",
    paint_color: v.paint_color ?? "",
    notes: v.notes ?? "",
    is_primary: v.is_primary ? "on" : "",
    build_stage: v.build_stage ?? "",
    progress_pct: String(v.progress_pct ?? 0),
    target_hp: v.target_hp != null ? String(v.target_hp) : "",
    photo_url: v.photo_url ?? "",
  };
}

export function VehicleEditor({
  vehicle,
  photos,
  modifications,
  userId,
  onSaved,
}: {
  vehicle: Vehicle | null;
  photos: VehiclePhoto[];
  modifications: Modification[];
  userId: string;
  onSaved?: () => void;
}) {
  const { closeEditor, openEditor, setDirty, draftSnapshot, setDraftSnapshot, editor } =
    useGarageHub();
  const [state, formAction] = useActionState(upsertVehicle, initial);
  const [modState, modAction] = useActionState(addModification, initial);
  const [pending, start] = useTransition();
  const [localPhotos, setLocalPhotos] = useState(photos);
  const [coverUrl, setCoverUrl] = useState(vehicle?.photo_url ?? null);
  const [status, setStatus] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const seed = useMemo(() => {
    if (draftSnapshot && (draftSnapshot.id || "") === (vehicle?.id ?? "")) {
      return draftSnapshot;
    }
    if (draftSnapshot && editor === "new" && !vehicle) return draftSnapshot;
    return vehicleToDraft(vehicle);
  }, [draftSnapshot, vehicle, editor]);

  // Adjust local copies when the server props change (during render, not in
  // an effect, to avoid cascading renders).
  const [prevPhotos, setPrevPhotos] = useState(photos);
  if (prevPhotos !== photos) {
    setPrevPhotos(photos);
    setLocalPhotos(photos);
  }
  const [prevVehicle, setPrevVehicle] = useState(vehicle);
  if (prevVehicle !== vehicle) {
    setPrevVehicle(vehicle);
    setCoverUrl(vehicle?.photo_url ?? null);
  }
  const [prevActionState, setPrevActionState] = useState(state);
  if (prevActionState !== state) {
    setPrevActionState(state);
    if (state.success) setStatus("Vehicle saved.");
  }

  useEffect(() => {
    if (state.success) {
      setDirty(false);
      setDraftSnapshot(null);
      onSaved?.();
      if (editor === "new" && state.id) {
        openEditor(state.id);
      }
    }
  }, [state, setDirty, setDraftSnapshot, onSaved, editor, openEditor]);

  function captureDraft() {
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    const snap: Record<string, string> = {};
    data.forEach((value, key) => {
      snap[key] = String(value);
    });
    setDraftSnapshot(snap);
  }

  function markDirty() {
    setDirty(true);
    captureDraft();
  }

  const vehicleId = vehicle?.id ?? state.id ?? null;

  return (
    <div className="space-y-8 border border-border bg-surface/20 p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-metal">
            Vehicle editor
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-text">
            {vehicle
              ? [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ")
              : "Add vehicle"}
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Save without leaving the Garage. Drafts stay if you switch sections.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            captureDraft();
            closeEditor();
          }}
          className="text-sm text-text-muted hover:text-text"
        >
          Close
        </button>
      </div>

      <form
        ref={formRef}
        action={formAction}
        className="space-y-4"
        onChange={markDirty}
        onInput={markDirty}
      >
        {seed.id ? <input type="hidden" name="id" value={seed.id} /> : null}
        <input type="hidden" name="photo_url" value={coverUrl ?? ""} />

        <div className="grid gap-3 sm:grid-cols-4">
          <FormField label="Year" name="year" type="number" defaultValue={seed.year} />
          <FormField label="Make" name="make" required defaultValue={seed.make} />
          <FormField label="Model" name="model" required defaultValue={seed.model} />
          <FormField label="Trim" name="trim" defaultValue={seed.trim} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Nickname" name="nickname" defaultValue={seed.nickname} />
          <FormField
            label="Paint color"
            name="paint_color"
            defaultValue={seed.paint_color}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Engine" name="engine" defaultValue={seed.engine} />
          <FormField
            label="Transmission"
            name="transmission"
            defaultValue={seed.transmission}
          />
          <FormField
            label="Drivetrain"
            name="drivetrain"
            defaultValue={seed.drivetrain}
            placeholder="RWD / AWD / FWD"
          />
          <FormField
            label="Horsepower"
            name="current_hp"
            type="number"
            defaultValue={seed.horsepower}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <FormField
            label="Mileage"
            name="mileage"
            type="number"
            defaultValue={seed.mileage}
          />
          <FormField
            label="VIN (private)"
            name="vin"
            defaultValue={seed.vin}
            placeholder="Optional — only you see this"
            hint="Private — only you can see this"
          />
          <FormField
            label="Target HP"
            name="target_hp"
            type="number"
            defaultValue={seed.target_hp}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            label="Build stage"
            name="build_stage"
            defaultValue={seed.build_stage}
          />
          <FormField
            label="Progress %"
            name="progress_pct"
            type="number"
            defaultValue={seed.progress_pct || "0"}
          />
        </div>

        <TextAreaField
          label="Notes"
          name="notes"
          defaultValue={seed.notes}
          placeholder="Goals, history, setup notes…"
        />

        <label className="flex items-center gap-2 text-sm text-text">
          <input
            type="checkbox"
            name="is_primary"
            className="accent-accent"
            defaultChecked={seed.is_primary === "on"}
          />
          Primary vehicle
        </label>

        {state.error ? <p className="text-sm text-accent">{state.error}</p> : null}
        {status ? <p className="text-sm text-text-muted">{status}</p> : null}

        <div className="flex flex-wrap gap-3">
          <Submit label={vehicle ? "Save vehicle" : "Create vehicle"} />
          {vehicle ? (
            <button
              type="button"
              disabled={pending}
              className="border border-border px-4 py-2 text-sm text-text-muted hover:text-accent"
              onClick={() => {
                if (!window.confirm("Delete this vehicle permanently?")) return;
                start(async () => {
                  await deleteVehicle(vehicle.id);
                  setDirty(false);
                  setDraftSnapshot(null);
                  closeEditor();
                  onSaved?.();
                });
              }}
            >
              Delete vehicle
            </button>
          ) : null}
        </div>
      </form>

      {vehicleId ? (
        <section className="space-y-4 border-t border-border pt-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-metal">
              Photos
            </p>
            <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg text-text">
              Cover & gallery
            </h3>
          </div>

          <div className="relative aspect-[16/10] max-w-lg overflow-hidden bg-surface">
            {coverUrl ? (
              <Image src={coverUrl} alt="" fill className="object-cover" sizes="520px" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-text-muted">
                No cover photo
              </div>
            )}
          </div>

          <MediaUpload
            bucket="garage"
            pathPrefix={`${userId}/vehicles/${vehicleId}`}
            accept="image"
            multiple
            maxFiles={12}
            label="Upload vehicle photos"
            onUploaded={async (files) => {
              for (const file of files) {
                await addVehiclePhoto({
                  vehicleId,
                  url: file.publicUrl,
                  storagePath: file.storagePath,
                });
                setLocalPhotos((prev) => [
                  {
                    id: `temp-${file.publicUrl}`,
                    vehicle_id: vehicleId,
                    user_id: userId,
                    storage_path: file.storagePath,
                    url: file.publicUrl,
                    caption: null,
                    sort_order: 0,
                    is_cover: false,
                    created_at: new Date().toISOString(),
                  },
                  ...prev,
                ]);
              }
              if (!coverUrl && files[0]) {
                await setVehicleCoverPhoto({
                  vehicleId,
                  photoUrl: files[0].publicUrl,
                });
                setCoverUrl(files[0].publicUrl);
              }
              setStatus("Photos uploaded.");
              onSaved?.();
            }}
          />

          {localPhotos.length > 0 ? (
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {localPhotos.map((photo) => {
                const isCover = coverUrl === photo.url;
                return (
                  <li key={photo.id} className="relative aspect-square overflow-hidden bg-surface">
                    <Image src={photo.url} alt="" fill className="object-cover" sizes="160px" />
                    <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-black/55 p-1">
                      <button
                        type="button"
                        className="flex-1 px-1 py-1 text-[10px] text-white hover:bg-white/10"
                        onClick={() =>
                          start(async () => {
                            await setVehicleCoverPhoto({
                              vehicleId,
                              photoUrl: photo.url,
                              photoId: photo.id,
                            });
                            setCoverUrl(photo.url);
                          })
                        }
                      >
                        {isCover ? "Cover" : "Set cover"}
                      </button>
                      <button
                        type="button"
                        className="px-1 py-1 text-[10px] text-white/80 hover:text-accent"
                        onClick={() =>
                          start(async () => {
                            if (photo.id.startsWith("temp-")) return;
                            await deleteVehiclePhoto(photo.id);
                            setLocalPhotos((prev) =>
                              prev.filter((p) => p.id !== photo.id),
                            );
                            if (coverUrl === photo.url) setCoverUrl(null);
                          })
                        }
                      >
                        Del
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>
      ) : (
        <p className="text-sm text-text-muted">
          Create the vehicle first, then upload photos and modifications.
        </p>
      )}

      {vehicleId ? (
        <section className="space-y-4 border-t border-border pt-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-metal">
              Modifications
            </p>
            <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg text-text">
              Parts list
            </h3>
          </div>

          <ul className="divide-y divide-border border border-border">
            {modifications.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <div>
                  <p className="text-text">{m.title}</p>
                  <p className="text-xs text-text-muted">
                    {m.status}
                    {m.part_brand ? ` · ${m.part_brand}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs text-text-muted hover:text-accent"
                  onClick={() =>
                    start(async () => {
                      await deleteModification(m.id);
                      onSaved?.();
                    })
                  }
                >
                  Remove
                </button>
              </li>
            ))}
            {modifications.length === 0 ? (
              <li className="px-4 py-4 text-sm text-text-muted">No mods yet.</li>
            ) : null}
          </ul>

          <form action={modAction} className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="vehicle_id" value={vehicleId} />
            <FormField label="Part title" name="title" required />
            <FormField label="Brand" name="part_brand" />
            <label className="block text-sm text-text-muted">
              Status
              <select
                name="status"
                defaultValue="installed"
                className="mt-2 w-full border border-border bg-surface px-3 py-2.5 text-sm text-text"
              >
                <option value="installed">Installed</option>
                <option value="wishlist">Wishlist</option>
              </select>
            </label>
            <FormField label="Cost ($)" name="cost" type="number" />
            <div className="sm:col-span-2">
              <TextAreaField label="Notes" name="description" />
            </div>
            {modState.error ? (
              <p className="text-sm text-accent sm:col-span-2">{modState.error}</p>
            ) : null}
            <div className="sm:col-span-2">
              <Button type="submit" variant="secondary">
                Add modification
              </Button>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}
