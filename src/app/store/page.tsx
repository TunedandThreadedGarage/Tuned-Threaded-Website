import { Suspense } from "react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { GarageExperience } from "@/components/garage/GarageExperience";
import { StoreCatalog } from "@/features/store/components/StoreCatalog";
import { StoreProductSkeleton } from "@/features/store/components/StoreProductCard";
import {
  fetchStoreCatalogSeed,
  fetchStoreProductsPage,
} from "@/lib/shopify/store-catalog";
import { isShopifyConfigured } from "@/lib/shopify/config";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = {
  title: "Store — Tuned & Threaded",
  description:
    "Premium garage gear from Tuned & Threaded. Live Shopify inventory.",
};

export const revalidate = 60;

async function StoreBody() {
  if (!isShopifyConfigured()) {
    return (
      <EmptyState
        title="Store offline"
        description="Connect Shopify credentials to load live products."
      />
    );
  }

  const seed = await fetchStoreCatalogSeed(120);
  const collectionProductMap: Record<string, string[]> = {};

  await Promise.all(
    seed.facets.collections.slice(0, 24).map(async (c) => {
      const page = await fetchStoreProductsPage({
        collection: c.handle,
        first: 100,
      });
      collectionProductMap[c.handle] = page.products.map((p) => p.id);
    }),
  );

  return (
    <StoreCatalog
      initialProducts={seed.products}
      facets={seed.facets}
      collectionProductMap={collectionProductMap}
    />
  );
}

export default function StorePage() {
  return (
    <GarageExperience>
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-5 pb-24 pt-24 md:px-8 md:pt-28 lg:px-10">
        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <StoreProductSkeleton key={i} />
              ))}
            </div>
          }
        >
          <StoreBody />
        </Suspense>
      </main>
      <SiteFooter />
    </GarageExperience>
  );
}
