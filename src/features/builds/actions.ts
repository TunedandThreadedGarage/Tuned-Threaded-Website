"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  evaluateAndAwardBadges,
  refreshReputationCache,
} from "@/lib/garage-badges";
import type { BuildStatus } from "@/types/database";

export type ActionResult = { error?: string; success?: boolean };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return { supabase, user };
}

export async function createJournalEntry(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const title = String(formData.get("title") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    const entry_date = String(formData.get("entry_date") ?? "") || undefined;
    if (!title) return { error: "Title is required." };

    const { error } = await supabase.from("journal_entries").insert({
      user_id: user.id,
      title,
      body: body || null,
      ...(entry_date ? { entry_date } : {}),
    });
    if (error) return { error: error.message };
    revalidatePath("/garage/journal");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function deleteJournalEntry(id: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from("journal_entries")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
    revalidatePath("/garage/journal");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function createBuild(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const title = String(formData.get("title") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    const vehicleId = String(formData.get("vehicle_id") ?? "").trim();
    const isPublic = formData.get("is_public") === "on";
    const progressRaw = String(formData.get("progress_pct") ?? "").trim();
    const progress_pct = Math.max(
      0,
      Math.min(100, progressRaw ? Number(progressRaw) : 0),
    );
    const status = (String(formData.get("status") ?? "active") ||
      "active") as BuildStatus;

    if (!title) return { error: "Title is required." };

    const { data, error } = await supabase
      .from("builds")
      .insert({
        user_id: user.id,
        title,
        body: body || null,
        vehicle_id: vehicleId || null,
        is_public: isPublic,
        progress_pct,
        current_stage:
          String(formData.get("current_stage") ?? "").trim() || null,
        upcoming_stage:
          String(formData.get("upcoming_stage") ?? "").trim() || null,
        estimated_completion:
          String(formData.get("estimated_completion") ?? "").trim() || null,
        status,
      })
      .select("id")
      .single();

    if (error) return { error: error.message };
    await evaluateAndAwardBadges(supabase, user.id);
    await refreshReputationCache(supabase, user.id);
    revalidatePath("/garage/builds");
    revalidatePath("/garage");
    redirect(`/garage/builds/${data.id}`);
  } catch (e) {
    // redirect throws — rethrow redirect
    if (e && typeof e === "object" && "digest" in e) throw e;
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function updateBuild(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const id = String(formData.get("id") ?? "").trim();
    if (!id) return { error: "Build id is required." };

    const progressRaw = String(formData.get("progress_pct") ?? "").trim();
    const progress_pct = Math.max(
      0,
      Math.min(100, progressRaw ? Number(progressRaw) : 0),
    );
    const status = (String(formData.get("status") ?? "active") ||
      "active") as BuildStatus;
    const isPublic = formData.get("is_public") === "on";

    const title = String(formData.get("title") ?? "").trim();
    if (!title) return { error: "Title is required." };

    const { error } = await supabase
      .from("builds")
      .update({
        title,
        body: String(formData.get("body") ?? "").trim() || null,
        progress_pct,
        current_stage:
          String(formData.get("current_stage") ?? "").trim() || null,
        upcoming_stage:
          String(formData.get("upcoming_stage") ?? "").trim() || null,
        estimated_completion:
          String(formData.get("estimated_completion") ?? "").trim() || null,
        status,
        is_public: isPublic,
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };
    await evaluateAndAwardBadges(supabase, user.id);
    await refreshReputationCache(supabase, user.id);
    revalidatePath(`/garage/builds/${id}`);
    revalidatePath("/garage/builds");
    revalidatePath("/garage");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function deleteBuild(id: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from("builds")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
    revalidatePath("/garage/builds");
    revalidatePath("/garage");
    redirect("/garage/builds");
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function addBuildPhoto(input: {
  buildId: string;
  url: string;
  storagePath: string;
}): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase.from("build_photos").insert({
      build_id: input.buildId,
      user_id: user.id,
      url: input.url,
      storage_path: input.storagePath,
      sort_order: 0,
    });
    if (error) return { error: error.message };
    await evaluateAndAwardBadges(supabase, user.id);
    revalidatePath(`/garage/builds/${input.buildId}`);
    revalidatePath(`/builds/${input.buildId}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function addBuildVideo(input: {
  buildId: string;
  url: string;
  caption?: string;
}): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase.from("build_videos").insert({
      build_id: input.buildId,
      user_id: user.id,
      url: input.url,
      caption: input.caption ?? null,
      sort_order: 0,
    });
    if (error) return { error: error.message };
    revalidatePath(`/garage/builds/${input.buildId}`);
    revalidatePath(`/builds/${input.buildId}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}
