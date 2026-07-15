import { categories } from "@/lib/site";
import { CategoryCard } from "@/components/ui/CategoryCard";
import { FadeIn } from "@/components/ui/FadeIn";

export function FeaturedCategories() {
  return (
    <section
      id="garage"
      className="scroll-mt-24 border-t border-border bg-bg py-20 md:py-28"
    >
      <div className="mx-auto max-w-[1440px] px-5 md:px-8 lg:px-10">
        <FadeIn>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-metal">
            Explore
          </p>
          <h2 className="mt-3 max-w-xl font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-text sm:text-4xl md:text-5xl">
            Categories built for the culture.
          </h2>
        </FadeIn>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {categories.map((category, index) => (
            <CategoryCard
              key={category.id}
              title={category.title}
              description={category.description}
              href={category.href}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
