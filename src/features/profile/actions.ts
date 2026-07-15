"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  evaluateAndAwardBadges,
  refreshReputationCache,
} from "@/lib/garage-badges";
import type { SkillLevel } from "@/types/database";

export type ProfileActionResult = {
  error?: string;
  success?: boolean;
};

export async function completeOnboarding(
  _prev: ProfileActionResult,
  formData: FormData,
): Promise<ProfileActionResult> {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const displayName = String(formData.get("display_name") ?? "").trim();

  if (!/^[a-z0-9_]{3,24}$/.test(username)) {
    return {
      error:
        "Username must be 3–24 characters: lowercase letters, numbers, underscore.",
    };
  }
  if (!displayName) {
    return { error: "Display name is required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      display_name: displayName,
      onboarding_completed: true,
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "That username is taken." };
    }
    return { error: error.message };
  }

  revalidatePath("/garage");
  redirect("/garage");
}

function cleanUrl(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  if (!/^https?:\/\//i.test(v)) return `https://${v}`;
  return v;
}

export async function updateProfile(
  _prev: ProfileActionResult,
  formData: FormData,
): Promise<ProfileActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const displayName = String(formData.get("display_name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const skillRaw = String(formData.get("skill_level") ?? "").trim();
  const skill_level = (skillRaw || null) as SkillLevel | null;
  const yearsRaw = String(formData.get("years_building") ?? "").trim();
  const accent = String(formData.get("accent_color") ?? "").trim() || "#c4121a";

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName || null,
      bio: bio || null,
      location: location || null,
      skill_level,
      favorite_manufacturer:
        String(formData.get("favorite_manufacturer") ?? "").trim() || null,
      favorite_engine:
        String(formData.get("favorite_engine") ?? "").trim() || null,
      favorite_build_style:
        String(formData.get("favorite_build_style") ?? "").trim() || null,
      favorite_quote:
        String(formData.get("favorite_quote") ?? "").trim() || null,
      youtube_url: cleanUrl(String(formData.get("youtube_url") ?? "")),
      instagram_url: cleanUrl(String(formData.get("instagram_url") ?? "")),
      tiktok_url: cleanUrl(String(formData.get("tiktok_url") ?? "")),
      website_url: cleanUrl(String(formData.get("website_url") ?? "")),
      accent_color: accent,
      years_building: yearsRaw ? Number(yearsRaw) : null,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  await evaluateAndAwardBadges(supabase, user.id);
  await refreshReputationCache(supabase, user.id);

  revalidatePath("/garage");
  revalidatePath("/garage/settings");
  return { success: true };
}

export async function updateProfileImageUrls(input: {
  avatar_url?: string | null;
  banner_url?: string | null;
}): Promise<ProfileActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("profiles")
    .update(input)
    .eq("id", user.id);

  if (error) return { error: error.message };
  await evaluateAndAwardBadges(supabase, user.id);
  revalidatePath("/garage");
  return { success: true };
}
