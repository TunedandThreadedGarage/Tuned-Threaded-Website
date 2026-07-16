"use client";

import { LayoutGroup } from "framer-motion";
import { CommunitySection } from "@/components/home/CommunitySection";
import { FeaturedCategories } from "@/components/home/FeaturedCategories";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { Hero } from "@/components/home/Hero";
import { Newsletter } from "@/components/home/Newsletter";
import { GarageExperience } from "@/components/garage/GarageExperience";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import type { ShopCollection, ShopProduct } from "@/lib/shopify/types";

export function HomeClient({
  products,
  collections,
}: {
  products: ShopProduct[];
  collections: ShopCollection[];
}) {
  return (
    <LayoutGroup id="tt-garage-logo">
      <GarageExperience>
        <SiteHeader />
        <main className="flex-1">
          <Hero />
          <FeaturedCategories collections={collections} />
          <CommunitySection />
          <FeaturedProducts products={products} />
          <div id="builds" className="sr-only" aria-hidden />
          <div id="journal" className="sr-only" aria-hidden />
          <Newsletter />
        </main>
        <SiteFooter />
      </GarageExperience>
    </LayoutGroup>
  );
}
