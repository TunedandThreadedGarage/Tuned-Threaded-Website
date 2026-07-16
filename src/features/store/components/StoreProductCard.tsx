"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import type { StoreProduct } from "@/lib/shopify/types";
import { addToCartAction } from "@/features/shopify/actions";
import { notifyCartOpen } from "@/components/cart/CartProvider";
import { WishlistHeartButton } from "@/features/commerce/components/WishlistHeartButton";

export function StoreProductCard({
  product,
  index,
  onQuickView,
}: {
  product: StoreProduct;
  index: number;
  onQuickView: (product: StoreProduct) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    if (!product.defaultVariantId || !product.available) return;
    setError(null);
    startTransition(async () => {
      const result = await addToCartAction({
        merchandiseId: product.defaultVariantId!,
        quantity: 1,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setAdded(true);
      notifyCartOpen();
      window.setTimeout(() => setAdded(false), 1800);
    });
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: Math.min(index, 8) * 0.04,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group flex flex-col"
    >
      <div className="relative overflow-hidden bg-surface transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-hover:-translate-y-1.5 group-hover:shadow-[0_24px_48px_-28px_rgba(196,18,26,0.45)]">
        <Link
          href={`/store/${product.handle}`}
          className="relative block aspect-[3/4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              loading="lazy"
              className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1d] to-[#0c0c0e]" />
          )}
          <div className="garage-grain pointer-events-none absolute inset-0 opacity-40" />
          {product.onSale ? (
            <span className="absolute left-3 top-3 bg-accent px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white">
              Sale
            </span>
          ) : null}
          {!product.available ? (
            <span className="absolute bottom-3 left-3 border border-border bg-bg/80 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted backdrop-blur">
              Sold out
            </span>
          ) : null}
        </Link>
        <div className="absolute right-3 top-3 z-10">
          <WishlistHeartButton
            productRef={product.handle}
            productName={product.title}
            productImageUrl={product.imageUrl}
            className="border-white/20 bg-bg/70 backdrop-blur"
          />
        </div>

        <div className="absolute inset-x-0 bottom-0 flex translate-y-2 gap-2 p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 max-sm:translate-y-0 max-sm:opacity-100">
          <button
            type="button"
            disabled={!product.available || pending || !product.defaultVariantId}
            onClick={handleAdd}
            className="flex-1 bg-white px-3 py-2.5 text-xs font-medium tracking-wide text-bg transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? "Adding…" : added ? "Added" : "Add to Cart"}
          </button>
          <button
            type="button"
            onClick={() => onQuickView(product)}
            className="border border-white/30 bg-bg/80 px-3 py-2.5 text-xs font-medium tracking-wide text-text backdrop-blur transition-colors hover:border-white/60"
          >
            Quick View
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-1 flex-col gap-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-metal">
          {product.vendor}
        </p>
        <Link
          href={`/store/${product.handle}`}
          className="font-[family-name:var(--font-display)] text-base font-medium tracking-tight text-text transition-colors hover:text-white"
        >
          {product.title}
        </Link>
        <div className="mt-1 flex items-baseline gap-2">
          <p className="text-sm text-text">{product.priceFormatted}</p>
          {product.compareAtFormatted ? (
            <p className="text-sm text-text-muted line-through">
              {product.compareAtFormatted}
            </p>
          ) : null}
        </div>
        {error ? <p className="text-xs text-accent">{error}</p> : null}
      </div>
    </motion.article>
  );
}

export function StoreProductSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[3/4] bg-surface" />
      <div className="mt-4 h-2 w-16 bg-surface" />
      <div className="mt-3 h-4 w-3/4 bg-surface" />
      <div className="mt-2 h-3 w-12 bg-surface" />
    </div>
  );
}
