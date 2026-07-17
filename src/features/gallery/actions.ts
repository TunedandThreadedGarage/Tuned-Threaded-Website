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
    if (!albumId || !url) return { error: "Album and photo are required." };

    const category = (String(formData.get("category") ?? "general") ||
      "general") as AlbumCategory;
    const storagePath =
      String(formData.get("storage_path") ?? "").trim() ||
      `${user.id}/gallery/${albumId}/${Date.now()}`;

    const { error } = await supabase.from("garage_photos").insert({
      album_id: albumId,
      user_id: user.id,
      url,
      storage_path: storagePath,
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

export async function toggleGalleryPhotoLike(
  photoId: string,
): Promise<{ liked: boolean; error?: string }> {
  try {
    const { supabase, user } = await requireUser();
    const { data: photo } = await supabase
      .from("garage_photos")
      .select("id, user_id, album_id")
      .eq("id", photoId)
      .maybeSingle();
    if (!photo) return { liked: false, error: "Photo not found." };

    const { data: existing } = await supabase
      .from("garage_photo_likes")
      .select("photo_id")
      .eq("photo_id", photoId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("garage_photo_likes")
        .delete()
        .eq("photo_id", photoId)
        .eq("user_id", user.id);
      revalidatePath("/garage/gallery");
      return { liked: false };
    }

    await supabase.from("garage_photo_likes").insert({
      photo_id: photoId,
      user_id: user.id,
    });

    if (photo.user_id !== user.id) {
      const { actorLabel, createNotification } = await import("@/lib/notify");
      const who = await actorLabel(supabase, user.id);
      const { data: owner } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", photo.user_id)
        .maybeSingle();
      await createNotification(supabase, {
        userId: photo.user_id,
        actorId: user.id,
        type: "gallery_like",
        message: `${who} liked your gallery photo`,
        action: "liked your gallery photo",
        entityType: "gallery_photo",
        entityId: photoId,
        href: owner?.username
          ? `/garage/${owner.username}/gallery`
          : "/garage?tab=gallery",
      });
    }

    revalidatePath("/garage/gallery");
    return { liked: true };
  } catch (e) {
    return {
      liked: false,
      error: e instanceof Error ? e.message : "Failed.",
    };
  }
}
