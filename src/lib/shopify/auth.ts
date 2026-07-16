import {
  shopifyClientId,
  shopifyClientSecret,
  isShopifyConfigured,
  tokenEndpoint,
} from "@/lib/shopify/config";

type TokenResponse = {
  access_token: string;
  scope?: string;
  expires_in: number;
};

type Cache = {
  accessToken: string;
  expiresAtMs: number;
};

declare global {
  var __ttShopifyTokenCache: Cache | undefined;
}

/**
 * Exchange Dev Dashboard Client ID + Secret for an Admin API access token.
 * Tokens last ~24h; cached in-process and refreshed a minute before expiry.
 * @see https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/client-credentials-grant
 */
export async function getShopifyAccessToken(): Promise<string> {
  if (!isShopifyConfigured()) {
    throw new Error(
      "Shopify is not configured. Set SHOPIFY_STORE_DOMAIN (or SHOPIFY_SHOP), SHOPIFY_CLIENT_ID, and SHOPIFY_CLIENT_SECRET.",
    );
  }

  const cached = globalThis.__ttShopifyTokenCache;
  if (cached && Date.now() < cached.expiresAtMs - 60_000) {
    return cached.accessToken;
  }

  const res = await fetch(tokenEndpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: shopifyClientId(),
      client_secret: shopifyClientSecret(),
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Shopify client_credentials token exchange failed (${res.status}): ${body || res.statusText}`,
    );
  }

  const json = (await res.json()) as TokenResponse;
  if (!json.access_token) {
    throw new Error("Shopify token response missing access_token.");
  }

  const expiresIn = Number(json.expires_in) || 86_399;
  globalThis.__ttShopifyTokenCache = {
    accessToken: json.access_token,
    expiresAtMs: Date.now() + expiresIn * 1000,
  };

  return json.access_token;
}

/** Clear cached token (e.g. after 401). */
export function clearShopifyAccessTokenCache() {
  globalThis.__ttShopifyTokenCache = undefined;
}
