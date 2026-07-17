import { printifyFetch, requireShopId } from "@/lib/printify/client";
import type {
  PrintifyBlueprint,
  PrintifyPaginated,
  PrintifyPrintProvider,
  PrintifyProduct,
  PrintifyProductCreate,
  PrintifyPublishRequest,
  PrintifyShop,
  PrintifyUpload,
  PrintifyVariantsResponse,
  PrintifyOrder,
} from "@/lib/printify/types";

export {
  isPrintifyConfigured,
  printifyApiToken,
  printifyShopId,
  isAdminEmail,
  adminEmails,
} from "@/lib/printify/config";

export type * from "@/lib/printify/types";

/** GET /v1/shops.json */
export async function getShops(): Promise<PrintifyShop[]> {
  return printifyFetch<PrintifyShop[]>("/shops.json");
}

/** GET /v1/catalog/blueprints.json */
export async function getBlueprints(): Promise<PrintifyBlueprint[]> {
  return printifyFetch<PrintifyBlueprint[]>("/catalog/blueprints.json");
}

/** GET /v1/catalog/blueprints/{id}.json */
export async function getBlueprint(
  blueprintId: number,
): Promise<PrintifyBlueprint> {
  return printifyFetch<PrintifyBlueprint>(
    `/catalog/blueprints/${blueprintId}.json`,
  );
}

/** GET /v1/catalog/print_providers.json */
export async function getPrintProviders(): Promise<PrintifyPrintProvider[]> {
  return printifyFetch<PrintifyPrintProvider[]>(
    "/catalog/print_providers.json",
  );
}

/** GET /v1/catalog/print_providers/{id}.json */
export async function getPrintProvider(
  printProviderId: number,
): Promise<PrintifyPrintProvider> {
  return printifyFetch<PrintifyPrintProvider>(
    `/catalog/print_providers/${printProviderId}.json`,
  );
}

/** GET /v1/catalog/blueprints/{id}/print_providers.json */
export async function getBlueprintPrintProviders(
  blueprintId: number,
): Promise<PrintifyPrintProvider[]> {
  return printifyFetch<PrintifyPrintProvider[]>(
    `/catalog/blueprints/${blueprintId}/print_providers.json`,
  );
}

/** GET /v1/catalog/blueprints/{id}/print_providers/{pp}/variants.json */
export async function getBlueprintVariants(
  blueprintId: number,
  printProviderId: number,
  opts?: { showOutOfStock?: boolean },
): Promise<PrintifyVariantsResponse> {
  const q = opts?.showOutOfStock ? "?show-out-of-stock=1" : "";
  return printifyFetch<PrintifyVariantsResponse>(
    `/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json${q}`,
  );
}

/**
 * POST /v1/uploads/images.json
 * Provide either a public `url` or base64 `contents`.
 */
export async function uploadImage(input: {
  file_name: string;
  url?: string;
  contents?: string;
}): Promise<PrintifyUpload> {
  if (!input.url && !input.contents) {
    throw new Error("Provide image url or base64 contents.");
  }
  return printifyFetch<PrintifyUpload>("/uploads/images.json", {
    method: "POST",
    body: JSON.stringify({
      file_name: input.file_name,
      ...(input.url ? { url: input.url } : {}),
      ...(input.contents ? { contents: input.contents } : {}),
    }),
  });
}

/** POST /v1/shops/{shop_id}/products.json */
export async function createProduct(
  payload: PrintifyProductCreate,
  shopId = requireShopId(),
): Promise<PrintifyProduct> {
  return printifyFetch<PrintifyProduct>(
    `/shops/${shopId}/products.json`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

/** PUT /v1/shops/{shop_id}/products/{product_id}.json */
export async function updateProduct(
  productId: string,
  payload: Partial<PrintifyProductCreate>,
  shopId = requireShopId(),
): Promise<PrintifyProduct> {
  return printifyFetch<PrintifyProduct>(
    `/shops/${shopId}/products/${productId}.json`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}

/** DELETE /v1/shops/{shop_id}/products/{product_id}.json */
export async function deleteProduct(
  productId: string,
  shopId = requireShopId(),
): Promise<void> {
  await printifyFetch<void>(`/shops/${shopId}/products/${productId}.json`, {
    method: "DELETE",
  });
}

/** GET /v1/shops/{shop_id}/products/{product_id}.json */
export async function getProduct(
  productId: string,
  shopId = requireShopId(),
): Promise<PrintifyProduct> {
  return printifyFetch<PrintifyProduct>(
    `/shops/${shopId}/products/${productId}.json`,
  );
}

/**
 * POST /v1/shops/{shop_id}/products/{product_id}/publish.json
 * Publishes to the shop's connected sales channel (e.g. Shopify).
 */
export async function publishProduct(
  productId: string,
  options?: Partial<PrintifyPublishRequest>,
  shopId = requireShopId(),
): Promise<void> {
  const body: PrintifyPublishRequest = {
    title: true,
    description: true,
    images: true,
    variants: true,
    tags: true,
    keyFeatures: true,
    shipping_template: true,
    ...options,
  };
  await printifyFetch<void>(
    `/shops/${shopId}/products/${productId}/publish.json`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

/** GET /v1/shops/{shop_id}/orders.json */
export async function getOrders(opts?: {
  page?: number;
  limit?: number;
  status?: string;
  shopId?: number;
}): Promise<PrintifyPaginated<PrintifyOrder>> {
  const shopId = opts?.shopId ?? requireShopId();
  const params = new URLSearchParams();
  if (opts?.page) params.set("page", String(opts.page));
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.status) params.set("status", opts.status);
  const qs = params.toString();
  return printifyFetch<PrintifyPaginated<PrintifyOrder>>(
    `/shops/${shopId}/orders.json${qs ? `?${qs}` : ""}`,
  );
}

/** GET /v1/shops/{shop_id}/orders/{order_id}.json */
export async function getOrder(
  orderId: string,
  shopId = requireShopId(),
): Promise<PrintifyOrder> {
  return printifyFetch<PrintifyOrder>(
    `/shops/${shopId}/orders/${orderId}.json`,
  );
}

/**
 * Convenience: create a product then publish it to the connected Shopify shop.
 */
export async function createAndPublishProduct(
  payload: PrintifyProductCreate,
): Promise<PrintifyProduct> {
  const product = await createProduct(payload);
  await publishProduct(product.id);
  return product;
}
