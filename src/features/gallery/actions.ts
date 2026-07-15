"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  evaluateAndAwardBadges,
  refreshReputationCache,
} from "@/lib/garage-badges";
import type { AlbumCategory } from "@/types/database";

export type ActionResult = { error?: string; success?: boolean };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return { supabase, user };
}

export async function createAlbum(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return { error: "Album name is required." };
    const category = (String(formData.get("category") ?? "general") ||
      "general") as AlbumCategory;

    const { error } = await supabase.from("garage_albums").insert({
      user_id: user.id,
      name,
      category,
      is_public: formData.get("is_public") === "on",
    });
    if (error) return { error: error.message };
    revalidatePath("/garage/gallery");
    revalidatePath("/garage");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function addGalleryPhoto(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const albumId = String(formData.get("album_id") ?? "");
    const url = String(formData.get("url") ?? "").trim();
    if (!albumId || !url) return { error: "Album and photo URL are required." };

    const category = (String(formData.get("category") ?? "general") ||
      "general") as AlbumCategory;

    const { error } = await supabase.from("garage_photos").insert({
      album_id: albumId,
      user_id: user.id,
      url,
      storage_path: `url/${Date.now()}`,
      caption: String(formData.get("caption") ?? "").trim() || null,
      category,
      sort_order: 0,
    });
    if (error) return { error: error.message };

    await evaluateAndAwardBadges(supabase, user.id);
    await refreshReputationCache(supabase, user.id);
    revalidatePath("/garage/gallery");
    revalidatePath("/garage");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}

export async function deleteAlbum(albumId: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from("garage_albums")
      .delete()
      .eq("id", albumId)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
    revalidatePath("/garage/gallery");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed." };
  }
}
