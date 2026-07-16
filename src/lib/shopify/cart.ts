import { cookies } from "next/headers";
import { adminFetch } from "@/lib/shopify/client";
import {
  CART_COOKIE,
  isShopifyConfigured,
  shopifyStoreDomain,
} from "@/lib/shopify/config";
import { VARIANT_QUERY } from "@/lib/shopify/queries";
import {
  buildShopifyCartCheckoutUrl,
  type ShopCart,
  type ShopCartLine,
} from "@/lib/shopify/types";

type CookieCart = { lines: ShopCartLine[] };

async function readCookieCart(): Promise<CookieCart> {
  const jar = await cookies();
  const raw = jar.get(CART_COOKIE)?.value;
  if (!raw) return { lines: [] };
  try {
    const parsed = JSON.parse(raw) as CookieCart;
    if (!parsed?.lines || !Array.isArray(parsed.lines)) return { lines: [] };
    return { lines: parsed.lines };
  } catch {
    return { lines: [] };
  }
}

async function writeCookieCart(cart: CookieCart) {
  const jar = await cookies();
  jar.set(CART_COOKIE, JSON.stringify(cart), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

function toShopCart(lines: ShopCartLine[]): ShopCart {
  const domain = shopifyStoreDomain();
  const totalQuantity = lines.reduce((sum, l) => sum + l.quantity, 0);
  const currencyCode = lines[0]?.currencyCode ?? "USD";
  const subtotalAmount = lines.reduce(
    (sum, l) => sum + Number(l.amount) * l.quantity,
    0,
  );
  return {
    id: "local",
    checkoutUrl: buildShopifyCartCheckoutUrl(domain, lines),
    totalQuantity,
    subtotal:
      lines.length > 0
        ? { amount: subtotalAmount.toFixed(2), currencyCode }
        : null,
    lines,
  };
}

export async function getShopifyCart(): Promise<ShopCart | null> {
  if (!isShopifyConfigured()) return null;
  const { lines } = await readCookieCart();
  if (!lines.length) return null;
  return toShopCart(lines);
}

export async function addShopifyLine(
  merchandiseId: string,
  quantity = 1,
): Promise<ShopCart> {
  if (!isShopifyConfigured()) {
    throw new Error("Shopify is not configured.");
  }
  const qty =
    Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;

  const data = await adminFetch<{
    productVariant: {
      id: string;
      title: string;
      availableForSale: boolean;
      price: string;
      image: { url: string } | null;
      product: {
        title: string;
        featuredImage: { url: string } | null;
      };
    } | null;
    shop: { currencyCode: string };
  }>(VARIANT_QUERY, { id: merchandiseId });

  const variant = data.productVariant;
  if (!variant) throw new Error("Product variant not found.");
  if (!variant.availableForSale) throw new Error("That variant is sold out.");

  const currencyCode = data.shop.currencyCode || "USD";
  const cart = await readCookieCart();
  const existing = cart.lines.find((l) => l.merchandiseId === merchandiseId);
  if (existing) {
    existing.quantity += qty;
  } else {
    cart.lines.push({
      id: merchandiseId,
      merchandiseId,
      quantity: qty,
      title: variant.product.title,
      variantTitle:
        variant.title !== "Default Title" ? variant.title : null,
      imageUrl: variant.image?.url ?? variant.product.featuredImage?.url ?? null,
      amount: variant.price,
      currencyCode,
    });
  }

  await writeCookieCart(cart);
  return toShopCart(cart.lines);
}

export async function updateShopifyLine(
  lineId: string,
  quantity: number,
): Promise<ShopCart | null> {
  const cart = await readCookieCart();
  const line = cart.lines.find((l) => l.id === lineId);
  if (!line) return toShopCart(cart.lines);
  if (quantity <= 0) {
    cart.lines = cart.lines.filter((l) => l.id !== lineId);
  } else {
    line.quantity = Math.floor(quantity);
  }
  await writeCookieCart(cart);
  return toShopCart(cart.lines);
}

export async function removeShopifyLine(
  lineId: string,
): Promise<ShopCart | null> {
  const cart = await readCookieCart();
  cart.lines = cart.lines.filter((l) => l.id !== lineId);
  await writeCookieCart(cart);
  return cart.lines.length ? toShopCart(cart.lines) : null;
}

export async function getCheckoutUrl(): Promise<string | null> {
  const cart = await getShopifyCart();
  if (!cart?.lines.length) return null;
  return cart.checkoutUrl;
}
