import { adminFetchCached } from "@/lib/shopify/client";
import { isShopifyConfigured } from "@/lib/shopify/config";
import {
  COLLECTIONS_QUERY,
  COLLECTION_PRODUCTS_QUERY,
  PRODUCTS_QUERY,
} from "@/lib/shopify/queries";
import {
  mapCollection,
  mapProduct,
  type AdminCollectionNode,
  type AdminProductNode,
  type ShopCollection,
  type ShopProduct,
} from "@/lib/shopify/types";

export async function getShopProducts(limit = 8): Promise<ShopProduct[]> {
  if (!isShopifyConfigured()) return [];

  try {
    const featuredHandle = process.env.SHOPIFY_FEATURED_COLLECTION?.trim();
    if (featuredHandle) {
      const data = await adminFetchCached<{
        collectionByHandle: {
          products: { nodes: AdminProductNode[] };
        } | null;
      }>(COLLECTION_PRODUCTS_QUERY, { handle: featuredHandle, first: limit });
      const nodes = data.collectionByHandle?.products.nodes ?? [];
      const active = nodes.filter((n) => n.status === "ACTIVE");
      if (active.length) return active.map(mapProduct);
    }

    const data = await adminFetchCached<{
      products: { nodes: AdminProductNode[] };
    }>(PRODUCTS_QUERY, { first: limit });
    return (data.products.nodes ?? [])
      .filter((n) => n.status === "ACTIVE")
      .map(mapProduct);
  } catch (e) {
    console.error("[shopify:products]", e);
    return [];
  }
}

export async function getShopCollections(limit = 4): Promise<ShopCollection[]> {
  if (!isShopifyConfigured()) return [];

  try {
    const data = await adminFetchCached<{
      collections: { nodes: AdminCollectionNode[] };
    }>(COLLECTIONS_QUERY, { first: limit });
    return (data.collections.nodes ?? []).map(mapCollection);
  } catch (e) {
    console.error("[shopify:collections]", e);
    return [];
  }
}
