import {
  clearShopifyAccessTokenCache,
  getShopifyAccessToken,
} from "@/lib/shopify/auth";
import { adminEndpoint, isShopifyConfigured } from "@/lib/shopify/config";

export type ShopifyGqlError = {
  message: string;
};

/**
 * GraphQL Admin API request authenticated via Client Credentials access token.
 * (Dev Dashboard OAuth — not a manually pasted Storefront token.)
 */
export async function adminFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
  opts?: { cache?: RequestCache; next?: { revalidate?: number } },
): Promise<T> {
  if (!isShopifyConfigured()) {
    throw new Error("Shopify is not configured.");
  }

  const run = async (retried: boolean): Promise<T> => {
    const token = await getShopifyAccessToken();
    const init: RequestInit & { next?: { revalidate?: number } } = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    };
    if (opts?.next) {
      init.next = opts.next;
    } else {
      init.cache = opts?.cache ?? "no-store";
    }

    const res = await fetch(adminEndpoint(), init);

    if (res.status === 401 && !retried) {
      clearShopifyAccessTokenCache();
      return run(true);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `Shopify Admin HTTP ${res.status}${body ? `: ${body}` : ""}`,
      );
    }

    const json = (await res.json()) as {
      data?: T;
      errors?: ShopifyGqlError[];
    };

    if (json.errors?.length) {
      throw new Error(json.errors.map((e) => e.message).join("; "));
    }
    if (!json.data) {
      throw new Error("Shopify Admin returned no data.");
    }
    return json.data;
  };

  return run(false);
}

/** Catalog reads — short ISR cache when possible. */
export async function adminFetchCached<T>(
  query: string,
  variables?: Record<string, unknown>,
  revalidate = 60,
): Promise<T> {
  return adminFetch<T>(query, variables, {
    cache: undefined,
    next: { revalidate },
  });
}
