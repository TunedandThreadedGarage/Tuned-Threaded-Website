"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { GarageProfile } from "@/types/garage";

export function ProfileCustomizeForm({ profile }: { profile: GarageProfile }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    bannerUrl: profile.bannerUrl,
    avatarUrl: profile.avatarUrl,
    accentColor: profile.accentColor,
    bio: profile.bio,
    favoriteManufacturer: profile.favoriteManufacturer,
    favoriteEngine: profile.favoriteEngine,
    favoriteBuildStyle: profile.favoriteBuildStyle,
    favoriteQuote: profile.favoriteQuote ?? "",
    youtube: profile.socialLinks.youtube ?? "",
    instagram: profile.socialLinks.instagram ?? "",
    tiktok: profile.socialLinks.tiktok ?? "",
    website: profile.socialLinks.website ?? "",
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  return (
    <form
      className="space-y-8"
      onSubmit={(event) => {
        event.preventDefault();
        setSaved(true);
        window.setTimeout(() => {
          router.push(`/garage/${profile.username}`);
        }, 700);
      }}
    >
      <fieldset className="grid gap-5 md:grid-cols-2">
        <Field
          label="Garage banner URL"
          value={form.bannerUrl}
          onChange={(value) => update("bannerUrl", value)}
        />
        <Field
          label="Avatar URL"
          value={form.avatarUrl}
          onChange={(value) => update("avatarUrl", value)}
        />
        <label className="block md:col-span-2">
          <span className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-foreground-subtle">
            Accent color
          </span>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.accentColor}
              onChange={(event) => update("accentColor", event.target.value)}
              className="h-11 w-14 cursor-pointer rounded-lg border border-border bg-transparent p-1"
            />
            <input
              value={form.accentColor}
              onChange={(event) => update("accentColor", event.target.value)}
              className="h-11 flex-1 rounded-xl border border-border bg-background-soft px-4 text-sm outline-none focus:border-border-strong"
            />
          </div>
        </label>
        <label className="block md:col-span-2">
          <span className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-foreground-subtle">
            Bio
          </span>
          <textarea
            value={form.bio}
            onChange={(event) => update("bio", event.target.value)}
            rows={4}
            className="w-full rounded-xl border border-border bg-background-soft px-4 py-3 text-sm outline-none focus:border-border-strong"
          />
        </label>
        <Field
          label="Favorite manufacturer"
          value={form.favoriteManufacturer}
          onChange={(value) => update("favoriteManufacturer", value)}
        />
        <Field
          label="Favorite engine"
          value={form.favoriteEngine}
          onChange={(value) => update("favoriteEngine", value)}
        />
        <Field
          label="Favorite build style"
          value={form.favoriteBuildStyle}
          onChange={(value) => update("favoriteBuildStyle", value)}
        />
        <Field
          label="Favorite quote"
          value={form.favoriteQuote}
          onChange={(value) => update("favoriteQuote", value)}
        />
      </fieldset>

      <fieldset className="grid gap-5 md:grid-cols-2">
        <legend className="mb-2 text-[11px] uppercase tracking-[0.2em] text-foreground-subtle">
          Social links
        </legend>
        <Field
          label="YouTube"
          value={form.youtube}
          onChange={(value) => update("youtube", value)}
        />
        <Field
          label="Instagram"
          value={form.instagram}
          onChange={(value) => update("instagram", value)}
        />
        <Field
          label="TikTok"
          value={form.tiktok}
          onChange={(value) => update("tiktok", value)}
        />
        <Field
          label="Website"
          value={form.website}
          onChange={(value) => update("website", value)}
        />
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit">Save customization</Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(`/garage/${profile.username}`)}
        >
          Cancel
        </Button>
        {saved ? (
          <p className="text-sm text-success">Saved. Returning to garage…</p>
        ) : (
          <p className="text-sm text-foreground-subtle">
            Demo mode stores preferences locally for this session preview.
          </p>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-foreground-subtle">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-border bg-background-soft px-4 text-sm outline-none focus:border-border-strong"
      />
    </label>
  );
}
