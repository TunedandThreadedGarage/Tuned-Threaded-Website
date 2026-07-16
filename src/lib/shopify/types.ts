export type Money = {
  amount: string;
  currencyCode: string;
};

export type ShopProduct = {
  id: string;
  handle: string;
  name: string;
  category: string;
  price: string;
  subtitle: string;
  imageUrl: string | null;
  variantId: string | null;
  available: boolean;
  vendor?: string;
  priceAmount?: number;
  compareAtAmount?: number | null;
  onSale?: boolean;
  tags?: string[];
};

export type ShopCollection = {
  id: string;
  handle: string;
  title: string;
  description: string;
  href: string;
  productCount?: number;
};

export type ShopCartLine = {
  id: string;
  quantity: number;
  title: string;
  variantTitle: string | null;
  merchandiseId: string;
  imageUrl: string | null;
  amount: string;
  currencyCode: string;
};

export type ShopCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  subtotal: Money | null;
  lines: ShopCartLine[];
};

type AdminImage = { url: string; altText: string | null } | null;
type AdminMoney = { amount: string; currencyCode: string };

export type AdminVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: string;
  compareAtPrice?: string | null;
  sku?: string | null;
  selectedOptions?: Array<{ name: string; value: string }>;
  image?: AdminImage;
};

export type AdminProductNode = {
  id: string;
  handle: string;
  title: string;
  descriptionHtml?: string;
  productType: string;
  vendor?: string;
  status: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  featuredImage: AdminImage;
  priceRangeV2: {
    minVariantPrice: AdminMoney;
    maxVariantPrice?: AdminMoney;
  };
  compareAtPriceRange?: {
    minVariantCompareAtPrice?: AdminMoney | null;
  } | null;
  media?: {
    nodes: Array<{
      id?: string;
      image?: { url: string; altText: string | null } | null;
    }>;
  };
  options?: Array<{ name: string; values: string[] }>;
  variants: { nodes: AdminVariant[] };
};

export type AdminCollectionNode = {
  id: string;
  handle: string;
  title: string;
  description: string;
  productsCount?: { count: number } | null;
};

export type StoreProduct = {
  id: string;
  handle: string;
  title: string;
  descriptionHtml: string;
  productType: string;
  vendor: string;
  tags: string[];
  available: boolean;
  imageUrl: string | null;
  images: Array<{ url: string; alt: string | null }>;
  priceAmount: number;
  priceFormatted: string;
  compareAtAmount: number | null;
  compareAtFormatted: string | null;
  onSale: boolean;
  currencyCode: string;
  vehicleMake: string | null;
  vehicleModel: string | null;
  options: Array<{ name: string; values: string[] }>;
  variants: Array<{
    id: string;
    title: string;
    available: boolean;
    priceAmount: number;
    priceFormatted: string;
    compareAtAmount: number | null;
    sku: string | null;
    imageUrl: string | null;
    selectedOptions: Array<{ name: string; value: string }>;
  }>;
  defaultVariantId: string | null;
  createdAt: string;
};

export function formatMoney(money: Money | null | undefined): string {
  if (!money) return "";
  const amount = Number(money.amount);
  if (!Number.isFinite(amount)) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: money.currencyCode || "USD",
  }).format(amount);
}

export function formatPriceString(
  amount: string | number,
  currencyCode = "USD",
): string {
  return formatMoney({ amount: String(amount), currencyCode });
}

function parseTagValue(tags: string[], prefixes: string[]): string | null {
  for (const tag of tags) {
    const t = tag.trim();
    for (const prefix of prefixes) {
      const re = new RegExp(`^${prefix}\\s*[:=]\\s*(.+)$`, "i");
      const m = t.match(re);
      if (m?.[1]) return m[1].trim();
    }
  }
  return null;
}

