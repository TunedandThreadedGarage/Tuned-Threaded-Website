"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  updateProfile,
  type ProfileActionResult,
} from "@/features/profile/actions";
import { FormField, TextAreaField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { SKILL_LEVEL_OPTIONS } from "@/components/garage-profile/SkillBadge";
import { ImageUpload } from "@/components/garage-profile/ImageUpload";
import type { Profile } from "@/types/database";

const initial: ProfileActionResult = {};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? "Saving…" : "Save profile"}
    </Button>
  );
}

export function ProfileSettingsForm({ profile }: { profile: Profile }) {
  const [state, action] = useActionState(updateProfile, initial);

  return (
    <div className="space-y-10">
      <div className="grid gap-8 sm:grid-cols-2">
        <ImageUpload
          bucket="avatars"
          userId={profile.id}
          label="Profile picture"
          currentUrl={profile.avatar_url}
        />
        <ImageUpload
          bucket="banners"
          userId={profile.id}
          label="Garage banner"
          currentUrl={profile.banner_url}
        />
      </div>

      <form action={action} className="max-w-xl space-y-4">
        <FormField
          label="Display name"
          name="display_name"
          defaultValue={profile.display_name ?? ""}
        />
        <TextAreaField
          label="Bio"
          name="bio"
          defaultValue={profile.bio ?? ""}
          hint="A short note about your garage."
        />
        <FormField
          label="Location"
          name="location"
          defaultValue={profile.location ?? ""}
          placeholder="Optional"
        />
        <label className="block text-sm text-text">
          <span className="font-medium">Garage rank</span>
          <select
            name="skill_level"
            defaultValue={profile.skill_level ?? ""}
            className="mt-1.5 w-full border border-border bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-metal/50"
          >
            <option value="">Select…</option>
            {SKILL_LEVEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            label="Favorite manufacturer"
            name="favorite_manufacturer"
            defaultValue={profile.favorite_manufacturer ?? ""}
          />
          <FormField
            label="Favorite engine"
            name="favorite_engine"
            defaultValue={profile.favorite_engine ?? ""}
          />
        </div>
        <FormField
          label="Favorite build style"
          name="favorite_build_style"
          defaultValue={profile.favorite_build_style ?? ""}
        />
        <TextAreaField
          label="Favorite quote"
          name="favorite_quote"
          defaultValue={profile.favorite_quote ?? ""}
        />
        <FormField
          label="Years building"
          name="years_building"
          type="number"
          defaultValue={profile.years_building?.toString() ?? ""}
        />
        <FormField
          label="Accent color"
          name="accent_color"
          type="color"
          defaultValue={profile.accent_color || "#c4121a"}
          className="mt-1.5 h-11 w-24 border border-border bg-bg p-1"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            label="YouTube"
            name="youtube_url"
            defaultValue={profile.youtube_url ?? ""}
            placeholder="https://"
          />
          <FormField
            label="Instagram"
            name="instagram_url"
            defaultValue={profile.instagram_url ?? ""}
            placeholder="https://"
          />
          <FormField
            label="TikTok"
            name="tiktok_url"
            defaultValue={profile.tiktok_url ?? ""}
            placeholder="https://"
          />
          <FormField
            label="Website"
            name="website_url"
            defaultValue={profile.website_url ?? ""}
            placeholder="https://"
          />
        </div>

        {state.error ? (
          <p className="text-sm text-accent" role="alert">
            {state.error}
          </p>
        ) : null}
        {state.success ? (
          <p className="text-sm text-text-muted" role="status">
            Profile saved.
          </p>
        ) : null}
        <SaveButton />
      </form>
    </div>
  );
}
