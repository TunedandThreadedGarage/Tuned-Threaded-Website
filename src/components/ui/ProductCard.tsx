"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { addToCartForm } from "@/features/shopify/actions";

type ProductCardProps = {
  name: string;
  category: string;
  price: string;
  index: number;
  subtitle?: string;
  imageUrl?: string | null;
  variantId?: string | null;
};

export function ProductCard({
  name,
  category,
  price,
  index,
  subtitle = "Coming soon",
  imageUrl,
  variantId,
}: ProductCardProps) {
  const media = (
    <div className="relative aspect-[3/4] overflow-hidden bg-surface">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      ) : (
        <div
          className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
          style={{
            background: `
                radial-gradient(circle at 50% 38%, rgba(184,184,192,0.12), transparent 48%),
                linear-gradient(180deg, #16161a 0%, #0d0d10 100%)
              `,
          }}
        />
      )}
      {!imageUrl ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="h-[58%] w-[42%] rounded-[40%_40%_18%_18%/30%_30%_55%_55%] border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-transform duration-700 group-hover:-translate-y-1"
            aria-hidden
          />
        </div>
      ) : null}
      <div className="garage-grain absolute inset-0" />
      <div className="absolute left-4 top-4 font-mono text-[10px] uppercase tracking-[0.2em] text-metal">
        {category}
      </div>
    </div>
  );

  const meta = (
    <div className="mt-4 flex items-start justify-between gap-4">
      <div>
        <h3 className="font-[family-name:var(--font-display)] text-base font-medium tracking-tight text-text transition-colors group-hover:text-white">
          {name}
        </h3>
        <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
      </div>
      <p className="shrink-0 text-sm text-text">{price}</p>
    </div>
  );

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{
        duration: 0.65,
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group"
    >
      {variantId ? (
        <form action={addToCartForm} className="block">
          <input type="hidden" name="merchandiseId" value={variantId} />
          <input type="hidden" name="quantity" value={1} />
          <button
            type="submit"
            className="block w-full cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            {media}
            {meta}
          </button>
        </form>
      ) : (
        <Link
          href="#shop"
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          {media}
          {meta}
        </Link>
      )}
    </motion.article>
  );
}
