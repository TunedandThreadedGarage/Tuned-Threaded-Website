"use server";

import type { MerchDesignDraft } from "@/features/merch/constants";

export type MerchActionResult = {
  error?: string;
  success?: boolean;
  draft?: MerchDesignDraft;
  /** Payload shape ready for future Printify createProduct + publish. */
  printifyPayload?: {
    title: string;
    description: string;
    tags: string[];
    notes: string;
  };
};

/**
 * Validates a custom merch draft and returns a Printify-ready payload scaffold.
 * Actual Printify API create/publish will plug in here later.
 */
export async function prepareMerchDesignAction(input: {
  productId: string;
  colorId: string;
  username: string;
  customText?: string;
  vehiclePhotoUrl?: string | null;
  vehiclePhotoName?: string | null;
}): Promise<MerchActionResult> {
  const username = input.username.trim().replace(/^@/, "");
  if (!username) return { error: "Username is required." };
  if (!input.productId) return { error: "Choose a product." };
  if (!input.vehiclePhotoUrl) {
    return { error: "Upload a vehicle photo to continue." };
  }

  const customText = (input.customText ?? "").trim();
  const title = `@${username} Custom ${labelFor(input.productId)}`;
  const description = [
    `Custom Tuned & Threaded ${labelFor(input.productId)} for @${username}.`,
    customText ? `Message: ${customText}` : null,
    "Built in Garages. Shared with the World.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const draft: MerchDesignDraft = {
    productId: input.productId as MerchDesignDraft["productId"],
    colorId: input.colorId as MerchDesignDraft["colorId"],
    username,
    customText,
    vehiclePhotoUrl: input.vehiclePhotoUrl,
    vehiclePhotoName: input.vehiclePhotoName ?? null,
    printifyReady: true,
    createdAt: new Date().toISOString(),
  };

  return {
    success: true,
    draft,
    printifyPayload: {
      title,
      description,
      tags: [
        "Tuned & Threaded",
        "custom merch",
        "garage",
        username,
        input.productId,
        input.colorId,
      ],
      notes:
        "Scaffold only — wire createProduct/publishProduct from @/lib/printify when fulfillment goes live.",
    },
  };
}

function labelFor(productId: string) {
  switch (productId) {
    case "hoodie":
      return "Hoodie";
    case "tee":
      return "Tee";
    case "crewneck":
      return "Crewneck";
    case "cap":
      return "Cap";
    default:
      return "Merch";
  }
}
