import Link from "next/link";
import { FadeIn } from "@/components/ui/FadeIn";
import { ProductCard } from "@/components/ui/ProductCard";
import type { ShopProduct } from "@/lib/shopify/types";

export function FeaturedProducts({ products }: { products: ShopProduct[] }) {
  if (products.length === 0) {
    return (
      <section
        id="shop"
        className="scroll-mt-24 border-t border-border bg-bg py-20 md:py-28"
      >
        <div className="mx-auto max-w-[1440px] px-5 md:px-8 lg:px-10">
          <FadeIn>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-metal">
              Collection
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-text sm:text-4xl">
              Featured gear.
            </h2>
            <p className="mt-4 max-w-md text-sm text-text-muted">
              No live products yet. When inventory hits Shopify, it shows up here
              and in the Store.
            </p>
            <Link
              href="/store"
              className="mt-6 inline-flex text-sm text-text underline-offset-4 hover:underline"
            >
              Open Store →
            </Link>
          </FadeIn>
        </div>
      </section>
    );
  }

  return (
    <section
      id="shop"
      className="scroll-mt-24 border-t border-border bg-bg py-20 md:py-28"
    >
      <div className="mx-auto max-w-[1440px] px-5 md:px-8 lg:px-10">
        <FadeIn className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-metal">
              Collection
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-text sm:text-4xl md:text-5xl">
              Featured gear.
            </h2>
          </div>
          <div className="max-w-sm sm:text-right">
            <p className="text-sm leading-relaxed text-text-muted">
              Live from Shopify. Tap a piece to add it to your cart.
            </p>
            <Link
              href="/store"
              className="mt-3 inline-flex text-sm text-text underline-offset-4 hover:underline"
            >
              Shop all →
            </Link>
          </div>
        </FadeIn>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              name={product.name}
              category={product.category}
              price={product.price}
              index={index}
              subtitle={product.subtitle}
              imageUrl={product.imageUrl}
              variantId={product.variantId}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
