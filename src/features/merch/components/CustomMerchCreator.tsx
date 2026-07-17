"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  MERCH_COLORS,
  MERCH_PRODUCTS,
  type MerchColorId,
  type MerchProductId,
} from "@/features/merch/constants";
import { prepareMerchDesignAction } from "@/features/merch/actions";
import { Button } from "@/components/ui/Button";

export function CustomMerchCreator({
  defaultUsername = "",
}: {
  defaultUsername?: string;
}) {
  const [productId, setProductId] = useState<MerchProductId>("hoodie");
  const [colorId, setColorId] = useState<MerchColorId>("black");
  const [username, setUsername] = useState(defaultUsername);
  const [customText, setCustomText] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prepared, setPrepared] = useState(false);

  const color = useMemo(
    () => MERCH_COLORS.find((c) => c.id === colorId) ?? MERCH_COLORS[0],
    [colorId],
  );
  const product = useMemo(
    () => MERCH_PRODUCTS.find((p) => p.id === productId) ?? MERCH_PRODUCTS[0],
    [productId],
  );

  function onFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    setError(null);
    setPrepared(false);
    setPhotoName(file.name);
    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
  }

  function prepare() {
    setError(null);
    setMessage(null);
    start(async () => {
      const res = await prepareMerchDesignAction({
        productId,
        colorId,
        username,
        customText,
        vehiclePhotoUrl: photoUrl,
        vehiclePhotoName: photoName,
      });
      if (res.error) {
        setError(res.error);
        setPrepared(false);
        return;
      }
      setPrepared(true);
      setMessage(
        "Design prepared for Printify. Automatic create & publish will connect here next.",
      );
    });
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <section className="space-y-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-metal">
            1 · Vehicle photo
          </p>
          <label className="mt-3 flex cursor-pointer flex-col items-center justify-center border border-dashed border-border bg-surface/20 px-5 py-10 transition-colors hover:border-metal/50">
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
            <span className="font-[family-name:var(--font-display)] text-lg text-text">
              Upload vehicle photo
            </span>
            <span className="mt-2 text-sm text-text-muted">
              PNG or JPG · garage shot preferred
            </span>
            {photoName ? (
              <span className="mt-3 font-mono text-[10px] text-metal">
                {photoName}
              </span>
            ) : null}
          </label>
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-metal">
            2 · Product
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {MERCH_PRODUCTS.map((p) => {
              const on = p.id === productId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setProductId(p.id);
                    setPrepared(false);
                  }}
                  className={`border px-4 py-3 text-left transition-colors ${
                    on
                      ? "border-text bg-surface/40 text-text"
                      : "border-border text-text-muted hover:text-text"
                  }`}
                >
                  <span className="block text-sm font-medium">{p.label}</span>
                  <span className="mt-1 block text-xs opacity-70">
                    {p.subtitle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-metal">
            3 · Color
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {MERCH_COLORS.map((c) => {
              const on = c.id === colorId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setColorId(c.id);
                    setPrepared(false);
                  }}
                  className={`flex items-center gap-2 border px-3 py-2 text-xs transition-colors ${
                    on
                      ? "border-text text-text"
                      : "border-border text-text-muted hover:text-text"
                  }`}
                >
                  <span
                    className="h-3 w-3 border border-white/20"
                    style={{ background: c.swatch }}
                  />
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm text-text-muted">
            Username
            <input
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setPrepared(false);
              }}
              placeholder="yourhandle"
              className="mt-2 w-full border border-border bg-surface px-3 py-2.5 text-sm text-text"
            />
          </label>
          <label className="block text-sm text-text-muted">
            Custom text (optional)
            <input
              value={customText}
              onChange={(e) => {
                setCustomText(e.target.value);
                setPrepared(false);
              }}
              placeholder="Built not bought"
              className="mt-2 w-full border border-border bg-surface px-3 py-2.5 text-sm text-text"
            />
          </label>
        </div>

        <Button
          type="button"
          variant="primary"
          disabled={pending}
          onClick={prepare}
        >
          {pending ? "Preparing…" : "Prepare for Printify"}
        </Button>
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
        {prepared ? (
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-metal">
            Status · Printify-ready draft
          </p>
        ) : null}
      </section>

      <section className="border border-border bg-surface/20 p-5 md:p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-metal">
          Live preview
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold text-text">
          {product.label}
        </h2>
        <p className="mt-1 text-sm text-text-muted">{product.subtitle}</p>

        <motion.div
          key={`${productId}-${colorId}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-6 aspect-[4/5] overflow-hidden"
          style={{ background: color.swatch }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-black/40" />
          <div className="absolute inset-x-8 top-[18%] flex flex-col items-center text-center">
            <p
              className={`font-[family-name:var(--font-display)] text-sm tracking-[0.2em] ${
                colorId === "white" ? "text-bg" : "text-white"
              }`}
            >
              TUNED &amp; THREADED
            </p>
            {username ? (
              <p
                className={`mt-2 font-mono text-[11px] uppercase tracking-[0.16em] ${
                  colorId === "white" ? "text-bg/70" : "text-white/70"
                }`}
              >
                @{username.replace(/^@/, "")}
              </p>
            ) : null}
            {customText ? (
              <p
                className={`mt-3 max-w-[16rem] text-xs leading-relaxed ${
                  colorId === "white" ? "text-bg/80" : "text-white/80"
                }`}
              >
                {customText}
              </p>
            ) : null}
          </div>

          <div className="absolute inset-x-10 bottom-10 overflow-hidden border border-white/15 bg-black/30">
            <div className="relative aspect-video">
              {photoUrl ? (
                <Image
                  src={photoUrl}
                  alt="Vehicle preview"
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-4 text-center text-xs text-white/50">
                  Vehicle photo lands here
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <p className="mt-4 text-xs text-text-muted">
          Architecture is ready for Printify: upload artwork → map blueprint →
          create product → publish to Shopify. Fulfillment wiring comes next.
        </p>
      </section>
    </div>
  );
}
