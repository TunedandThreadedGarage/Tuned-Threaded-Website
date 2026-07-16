import { adminFetch, adminFetchCached } from "@/lib/shopify/client";
import { isShopifyConfigured } from "@/lib/shopify/config";
import {
  STORE_COLLECTION_PRODUCTS_QUERY,
  STORE_COLLECTIONS_QUERY,
  STORE_PRODUCT_BY_HANDLE_QUERY,
  STORE_PRODUCTS_PAGE_QUERY,
  STORE_RELATED_PRODUCTS_QUERY,
} from "@/lib/shopify/queries";
import {
  mapCollection,
  mapStoreProduct,
  type AdminCollectionNode,
  type AdminProductNode,
  type ShopCollection,
  type StoreProduct,
} from "@/lib/shopify/types";
import type { StoreSort } from "@/features/store/constants";
import { sortKeyFor } from "@/features/store/constants";

export type StorePageResult = {
  products: StoreProduct[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
};

export type StoreFacets = {
  collections: ShopCollection[];
  brands: string[];
  makes: string[];
  models: string[];
  priceMin: number;
  priceMax: number;
};

function buildProductQuery(parts: {
  search?: string;
  vendor?: string;
  available?: "in_stock" | "out_of_stock" | "all";
  make?: string;
  model?: string;
}) {
  const q: string[] = ["status:active"];
  if (parts.search?.trim()) {
    const s = parts.search.trim().replace(/"/g, "");
    q.push(`title:*${s}* OR tag:*${s}* OR vendor:*${s}*`);
  }
  if (parts.vendor?.trim()) {
    q.push(`vendor:${JSON.stringify(parts.vendor.trim())}`);
  }
  if (parts.available === "in_stock") q.push("inventory_total:>0");
  if (parts.available === "out_of_stock") q.push("inventory_total:0");
  if (parts.make?.trim()) {
    q.push(`tag:make:${parts.make.trim()} OR tag:Make:${parts.make.trim()}`);
  }
  if (parts.model?.trim()) {
    q.push(
      `tag:model:${parts.model.trim()} OR tag:Model:${parts.model.trim()}`,
    );
  }
  return q.join(" ");
}

export async function fetchStoreProductsPage(input: {
  first?: number;
  after?: string | null;
  search?: string;
  collection?: string;
  vendor?: string;
  available?: "in_stock" | "out_of_stock" | "all";
  make?: string;
  model?: string;
  sort?: StoreSort;
}): Promise<StorePageResult> {
  if (!isShopifyConfigured()) {
    return { products: [], pageInfo: { hasNextPage: false, endCursor: null } };
  }

  const first = input.first ?? 12;
  const sort = sortKeyFor(input.sort ?? "featured");

  try {
    if (input.collection?.trim()) {
      const data = await adminFetchCached<{
        collectionByHandle: {
          products: {
            pageInfo: { hasNextPage: boolean; endCursor: string | null };
            nodes: AdminProductNode[];
          };
        } | null;
      }>(
        STORE_COLLECTION_PRODUCTS_QUERY,
        {
          handle: input.collection.trim(),
          first,
          after: input.after ?? null,
        },
        60,
      );
      const conn = data.collectionByHandle?.products;
      const products = (conn?.nodes ?? [])
        .map(mapStoreProduct)
        .filter((p): p is StoreProduct => Boolean(p));
      return {
        products,
        pageInfo: {
          hasNextPage: Boolean(conn?.pageInfo.hasNextPage),
          endCursor: conn?.pageInfo.endCursor ?? null,
        },
      };
    }

    const data = await adminFetchCached<{
      products: {
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
        nodes: AdminProductNode[];
      };
    }>(
      STORE_PRODUCTS_PAGE_QUERY,
      {
        first,
        after: input.after ?? null,
        query: buildProductQuery(input),
        sortKey: sort.sortKey,
        reverse: sort.reverse,
      },
      45,
    );

    const products = (data.products.nodes ?? [])
      .map(mapStoreProduct)
      .filter((p): p is StoreProduct => Boolean(p));

    return {
      products,
      pageInfo: {
        hasNextPage: Boolean(data.products.pageInfo.hasNextPage),
        endCursor: data.products.pageInfo.endCursor ?? null,
      },
    };
  } catch (e) {
    console.error("[shopify:store-products]", e);
    return { products: [], pageInfo: { hasNextPage: false, endCursor: null } };
  }
}

/** Load a larger active catalog once for client-side price / facet filtering. */
export async function fetchStoreCatalogSeed(limit = 100): Promise<{
  products: StoreProduct[];
  facets: StoreFacets;
}> {
  if (!isShopifyConfigured()) {
    return {
      products: [],
      facets: {
        collections: [],
        brands: [],
        makes: [],
        models: [],
        priceMin: 0,
        priceMax: 0,
      },
    };
  }

  const [page, collections] = await Promise.all([
    fetchStoreProductsPage({ first: limit, sort: "newest" }),
    fetchStoreCollections(50),
  ]);

  const products = page.products;
  const brands = [...new Set(products.map((p) => p.vendor).filter(Boolean))].sort();
  const makes = [
    ...new Set(products.map((p) => p.vehicleMake).filter(Boolean) as string[]),
  ].sort();
  const models = [
    ...new Set(products.map((p) => p.vehicleModel).filter(Boolean) as string[]),
  ].sort();
  const prices = products.map((p) => p.priceAmount);
  const priceMin = prices.length ? Math.floor(Math.min(...prices)) : 0;
  const priceMax = prices.length ? Math.ceil(Math.max(...prices)) : 0;

  return {
    products,
    facets: {
      collections,
      brands,
      makes,
      models,
      priceMin,
      priceMax: priceMax || 100,
    },
  };
}

export async function fetchStoreCollections(
  limit = 50,
): Promise<ShopCollection[]> {
  if (!isShopifyConfigured()) return [];
  try {
    const data = await adminFetchCached<{
      collections: { nodes: AdminCollectionNode[] };
    }>(STORE_COLLECTIONS_QUERY, { first: limit }, 120);
    return (data.collections.nodes ?? []).map(mapCollection);
  } catch (e) {
    console.error("[shopify:store-collections]", e);
    return [];
  }
}

export async function fetchStoreProductByHandle(
  handle: string,
): Promise<StoreProduct | null> {
  if (!isShopifyConfigured() || !handle) return null;
  try {
    const data = await adminFetchCached<{
      productByHandle: AdminProductNode | null;
    }>(STORE_PRODUCT_BY_HANDLE_QUERY, { handle }, 60);
    if (!data.productByHandle) return null;
    return mapStoreProduct(data.productByHandle);
  } catch (e) {
    console.error("[shopify:product]", e);
    return null;
  }
}

export async function fetchRelatedProducts(
  product: StoreProduct,
  limit = 4,
): Promise<StoreProduct[]> {
  if (!isShopifyConfigured()) return [];
  const type = product.productType.replace(/"/g, "");
  try {
    const data = await adminFetch<{
      products: { nodes: AdminProductNode[] };
    }>(STORE_RELATED_PRODUCTS_QUERY, {
      first: limit + 2,
      query: `status:active AND product_type:${JSON.stringify(type)}`,
    });
    return (data.products.nodes ?? [])
      .map(mapStoreProduct)
      .filter((p): p is StoreProduct => p != null && p.id !== product.id)
      .slice(0, limit);
  } catch (e) {
    console.error("[shopify:related]", e);
    return [];
  }
}

export function filterStoreProducts(
  products: StoreProduct[],
  filters: {
    search?: string;
    collectionHandle?: string;
    collectionProductIds?: Set<string>;
    brand?: string;
    priceMin?: number;
    priceMax?: number;
    available?: "all" | "in_stock" | "out_of_stock";
    make?: string;
    model?: string;
  },
): StoreProduct[] {
  const q = filters.search?.trim().toLowerCase() ?? "";
  return products.filter((p) => {
    if (q) {
      const hay = `${p.title} ${p.vendor} ${p.productType} ${p.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.brand && p.vendor !== filters.brand) return false;
    if (
      filters.priceMin != null &&
      Number.isFinite(filters.priceMin) &&
      p.priceAmount < filters.priceMin
    ) {
      return false;
    }
    if (
      filters.priceMax != null &&
      Number.isFinite(filters.priceMax) &&
      p.priceAmount > filters.priceMax
    ) {
      return false;
    }
    if (filters.available === "in_stock" && !p.available) return false;
    if (filters.available === "out_of_stock" && p.available) return false;
    if (filters.make && p.vehicleMake !== filters.make) return false;
    if (filters.model && p.vehicleModel !== filters.model) return false;
    if (filters.collectionProductIds && filters.collectionHandle) {
      if (!filters.collectionProductIds.has(p.id)) return false;
    }
    return true;
  });
}

export function sortStoreProducts(
  products: StoreProduct[],
  sort: StoreSort,
): StoreProduct[] {
  const list = [...products];
  switch (sort) {
    case "newest":
      return list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    case "best_selling":
      // Proxy: available first, then newest (Admin API has no sales sort).
      return list.sort((a, b) => {
        if (a.available !== b.available) return a.available ? -1 : 1;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    case "price_asc":
      return list.sort((a, b) => a.priceAmount - b.priceAmount);
    case "price_desc":
      return list.sort((a, b) => b.priceAmount - a.priceAmount);
    case "alpha":
      return list.sort((a, b) => a.title.localeCompare(b.title));
    case "featured":
    default:
      return list.sort((a, b) => {
        if (a.onSale !== b.onSale) return a.onSale ? -1 : 1;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
  }
}
