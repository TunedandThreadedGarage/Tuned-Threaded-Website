"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type { StoreProduct } from "@/lib/shopify/types";
import { addToCartAction, buyNowAction } from "@/features/shopify/actions";
import { Button } from "@/components/ui/Button";
import { RETURNS_COPY, SHIPPING_COPY } from "@/features/store/constants";
import { StoreProductCard } from "@/features/store/components/StoreProductCard";
import { QuickViewModal } from "@/features/store/components/QuickViewModal";
import { WishlistHeartButton } from "@/features/commerce/components/WishlistHeartButton";
import { formatPriceString } from "@/lib/shopify/types";
import { notifyCartOpen } from "@/components/cart/CartProvider";

function formatCompare(amount: number, currency: string) {
  return formatPriceString(amount, currency);
}

export function ProductDetail({
  product,
  related,
}: {
  product: StoreProduct;
  related: StoreProduct[];
}) {
  const [variantId, setVariantId] = useState(product.defaultVariantId);
  const [qty, setQty] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [quickView, setQuickView] = useState<StoreProduct | null>(null);

  const selected = useMemo(
    () => product.variants.find((v) => v.id === variantId) ?? null,
    [product.variants, variantId],
  );

  const gallery = (() => {
    const urls = [...product.images];
    if (selected?.imageUrl && !urls.some((i) => i.url === selected.imageUrl)) {
      urls.unshift({ url: selected.imageUrl, alt: product.title });
    }
    return urls;
  })();

  const activeImage = gallery[imageIndex] ?? gallery[0];

  function onOptionChange(optionName: string, value: string) {
    const next = product.variants.find((v) => {
      const current = Object.fromEntries(
        (selected?.selectedOptions ?? []).map((o) => [o.name, o.value]),
      );
      const merged = { ...current, [optionName]: value };
      return v.selectedOptions.every((o) => merged[o.name] === o.value);
    });
    if (next) {
      setVariantId(next.id);
      setImageIndex(0);
    }
  }

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
    <div className="space-y-20">
      <nav className="font-mono text-[11px] uppercase tracking-[0.16em] text-metal">
        <Link href="/store" className="hover:text-text">
          Store
        </Link>
        <span className="mx-2 text-border">/</span>
        <span className="text-text-muted">{product.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <div className="relative aspect-[4/5] overflow-hidden bg-surface">
            {activeImage ? (
              <Image
                src={activeImage.url}
                alt={activeImage.alt || product.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1d] to-bg" />
            )}
            {product.onSale ? (
              <span className="absolute left-4 top-4 bg-accent px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white">
                Sale
              </span>
            ) : null}
          </div>
          {gallery.length > 1 ? (
            <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
              {gallery.map((img, i) => (
                <button
                  key={img.url + i}
                  type="button"
                  onClick={() => setImageIndex(i)}
                  className={`relative aspect-square overflow-hidden border ${
                    i === imageIndex ? "border-accent" : "border-border"
                  }`}
                >
                  <Image
                    src={img.url}
                    alt=""
                    fill
                    loading="lazy"
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
            {product.vendor}
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-text sm:text-4xl md:text-5xl">
            {product.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <p className="text-xl text-text">
              {selected?.priceFormatted ?? product.priceFormatted}
            </p>
            {selected?.compareAtAmount || product.compareAtFormatted ? (
              <p className="text-base text-text-muted line-through">
                {selected?.compareAtAmount
                  ? formatCompare(selected.compareAtAmount, product.currencyCode)
                  : product.compareAtFormatted}
              </p>
            ) : null}
          </div>

          {product.descriptionHtml ? (
            <div
              className="prose-store mt-6 max-w-none text-sm leading-relaxed text-text-muted [&_a]:text-text [&_p]:mb-3"
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
            />
          ) : (
            <p className="mt-6 text-sm text-text-muted">
              Built for the garage. Worn everywhere.
            </p>
          )}

          {product.options.filter((o) => o.name !== "Title").map((opt) => (
            <div key={opt.name} className="mt-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-metal">
                {opt.name}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {opt.values.map((val) => {
                  const active = selected?.selectedOptions.some(
                    (o) => o.name === opt.name && o.value === val,
                  );
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => onOptionChange(opt.name, val)}
                      className={`border px-3 py-2 text-sm transition-colors ${
                        active
                          ? "border-accent bg-accent/10 text-text"
                          : "border-border text-text-muted hover:border-white/40 hover:text-text"
                      }`}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <label className="mt-6 block font-mono text-[10px] uppercase tracking-[0.16em] text-metal">
            Quantity
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              className="mt-2 block w-24 border border-border bg-surface px-3 py-2.5 font-sans text-sm normal-case tracking-normal text-text"
            />
          </label>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="primary"
              className="flex-1"
              disabled={pending || !selected?.available}
              onClick={add}
            >
              {pending ? "Adding…" : "Add to Cart"}
            </Button>
            <form action={buyNowAction} className="flex-1">
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
            <WishlistHeartButton
              productRef={product.handle}
              productName={product.title}
              productImageUrl={product.imageUrl}
              className="shrink-0"
            />
          </div>
          {message ? (
            <p className="mt-3 text-sm text-text-muted">{message}</p>
          ) : null}

          <div className="mt-10 space-y-6 border-t border-border pt-8">
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-text">
                Shipping
              </h2>
              <p className="mt-2 text-sm text-text-muted">{SHIPPING_COPY}</p>
            </section>
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-text">
                Returns
              </h2>
              <p className="mt-2 text-sm text-text-muted">{RETURNS_COPY}</p>
            </section>
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-text">
                Customer Reviews
              </h2>
              <p className="mt-2 text-sm text-text-muted">
                Reviews are coming soon. First builds through the bay get first
                word.
              </p>
            </section>
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <section>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
            Related
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-text">
            More from the rack.
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p, i) => (
              <StoreProductCard
                key={p.id}
                product={p}
                index={i}
                onQuickView={setQuickView}
              />
            ))}
          </div>
        </section>
      ) : null}

      <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />
    </div>
  );
}
