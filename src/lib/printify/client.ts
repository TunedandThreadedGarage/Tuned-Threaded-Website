import {
  PRINTIFY_API_BASE,
  PRINTIFY_USER_AGENT,
  isPrintifyConfigured,
  printifyApiToken,
  printifyShopId,
} from "@/lib/printify/config";

export class PrintifyApiError extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string) {
    super(`Printify API ${status}${body ? `: ${body}` : ""}`);
    this.name = "PrintifyApiError";
    this.status = status;
    this.body = body;
  }
}

export async function printifyFetch<T>(
  path: string,
  init?: RequestInit & { shopScoped?: boolean },
): Promise<T> {
  if (!isPrintifyConfigured()) {
    throw new Error(
      "Printify is not configured. Set PRINTIFY_API_TOKEN and PRINTIFY_SHOP_ID.",
    );
  }

  const token = printifyApiToken();
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("User-Agent", PRINTIFY_USER_AGENT);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let urlPath = path.startsWith("/") ? path : `/${path}`;
  if (init?.shopScoped) {
    const shopId = printifyShopId();
    urlPath = urlPath.replace("{shop_id}", String(shopId));
  }

  const res = await fetch(`${PRINTIFY_API_BASE}${urlPath}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new PrintifyApiError(res.status, body.slice(0, 800));
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export function requireShopId(): number {
  const id = printifyShopId();
  if (id == null) {
    throw new Error("PRINTIFY_SHOP_ID is not set.");
  }
  return id;
}
