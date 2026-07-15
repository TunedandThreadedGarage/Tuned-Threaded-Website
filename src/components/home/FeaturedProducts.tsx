import { featuredProducts } from "@/lib/site";
import { FadeIn } from "@/components/ui/FadeIn";
import { ProductCard } from "@/components/ui/ProductCard";

export function FeaturedProducts() {
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
          <p className="max-w-sm text-sm leading-relaxed text-text-muted sm:text-right">
            Placeholder products for the upcoming shop. No checkout yet—just the
            beginning of the bay.
          </p>
        </FadeIn>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {featuredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              name={product.name}
              category={product.category}
              price={product.price}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
