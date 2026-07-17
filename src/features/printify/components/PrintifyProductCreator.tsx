"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  createAndPublishPrintifyProductAction,
  loadPrintifyAdminBootstrap,
  loadPrintifyProvidersAction,
  loadPrintifyVariantsAction,
  uploadPrintifyArtworkAction,
} from "@/features/printify/actions";
import type {
  PrintifyBlueprint,
  PrintifyPrintProvider,
  PrintifyShop,
} from "@/lib/printify";
import { Button } from "@/components/ui/Button";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

export function PrintifyProductCreator({
  initialError,
}: {
  initialError?: string | null;
}) {
  const [pending, start] = useTransition();
  const [bootError, setBootError] = useState(initialError ?? null);
  const [shops, setShops] = useState<PrintifyShop[]>([]);
  const [blueprints, setBlueprints] = useState<PrintifyBlueprint[]>([]);
  const [providers, setProviders] = useState<PrintifyPrintProvider[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [positions, setPositions] = useState<string[]>([]);

  const [blueprintId, setBlueprintId] = useState<number | "">("");
  const [providerId, setProviderId] = useState<number | "">("");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [position, setPosition] = useState("front");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("48");

  const [imageId, setImageId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  useEffect(() => {
    if (initialError) return;
    start(async () => {
      const res = await loadPrintifyAdminBootstrap();
      if (res.error) {
        setBootError(res.error);
        return;
      }
      setShops(res.data?.shops ?? []);
      setBlueprints(res.data?.blueprints ?? []);
    });
  }, [initialError]);

  const selectedBlueprint = useMemo(
    () => blueprints.find((b) => b.id === blueprintId) ?? null,
    [blueprints, blueprintId],
  );

  const onBlueprintChange = useCallback((id: number) => {
    setBlueprintId(id);
    setProviderId("");
    setProviders([]);
    setColors([]);
    setSizes([]);
    setPositions([]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setError(null);
    start(async () => {
      const res = await loadPrintifyProvidersAction(id);
      if (res.error) {
        setError(res.error);
        return;
      }
      setProviders(res.data ?? []);
      if (res.data?.[0]) {
        setProviderId(res.data[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!blueprintId || !providerId) return;
    start(async () => {
      const res = await loadPrintifyVariantsAction({
        blueprintId: Number(blueprintId),
        printProviderId: Number(providerId),
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      setColors(res.data?.colors ?? []);
      setSizes(res.data?.sizes ?? []);
      setPositions(res.data?.positions ?? []);
      setSelectedColors(res.data?.colors?.slice(0, 3) ?? []);
      setSelectedSizes(res.data?.sizes ?? []);
      const front =
        res.data?.positions?.find((p) => /front/i.test(p)) ??
        res.data?.positions?.[0] ??
        "front";
      setPosition(front);
    });
  }, [blueprintId, providerId]);

  function toggle(list: string[], value: string, set: (v: string[]) => void) {
    set(
      list.includes(value)
        ? list.filter((x) => x !== value)
        : [...list, value],
    );
  }

  function onFile(file: File | null) {
    if (!file) return;
    setError(null);
    setMessage(null);
    setCreatedId(null);
    setLocalPreview(URL.createObjectURL(file));
    start(async () => {
      try {
        const base64 = await fileToBase64(file);
        const res = await uploadPrintifyArtworkAction({
          fileName: file.name,
          base64Contents: base64,
        });
        if (res.error || !res.data) {
          setError(res.error ?? "Upload failed.");
          return;
        }
        setImageId(res.data.id);
        setPreviewUrl(res.data.preview_url);
        setMessage("Artwork uploaded to Printify.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed.");
      }
    });
  }

  function submit() {
    setError(null);
    setMessage(null);
    setCreatedId(null);
    if (!imageId) {
      setError("Upload artwork first.");
      return;
    }
    if (!blueprintId || !providerId) {
      setError("Select a blueprint and print provider.");
      return;
    }
    start(async () => {
      const res = await createAndPublishPrintifyProductAction({
        title,
        description,
        blueprintId: Number(blueprintId),
        printProviderId: Number(providerId),
        imageId,
        retailPriceDollars: Number(price),
        colors: selectedColors,
        sizes: selectedSizes,
        position,
      });
      if (res.error || !res.data) {
        setError(res.error ?? "Create failed.");
        return;
      }
      setCreatedId(res.data.product.id);
      setMessage(
        `Product created and publish started on Printify → Shopify (${res.data.product.id}). Mockups may take up to a minute.`,
      );
    });
  }

  if (bootError) {
    return (
      <div className="border border-border bg-surface/30 p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-metal">
          Printify
        </p>
        <p className="mt-3 text-sm text-accent" role="alert">
          {bootError}
        </p>
        <p className="mt-4 text-sm text-text-muted">
          Set <code className="text-text">PRINTIFY_API_TOKEN</code>,{" "}
          <code className="text-text">PRINTIFY_SHOP_ID</code>, and{" "}
          <code className="text-text">ADMIN_EMAILS</code> in your environment,
          then redeploy.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {shops.length > 0 ? (
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-metal">
          Shop · {shops.map((s) => `${s.title} (${s.sales_channel})`).join(" · ")}
        </p>
      ) : null}

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4 border border-border bg-surface/20 p-5 md:p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-metal">
            1 · Artwork
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-text">
            Upload artwork
          </h2>
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            disabled={pending}
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-text-muted file:mr-4 file:border file:border-border file:bg-surface file:px-3 file:py-2 file:text-sm file:text-text"
          />
          <div className="relative aspect-square max-w-xs overflow-hidden bg-surface">
            {localPreview || previewUrl ? (
              <Image
                src={localPreview || previewUrl!}
                alt="Artwork preview"
                fill
                unoptimized
                className="object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-text-muted">
                No artwork yet
              </div>
            )}
          </div>
          {imageId ? (
            <p className="font-mono text-[10px] text-metal">ID · {imageId}</p>
          ) : null}
        </div>

        <div className="space-y-4 border border-border bg-surface/20 p-5 md:p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-metal">
            2 · Blueprint
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-text">
            Select blueprint
          </h2>
          <label className="block text-sm text-text-muted">
            Catalog product
            <select
              value={blueprintId}
              disabled={pending || blueprints.length === 0}
              onChange={(e) => onBlueprintChange(Number(e.target.value))}
              className="mt-2 w-full border border-border bg-surface px-3 py-2.5 text-sm text-text"
            >
              <option value="">Choose blueprint…</option>
              {blueprints.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.brand} · {b.title} ({b.model})
                </option>
              ))}
            </select>
          </label>
          {selectedBlueprint?.images?.[0] ? (
            <div className="relative aspect-[4/3] overflow-hidden bg-surface">
              <Image
                src={selectedBlueprint.images[0]}
                alt=""
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          ) : null}
          <label className="block text-sm text-text-muted">
            Print provider
            <select
              value={providerId}
              disabled={pending || !providers.length}
              onChange={(e) => setProviderId(Number(e.target.value))}
              className="mt-2 w-full border border-border bg-surface px-3 py-2.5 text-sm text-text"
            >
              <option value="">Choose provider…</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>
          {positions.length > 1 ? (
            <label className="block text-sm text-text-muted">
              Print position
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="mt-2 w-full border border-border bg-surface px-3 py-2.5 text-sm text-text"
              >
                {positions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </section>

      <section className="space-y-4 border border-border bg-surface/20 p-5 md:p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-metal">
          3 · Colors & sizes
        </p>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-text">
          Choose offering
        </h2>
        {!colors.length ? (
          <p className="text-sm text-text-muted">
            Select a blueprint and provider to load colors and sizes.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="mb-2 text-sm text-text-muted">Colors</p>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => {
                  const on = selectedColors.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() =>
                        toggle(selectedColors, c, setSelectedColors)
                      }
                      className={`border px-3 py-1.5 text-xs transition-colors ${
                        on
                          ? "border-text text-text"
                          : "border-border text-text-muted hover:text-text"
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm text-text-muted">Sizes</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => {
                  const on = selectedSizes.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggle(selectedSizes, s, setSelectedSizes)}
                      className={`border px-3 py-1.5 text-xs transition-colors ${
                        on
                          ? "border-text text-text"
                          : "border-border text-text-muted hover:text-text"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4 border border-border bg-surface/20 p-5 md:p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-metal">
          4 · Details & publish
        </p>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-text">
          Title, description, price
        </h2>
        <label className="block text-sm text-text-muted">
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Midnight Torque Tee"
            className="mt-2 w-full border border-border bg-surface px-3 py-2.5 text-sm text-text"
          />
        </label>
        <label className="block text-sm text-text-muted">
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Built for the garage. Worn everywhere."
            className="mt-2 w-full border border-border bg-surface px-3 py-2.5 text-sm text-text"
          />
        </label>
        <label className="block text-sm text-text-muted">
          Retail price (USD)
          <input
            type="number"
            min={1}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-2 w-40 border border-border bg-surface px-3 py-2.5 text-sm text-text"
          />
        </label>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            type="button"
            variant="primary"
            disabled={pending}
            onClick={submit}
          >
            {pending ? "Working…" : "Create Product"}
          </Button>
          <p className="text-xs text-text-muted">
            Creates on Printify and publishes to your connected Shopify shop.
          </p>
        </div>

        {error ? (
          <p className="text-sm text-accent" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="text-sm text-text-muted" role="status">
            {message}
          </p>
        ) : null}
        {createdId ? (
          <p className="font-mono text-[11px] text-metal">
            Printify product · {createdId}
          </p>
        ) : null}
      </section>
    </div>
  );
}
