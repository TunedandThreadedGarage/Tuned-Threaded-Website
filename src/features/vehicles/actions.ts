"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  evaluateAndAwardBadges,
  refreshReputationCache,
} from "@/lib/garage-badges";
import type { ModStatus } from "@/types/database";

export type ActionResult = { error?: string; success?: boolean };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return { supabase, user };
}

function numOrNull(raw: string): number | null {
  if (!raw.trim()) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function revalidateVehicle(username: string | null | undefined, vehicleId: string) {
  revalidatePath("/garage");
  revalidatePath("/garage/settings");
  if (username) {
    revalidatePath(`/garage/${username}`);
    revalidatePath(`/garage/${username}/vehicles/${vehicleId}`);
  }
}

export async function upsertVehicle(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const id = String(formData.get("id") ?? "").trim();
    const make = String(formData.get("make") ?? "").trim();
    const model = String(formData.get("model") ?? "").trim();
    if (!make || !model) return { error: "Make and model are required." };

    const payload = {
      user_id: user.id,
      make,
      model,
      year: numOrNull(String(formData.get("year") ?? "")),
      trim: String(formData.get("trim") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
      nickname: String(formData.get("nickname") ?? "").trim() || null,
      engine: String(formData.get("engine") ?? "").trim() || null,
      transmission: String(formData.get("transmission") ?? "").trim() || null,
      mileage: numOrNull(String(formData.get("mileage") ?? "")),
      current_hp: numOrNull(String(formData.get("current_hp") ?? "")),
      target_hp: numOrNull(String(formData.get("target_hp") ?? "")),
      build_stage: String(formData.get("build_stage") ?? "").trim() || null,
      progress_pct: Math.max(
        0,
        Math.min(100, numOrNull(String(formData.get("progress_pct") ?? "")) ?? 0),
      ),
      photo_url: String(formData.get("photo_url") ?? "").trim() || null,
      is_primary: formData.get("is_primary") === "on",
    };

    let vehicleId = id;
    if (id) {
      const { error } = await supabase
        .from("vehicles")
        .update(payload)
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) return { error: error.message };
    } else {
      const { data, error } = await supabase
        .from("vehicles")
        .insert(payload)
        .select("id")
        .single();
      if (error) return { error: error.message };
      vehicleId = data.id;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();

    await evaluateAndAwardBadges(supabase, user.id);
    await refreshReputationCache(supabase, user.id);
    revalidateVehicle(profile?.username, vehicleId);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function deleteVehicle(vehicleId: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from("vehicles")
      .delete()
      .eq("id", vehicleId)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
    revalidatePath("/garage");
    revalidatePath("/garage/settings");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function addModification(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const vehicleId = String(formData.get("vehicle_id") ?? "");
    const title = String(formData.get("title") ?? "").trim();
    const status = (String(formData.get("status") ?? "installed") ||
      "installed") as ModStatus;
    if (!vehicleId || !title) return { error: "Vehicle and title are required." };

    const { error } = await supabase.from("modifications").insert({
      vehicle_id: vehicleId,
      user_id: user.id,
      title,
      description: String(formData.get("description") ?? "").trim() || null,
      status,
      part_brand: String(formData.get("part_brand") ?? "").trim() || null,
      part_number: String(formData.get("part_number") ?? "").trim() || null,
      cost_cents: (() => {
        const dollars = numOrNull(String(formData.get("cost") ?? ""));
        return dollars == null ? null : Math.round(dollars * 100);
      })(),
    });
    if (error) return { error: error.message };

    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();
    await evaluateAndAwardBadges(supabase, user.id);
    revalidateVehicle(profile?.username, vehicleId);
    revalidatePath("/garage/settings");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function deleteModification(id: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from("modifications")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
    revalidatePath("/garage/settings");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function addTimelineEntry(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const vehicleId = String(formData.get("vehicle_id") ?? "");
    const title = String(formData.get("title") ?? "").trim();
    if (!vehicleId || !title) return { error: "Title is required." };

    const photoRaw = String(formData.get("photos") ?? "").trim();
    const photos = photoRaw
      ? photoRaw
          .split("\n")
          .map((p) => p.trim())
          .filter(Boolean)
      : [];

    const cost = numOrNull(String(formData.get("cost") ?? ""));
    const hours = numOrNull(String(formData.get("hours_spent") ?? ""));

    const { error } = await supabase.from("vehicle_timeline_entries").insert({
      vehicle_id: vehicleId,
      user_id: user.id,
      build_id: String(formData.get("build_id") ?? "").trim() || null,
      title,
      description: String(formData.get("description") ?? "").trim() || null,
      entry_date:
        String(formData.get("entry_date") ?? "").trim() ||
        new Date().toISOString().slice(0, 10),
      photos,
      video_url: String(formData.get("video_url") ?? "").trim() || null,
      parts_installed:
        String(formData.get("parts_installed") ?? "").trim() || null,
      cost_cents: cost == null ? null : Math.round(cost * 100),
      hours_spent: hours,
    });
    if (error) return { error: error.message };

    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();
    await evaluateAndAwardBadges(supabase, user.id);
    await refreshReputationCache(supabase, user.id);
    revalidateVehicle(profile?.username, vehicleId);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function addMaintenanceLog(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const vehicleId = String(formData.get("vehicle_id") ?? "");
    const title = String(formData.get("title") ?? "").trim();
    if (!vehicleId || !title) return { error: "Title is required." };
    const cost = numOrNull(String(formData.get("cost") ?? ""));

    const { error } = await supabase.from("vehicle_maintenance_logs").insert({
      vehicle_id: vehicleId,
      user_id: user.id,
      title,
      notes: String(formData.get("notes") ?? "").trim() || null,
      service_date:
        String(formData.get("service_date") ?? "").trim() ||
        new Date().toISOString().slice(0, 10),
      mileage: numOrNull(String(formData.get("mileage") ?? "")),
      cost_cents: cost == null ? null : Math.round(cost * 100),
    });
    if (error) return { error: error.message };

    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();
    revalidateVehicle(profile?.username, vehicleId);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function addDynoResult(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const vehicleId = String(formData.get("vehicle_id") ?? "");
    if (!vehicleId) return { error: "Vehicle required." };

    const { error } = await supabase.from("vehicle_dyno_results").insert({
      vehicle_id: vehicleId,
      user_id: user.id,
      result_date:
        String(formData.get("result_date") ?? "").trim() ||
        new Date().toISOString().slice(0, 10),
      whp: numOrNull(String(formData.get("whp") ?? "")),
      wtq: numOrNull(String(formData.get("wtq") ?? "")),
      notes: String(formData.get("notes") ?? "").trim() || null,
    });
    if (error) return { error: error.message };

    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();
    revalidateVehicle(profile?.username, vehicleId);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function addQuarterMileTime(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const vehicleId = String(formData.get("vehicle_id") ?? "");
    if (!vehicleId) return { error: "Vehicle required." };

    const { error } = await supabase.from("vehicle_quarter_mile_times").insert({
      vehicle_id: vehicleId,
      user_id: user.id,
      result_date:
        String(formData.get("result_date") ?? "").trim() ||
        new Date().toISOString().slice(0, 10),
      et_seconds: numOrNull(String(formData.get("et_seconds") ?? "")),
      trap_mph: numOrNull(String(formData.get("trap_mph") ?? "")),
      notes: String(formData.get("notes") ?? "").trim() || null,
    });
    if (error) return { error: error.message };

    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();
    revalidateVehicle(profile?.username, vehicleId);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function addVehiclePhoto(input: {
  vehicleId: string;
  url: string;
  storagePath: string;
  caption?: string;
}): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase.from("vehicle_photos").insert({
      vehicle_id: input.vehicleId,
      user_id: user.id,
      url: input.url,
      storage_path: input.storagePath,
      caption: input.caption ?? null,
      sort_order: 0,
    });
    if (error) return { error: error.message };

    await evaluateAndAwardBadges(supabase, user.id);
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();
    revalidateVehicle(profile?.username, input.vehicleId);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function updateVehiclePhotoUrl(
  vehicleId: string,
  photoUrl: string,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from("vehicles")
      .update({ photo_url: photoUrl })
      .eq("id", vehicleId)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
    revalidatePath("/garage");
    revalidatePath("/garage/settings");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}
