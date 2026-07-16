"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { StoreProduct } from "@/lib/shopify/types";
import type { StoreFacets } from "@/lib/shopify/store-catalog";
import {
  filterStoreProducts,
  sortStoreProducts,
} from "@/lib/shopify/store-catalog";
import { PAGE_SIZE } from "@/features/store/constants";
import {
  StoreProductCard,
  StoreProductSkeleton,
} from "@/features/store/components/StoreProductCard";
import {
  StoreFilters,
  defaultFilterState,
  type StoreFilterState,
} from "@/features/store/components/StoreFilters";
import { QuickViewModal } from "@/features/store/components/QuickViewModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { loadMoreStoreProducts } from "@/features/shopify/actions";

export function StoreCatalog({
  initialProducts,
  facets,
  collectionProductMap,
}: {
  initialProducts: StoreProduct[];
  facets: StoreFacets;
  /** handle -> product ids for collection filter */
  collectionProductMap: Record<string, string[]>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<StoreFilterState>(() => {
    const base = defaultFilterState(facets);
    const collection = searchParams.get("collection") ?? "";
    const q = searchParams.get("q") ?? "";
    return {
      ...base,
      collection,
      search: q,
    };
  });
  const deferredSearch = useDeferredValue(filters.search);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [visibleKey, setVisibleKey] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [extra, setExtra] = useState<StoreProduct[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMoreRemote, setHasMoreRemote] = useState(false);
  const [quickView, setQuickView] = useState<StoreProduct | null>(null);
  const [booting, setBooting] = useState(true);

  const filterKey = useMemo(
    () =>
      JSON.stringify({
        search: deferredSearch,
        brand: filters.brand,
        collection: filters.collection,
        priceMin: filters.priceMin,
        priceMax: filters.priceMax,
        available: filters.available,
        make: filters.make,
        model: filters.model,
        sort: filters.sort,
      }),
    [deferredSearch, filters],
  );

  if (visibleKey !== filterKey) {
    setVisibleKey(filterKey);
    setVisible(PAGE_SIZE);
  }

  useEffect(() => {
    const t = window.setTimeout(() => setBooting(false), 280);
    return () => window.clearTimeout(t);
  }, []);

  const allProducts = useMemo(() => {
    const map = new Map<string, StoreProduct>();
    for (const p of [...initialProducts, ...extra]) map.set(p.id, p);
    return [...map.values()];
  }, [initialProducts, extra]);

  const filtered = useMemo(() => {
    const collectionIds = filters.collection
      ? new Set(collectionProductMap[filters.collection] ?? [])
      : undefined;
    const list = filterStoreProducts(allProducts, {
      search: deferredSearch,
      brand: filters.brand || undefined,
      priceMin: Math.min(filters.priceMin, filters.priceMax),
      priceMax: Math.max(filters.priceMin, filters.priceMax),
      available: filters.available,
      make: filters.make || undefined,
      model: filters.model || undefined,
      collectionHandle: filters.collection || undefined,
      collectionProductIds: collectionIds,
    });
    return sortStoreProducts(list, filters.sort);
  }, [allProducts, deferredSearch, filters, collectionProductMap]);

  const shown = filtered.slice(0, visible);
  const canLoadMoreLocal = visible < filtered.length;

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.collection) params.set("collection", filters.collection);
    if (filters.search.trim()) params.set("q", filters.search.trim());
    const qs = params.toString();
    router.replace(qs ? `/store?${qs}` : "/store", { scroll: false });
  }, [filters.collection, filters.search, router]);

  async function loadMore() {
    if (canLoadMoreLocal) {
      setVisible((v) => v + PAGE_SIZE);
      return;
    }
    if (!hasMoreRemote && cursor === null && extra.length === 0) {
      // Attempt remote page if seed was capped
      setLoadingMore(true);
      try {
        const page = await loadMoreStoreProducts({
          after: null,
          search: filters.search,
          collection: filters.collection || undefined,
          vendor: filters.brand || undefined,
          sort: filters.sort,
        });
        // If we already have these, advance with cursor from a fresh query
        setExtra((prev) => {
          const ids = new Set(prev.map((p) => p.id));
          const merged = [...prev];
          for (const p of page.products) {
            if (!ids.has(p.id) && !initialProducts.some((i) => i.id === p.id)) {
              merged.push(p);
            }
          }
          return merged;
        });
        setCursor(page.pageInfo.endCursor);
        setHasMoreRemote(page.pageInfo.hasNextPage);
        setVisible((v) => v + PAGE_SIZE);
      } finally {
        setLoadingMore(false);
      }
      return;
    }
    if (!hasMoreRemote || !cursor) return;
    setLoadingMore(true);
    try {
      const page = await loadMoreStoreProducts({
        after: cursor,
        search: filters.search,
        collection: filters.collection || undefined,
        vendor: filters.brand || undefined,
        sort: filters.sort,
      });
      setExtra((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        return [...prev, ...page.products.filter((p) => !ids.has(p.id))];
      });
      setCursor(page.pageInfo.endCursor);
      setHasMoreRemote(page.pageInfo.hasNextPage);
      setVisible((v) => v + PAGE_SIZE);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
        <StoreFilters
          facets={facets}
          value={filters}
          onChange={setFilters}
          resultCount={filtered.length}
        />

        <div>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-metal">
                Store
              </p>
              <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-text sm:text-4xl">
                The bay floor.
              </h1>
            </div>
            <p className="max-w-xs text-sm text-text-muted sm:text-right">
              Live inventory from Shopify. Filter by build, brand, and budget.
            </p>
          </div>

          {booting ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <StoreProductSkeleton key={i} />
              ))}
            </div>
          ) : shown.length === 0 ? (
            <EmptyState
              title="No products match"
              description="Try clearing filters or searching a different term. Everything here comes straight from Shopify."
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {shown.map((product, index) => (
                  <StoreProductCard
                    key={product.id}
                    product={product}
                    index={index}
                    onQuickView={setQuickView}
                  />
                ))}
              </div>

              {canLoadMoreLocal || hasMoreRemote ? (
                <div className="mt-12 flex justify-center">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={loadingMore}
                    onClick={() => void loadMore()}
                  >
                    {loadingMore ? "Loading…" : "Load more"}
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />
    </>
  );
}
