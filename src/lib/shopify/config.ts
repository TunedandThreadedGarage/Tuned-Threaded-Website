/** Shopify Admin API via Dev Dashboard Client Credentials OAuth. */

export const SHOPIFY_API_VERSION = "2025-01";

/** `your-store` or `your-store.myshopify.com` */
export function shopifyStoreDomain() {
  const raw =
    process.env.SHOPIFY_STORE_DOMAIN?.trim() ||
    process.env.SHOPIFY_SHOP?.trim() ||
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN?.trim() ||
    "";
  if (!raw) return "";
  const cleaned = raw.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return cleaned.includes(".") ? cleaned : `${cleaned}.myshopify.com`;
}

export function shopifyShopSubdomain() {
  const domain = shopifyStoreDomain();
  if (!domain) return "";
  return domain.replace(/\.myshopify\.com$/i, "");
}

export function shopifyClientId() {
  return process.env.SHOPIFY_CLIENT_ID?.trim() || "";
}

export function shopifyClientSecret() {
  return process.env.SHOPIFY_CLIENT_SECRET?.trim() || "";
}

/** Dev Dashboard Client ID + Secret + shop (Client Credentials grant). */
export function isShopifyConfigured() {
  return Boolean(
    shopifyStoreDomain() && shopifyClientId() && shopifyClientSecret(),
  );
}

/** Same credentials — Admin GraphQL for products, collections, and orders. */
export function isShopifyAdminConfigured() {
  return isShopifyConfigured();
}

export function adminEndpoint() {
  const domain = shopifyStoreDomain();
  return `https://${domain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;
}

export function tokenEndpoint() {
  const domain = shopifyStoreDomain();
  return `https://${domain}/admin/oauth/access_token`;
}

/** Cookie holding serialized local cart lines (Admin OAuth has no Storefront Cart). */
export const CART_COOKIE = "tt_shopify_cart";
