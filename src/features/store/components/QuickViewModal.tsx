"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { StoreProduct } from "@/lib/shopify/types";
import { addToCartAction, buyNowAction } from "@/features/shopify/actions";
import { Button } from "@/components/ui/Button";
import { notifyCartOpen } from "@/components/cart/CartProvider";
import { WishlistHeartButton } from "@/features/commerce/components/WishlistHeartButton";

function QuickViewBody({
  product,
  onClose,
}: {
  product: StoreProduct;
  onClose: () => void;
}) {
  const [variantId, setVariantId] = useState(product.defaultVariantId);
  const [qty, setQty] = useState(1);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const selected = useMemo(
    () => product.variants.find((v) => v.id === variantId) ?? null,
    [product, variantId],
  );

  function add() {
    if (!variantId) return;
    startTransition(async () => {
      const result = await addToCartAction({
        merchandiseId: variantId,
        quantity: qty,
      });
      if ("error" in result) setMessage(result.error);
      else {
        setMessage("Added to cart.");
        notifyCartOpen();
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal
      aria-label="Quick view"
      onClick={onClose}
    >
      <div
        className="grid max-h-[90vh] w-full max-w-3xl overflow-y-auto border border-border bg-bg shadow-2xl md:grid-cols-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-square bg-surface md:aspect-auto md:min-h-[420px]">
          {selected?.imageUrl || product.imageUrl ? (
            <Image
              src={selected?.imageUrl || product.imageUrl!}
              alt={product.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : null}
        </div>
        <div className="flex flex-col p-6 md:p-8">
          <button
            type="button"
            onClick={onClose}
            className="self-end text-xs text-text-muted hover:text-text"
          >
            Close
          </button>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-metal">
            {product.vendor}
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-text">
            {product.title}
          </h2>
          <p className="mt-3 text-lg text-text">
            {selected?.priceFormatted ?? product.priceFormatted}
          </p>

          {product.variants.length > 1 ? (
            <label className="mt-6 block text-xs text-text-muted">
              Variant
              <select
                className="mt-2 w-full border border-border bg-surface px-3 py-2.5 text-sm text-text"
                value={variantId ?? ""}
                onChange={(e) => setVariantId(e.target.value)}
              >
                {product.variants.map((v) => (
                  <option key={v.id} value={v.id} disabled={!v.available}>
                    {v.title}
                    {!v.available ? " — sold out" : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="mt-4 block text-xs text-text-muted">
            Quantity
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              className="mt-2 w-24 border border-border bg-surface px-3 py-2.5 text-sm text-text"
            />
          </label>

          <div className="mt-6 flex flex-col gap-3">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="primary"
                className="flex-1"
                disabled={pending || !selected?.available}
                onClick={add}
              >
                {pending ? "Adding…" : "Add to Cart"}
              </Button>
              <WishlistHeartButton
                productRef={product.handle}
                productName={product.title}
                productImageUrl={product.imageUrl}
              />
            </div>
            <form action={buyNowAction}>
              <input type="hidden" name="merchandiseId" value={variantId ?? ""} />
              <input type="hidden" name="quantity" value={qty} />
              <Button
                type="submit"
                variant="accent"
                className="w-full"
                disabled={!selected?.available}
              >
                Buy Now
              </Button>
            </form>
            <Link
              href={`/store/${product.handle}`}
              className="text-center text-sm text-text-muted underline-offset-4 hover:text-text hover:underline"
              onClick={onClose}
            >
              View full details
            </Link>
          </div>
          {message ? (
            <p className="mt-4 text-sm text-text-muted">{message}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function QuickViewModal({
  product,
  onClose,
}: {
  product: StoreProduct | null;
  onClose: () => void;
}) {
  if (!product) return null;
  return (
    <QuickViewBody key={product.id} product={product} onClose={onClose} />
  );
}
