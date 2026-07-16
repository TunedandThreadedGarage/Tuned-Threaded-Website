"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  addShopifyLine,
  getCheckoutUrl,
  getShopifyCart,
  removeShopifyLine,
  updateShopifyLine,
} from "@/lib/shopify/cart";
import { isShopifyConfigured, shopifyStoreDomain } from "@/lib/shopify/config";
import { buildBuyNowUrl, type ShopCart } from "@/lib/shopify/types";
import {
  fetchStoreCatalogSeed,
  fetchStoreProductByHandle,
  fetchStoreProductsPage,
  fetchRelatedProducts,
} from "@/lib/shopify/store-catalog";
import type { StoreSort } from "@/features/store/constants";

const emptyCart: ShopCart = {
  id: "local",
  checkoutUrl: "",
  totalQuantity: 0,
  subtotal: null,
  lines: [],
};

export async function getShopifyCartSnapshot(): Promise<ShopCart> {
  if (!isShopifyConfigured()) return emptyCart;
  const cart = await getShopifyCart();
  return cart ?? emptyCart;
}

export async function addToCartForm(formData: FormData) {
  if (!isShopifyConfigured()) {
    throw new Error("Shop is not connected yet.");
  }
  const merchandiseId = String(formData.get("merchandiseId") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 1);
  if (!merchandiseId) throw new Error("Missing product variant.");

  await addShopifyLine(merchandiseId, quantity);
  revalidatePath("/store");
  redirect("/store?cart=open");
}

export async function addToCartAction(input: {
  merchandiseId: string;
  quantity?: number;
}): Promise<{ ok: true; cart: ShopCart } | { error: string }> {
  try {
    if (!isShopifyConfigured()) return { error: "Shop is not connected yet." };
    if (!input.merchandiseId) return { error: "Missing product variant." };
    const cart = await addShopifyLine(input.merchandiseId, input.quantity ?? 1);
    revalidatePath("/store");
    return { ok: true, cart };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not add to cart." };
  }
}

export async function buyNowAction(formData: FormData) {
  if (!isShopifyConfigured()) throw new Error("Shop is not connected yet.");
  const merchandiseId = String(formData.get("merchandiseId") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 1);
  if (!merchandiseId) throw new Error("Missing product variant.");

  const domain = shopifyStoreDomain();
  redirect(buildBuyNowUrl(domain, merchandiseId, quantity));
}

export async function removeShopifyCartLine(lineId: string) {
  await removeShopifyLine(lineId);
  revalidatePath("/store");
}

export async function removeShopifyCartLineAction(
  lineId: string,
): Promise<ShopCart> {
  const cart = await removeShopifyLine(lineId);
  revalidatePath("/store");
  return cart ?? emptyCart;
}

export async function updateShopifyCartLine(formData: FormData) {
  const lineId = String(formData.get("lineId") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 1);
  if (!lineId) return;
  await updateShopifyLine(lineId, quantity);
  revalidatePath("/store");
}

export async function updateShopifyCartLineAction(
  lineId: string,
  quantity: number,
): Promise<ShopCart> {
  const cart = await updateShopifyLine(lineId, quantity);
  revalidatePath("/store");
  return cart ?? emptyCart;
}

export async function startShopifyCheckout() {
  const url = await getCheckoutUrl();
  if (!url) throw new Error("Cart is empty.");
  redirect(url);
}

export async function loadMoreStoreProducts(input: {
  after: string | null;
  search?: string;
  collection?: string;
  vendor?: string;
  sort?: StoreSort;
}) {
  return fetchStoreProductsPage({
    first: 12,
    after: input.after,
    search: input.search,
    collection: input.collection,
    vendor: input.vendor,
    sort: input.sort,
  });
}

export async function getStoreSeedAction() {
  return fetchStoreCatalogSeed(120);
}

export async function getStoreProductAction(handle: string) {
  const product = await fetchStoreProductByHandle(handle);
  if (!product) return null;
  const related = await fetchRelatedProducts(product, 4);
  return { product, related };
}