export function mapStoreProduct(node: AdminProductNode): StoreProduct | null {
  if (node.status && node.status !== "ACTIVE") return null;

  const currency =
    node.priceRangeV2.minVariantPrice.currencyCode || "USD";
  const priceAmount = Number(node.priceRangeV2.minVariantPrice.amount);
  const compareRaw =
    node.compareAtPriceRange?.minVariantCompareAtPrice?.amount;
  const compareAtAmount =
    compareRaw && Number(compareRaw) > priceAmount ? Number(compareRaw) : null;

  const tags = node.tags ?? [];
  const images: StoreProduct["images"] = [];
  if (node.featuredImage?.url) {
    images.push({
      url: node.featuredImage.url,
      alt: node.featuredImage.altText,
    });
  }
  for (const m of node.media?.nodes ?? []) {
    const url = m.image?.url;
    if (!url) continue;
    if (images.some((i) => i.url === url)) continue;
    images.push({ url, alt: m.image?.altText ?? null });
  }

  const variants = node.variants.nodes.map((v) => {
    const amount = Number(v.price);
    const compare =
      v.compareAtPrice && Number(v.compareAtPrice) > amount
        ? Number(v.compareAtPrice)
        : null;
    return {
      id: v.id,
      title: v.title,
      available: Boolean(v.availableForSale),
      priceAmount: amount,
      priceFormatted: formatPriceString(amount, currency),
      compareAtAmount: compare,
      sku: v.sku ?? null,
      imageUrl: v.image?.url ?? null,
      selectedOptions: v.selectedOptions ?? [],
    };
  });

  const defaultVariant =
    variants.find((v) => v.available) ?? variants[0] ?? null;

  return {
    id: node.id,
    handle: node.handle,
    title: node.title,
    descriptionHtml: node.descriptionHtml ?? "",
    productType: node.productType?.trim() || "Gear",
    vendor: node.vendor?.trim() || "Tuned & Threaded",
    tags,
    available: variants.some((v) => v.available),
    imageUrl: images[0]?.url ?? null,
    images,
    priceAmount: Number.isFinite(priceAmount) ? priceAmount : 0,
    priceFormatted: formatPriceString(
      Number.isFinite(priceAmount) ? priceAmount : 0,
      currency,
    ),
    compareAtAmount,
    compareAtFormatted: compareAtAmount
      ? formatPriceString(compareAtAmount, currency)
      : null,
    onSale: compareAtAmount != null,
    currencyCode: currency,
    vehicleMake: parseTagValue(tags, ["make", "vehicle-make", "vehicle_make"]),
    vehicleModel: parseTagValue(tags, [
      "model",
      "vehicle-model",
      "vehicle_model",
    ]),
    options: node.options ?? [],
    variants,
    defaultVariantId: defaultVariant?.id ?? null,
    createdAt: node.createdAt ?? node.updatedAt ?? new Date().toISOString(),
  };
}

export function mapProduct(node: AdminProductNode): ShopProduct {
  const store = mapStoreProduct(node);
  if (!store) {
    return {
      id: node.id,
      handle: node.handle,
      name: node.title,
      category: node.productType || "Collection",
      price: formatMoney(node.priceRangeV2.minVariantPrice),
      subtitle: "Sold out",
      imageUrl: node.featuredImage?.url ?? null,
      variantId: null,
      available: false,
    };
  }
  return {
    id: store.id,
    handle: store.handle,
    name: store.title,
    category: store.productType,
    price: store.priceFormatted,
    subtitle: store.available ? "In stock" : "Sold out",
    imageUrl: store.imageUrl,
    variantId: store.defaultVariantId,
    available: store.available,
    vendor: store.vendor,
    priceAmount: store.priceAmount,
    compareAtAmount: store.compareAtAmount,
    onSale: store.onSale,
    tags: store.tags,
  };
}

export function mapCollection(node: AdminCollectionNode): ShopCollection {
  return {
    id: node.id,
    handle: node.handle,
    title: node.title,
    description: node.description?.trim() || "Explore the collection.",
    href: `/store?collection=${encodeURIComponent(node.handle)}`,
    productCount: node.productsCount?.count,
  };
}

export function variantNumericId(gid: string): string {
  const match = gid.match(/ProductVariant\/(\d+)/i);
  return match?.[1] ?? gid;
}

export function buildShopifyCartCheckoutUrl(
  domain: string,
  lines: Array<{ merchandiseId: string; quantity: number }>,
): string {
  const path = lines
    .filter((l) => l.quantity > 0)
    .map((l) => `${variantNumericId(l.merchandiseId)}:${l.quantity}`)
    .join(",");
  if (!path) return `https://${domain}/cart`;
  return `https://${domain}/cart/${path}`;
}

export function buildBuyNowUrl(
  domain: string,
  merchandiseId: string,
  quantity = 1,
): string {
  return buildShopifyCartCheckoutUrl(domain, [
    { merchandiseId, quantity },
  ]);
}
