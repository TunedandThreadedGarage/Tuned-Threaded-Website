"use server";

import { createClient } from "@/lib/supabase/server";
import {
  createAndPublishProduct,
  getBlueprintPrintProviders,
  getBlueprintVariants,
  getBlueprints,
  getOrders,
  getShops,
  isAdminEmail,
  isPrintifyConfigured,
  uploadImage,
  type PrintifyBlueprint,
  type PrintifyCatalogVariant,
  type PrintifyPrintProvider,
  type PrintifyProduct,
  type PrintifyShop,
} from "@/lib/printify";

export type PrintifyActionResult<T = undefined> = {
  error?: string;
  data?: T;
};

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in required.");
  if (!isAdminEmail(user.email)) {
    throw new Error(
      "Admin access required. Add your email to ADMIN_EMAILS in environment variables.",
    );
  }
  if (!isPrintifyConfigured()) {
    throw new Error(
      "Printify is not configured. Set PRINTIFY_API_TOKEN and PRINTIFY_SHOP_ID.",
    );
  }
  return user;
}

export async function loadPrintifyAdminBootstrap(): Promise<
  PrintifyActionResult<{
    shops: PrintifyShop[];
    blueprints: PrintifyBlueprint[];
  }>
> {
  try {
    await requireAdmin();
    const [shops, blueprints] = await Promise.all([getShops(), getBlueprints()]);
    return { data: { shops, blueprints } };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to load Printify." };
  }
}

export async function loadPrintifyProvidersAction(
  blueprintId: number,
): Promise<PrintifyActionResult<PrintifyPrintProvider[]>> {
  try {
    await requireAdmin();
    if (!blueprintId) return { error: "Blueprint required." };
    const providers = await getBlueprintPrintProviders(blueprintId);
    return { data: providers };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to load print providers.",
    };
  }
}

export async function loadPrintifyVariantsAction(input: {
  blueprintId: number;
  printProviderId: number;
}): Promise<
  PrintifyActionResult<{
    variants: PrintifyCatalogVariant[];
    colors: string[];
    sizes: string[];
    positions: string[];
  }>
> {
  try {
    await requireAdmin();
    const res = await getBlueprintVariants(
      input.blueprintId,
      input.printProviderId,
      { showOutOfStock: true },
    );
    const variants = res.variants ?? [];
    const colors = [
      ...new Set(
        variants
          .map((v) => String(v.options?.color ?? "").trim())
          .filter(Boolean),
      ),
    ].sort();
    const sizes = [
      ...new Set(
        variants
          .map((v) => String(v.options?.size ?? "").trim())
          .filter(Boolean),
      ),
    ];
    const sizeOrder = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];
    sizes.sort((a, b) => {
      const ia = sizeOrder.indexOf(a.toUpperCase());
      const ib = sizeOrder.indexOf(b.toUpperCase());
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
    const positions = [
      ...new Set(
        variants.flatMap((v) =>
          (v.placeholders ?? []).map((p) => p.position).filter(Boolean),
        ),
      ),
    ];
    return { data: { variants, colors, sizes, positions } };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to load variants.",
    };
  }
}

export async function uploadPrintifyArtworkAction(input: {
  fileName: string;
  base64Contents: string;
}): Promise<PrintifyActionResult<{ id: string; preview_url: string }>> {
  try {
    await requireAdmin();
    const fileName = input.fileName.trim();
    const contents = input.base64Contents.trim();
    if (!fileName || !contents) return { error: "Artwork file required." };

    // Strip data-URL prefix if present
    const raw = contents.includes(",")
      ? contents.slice(contents.indexOf(",") + 1)
      : contents;

    const upload = await uploadImage({
      file_name: fileName,
      contents: raw,
    });
    return {
      data: { id: upload.id, preview_url: upload.preview_url },
    };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Upload failed.",
    };
  }
}

export async function createAndPublishPrintifyProductAction(input: {
  title: string;
  description: string;
  blueprintId: number;
  printProviderId: number;
  imageId: string;
  retailPriceDollars: number;
  colors: string[];
  sizes: string[];
  position?: string;
}): Promise<PrintifyActionResult<{ product: PrintifyProduct }>> {
  try {
    await requireAdmin();

    const title = input.title.trim();
    const description = input.description.trim();
    if (!title) return { error: "Title is required." };
    if (!input.imageId) return { error: "Upload artwork first." };
    if (!input.blueprintId || !input.printProviderId) {
      return { error: "Select a blueprint and print provider." };
    }
    if (!input.colors.length || !input.sizes.length) {
      return { error: "Select at least one color and one size." };
    }

    const priceCents = Math.round(Number(input.retailPriceDollars) * 100);
    if (!Number.isFinite(priceCents) || priceCents < 100) {
      return { error: "Retail price must be at least $1.00." };
    }

    const catalog = await getBlueprintVariants(
      input.blueprintId,
      input.printProviderId,
      { showOutOfStock: true },
    );
    const colorSet = new Set(input.colors.map((c) => c.toLowerCase()));
    const sizeSet = new Set(input.sizes.map((s) => s.toLowerCase()));

    const selected = (catalog.variants ?? []).filter((v) => {
      const color = String(v.options?.color ?? "").toLowerCase();
      const size = String(v.options?.size ?? "").toLowerCase();
      return colorSet.has(color) && sizeSet.has(size);
    });

    if (!selected.length) {
      return {
        error:
          "No catalog variants match those colors and sizes for this provider.",
      };
    }

    const preferredPosition = input.position?.trim();
    const position =
      preferredPosition ||
      selected[0]?.placeholders?.find((p) =>
        /front/i.test(p.position),
      )?.position ||
      selected[0]?.placeholders?.[0]?.position ||
      "front";

    const variantIds = selected.map((v) => v.id);
    const product = await createAndPublishProduct({
      title,
      description: description || title,
      blueprint_id: input.blueprintId,
      print_provider_id: input.printProviderId,
      variants: selected.map((v, i) => ({
        id: v.id,
        price: priceCents,
        is_enabled: true,
        is_default: i === 0,
      })),
      print_areas: [
        {
          variant_ids: variantIds,
          placeholders: [
            {
              position,
              images: [
                {
                  id: input.imageId,
                  x: 0.5,
                  y: 0.5,
                  scale: 1,
                  angle: 0,
                },
              ],
            },
          ],
        },
      ],
      tags: ["tuned-and-threaded", "garage"],
    });

    return { data: { product } };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to create product.",
    };
  }
}

export async function loadPrintifyOrdersAction(): Promise<
  PrintifyActionResult<{ orders: Awaited<ReturnType<typeof getOrders>> }>
> {
  try {
    await requireAdmin();
    const orders = await getOrders({ limit: 20 });
    return { data: { orders } };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to load orders." };
  }
}
