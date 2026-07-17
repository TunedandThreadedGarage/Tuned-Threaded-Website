export const MERCH_PRODUCTS = [
  {
    id: "hoodie",
    label: "Heavyweight Hoodie",
    subtitle: "Pullover · front + back",
    blueprintHint: "Lane Seven / Gildan heavyweight",
  },
  {
    id: "tee",
    label: "Premium Tee",
    subtitle: "Soft cotton · front print",
    blueprintHint: "Next Level / Bella+Canvas",
  },
  {
    id: "crewneck",
    label: "Crewneck Sweatshirt",
    subtitle: "Heavy blend · clean chest mark",
    blueprintHint: "Gildan heavy blend",
  },
  {
    id: "cap",
    label: "Structured Cap",
    subtitle: "Front panel embroidery-ready",
    blueprintHint: "Dad hat / snapback",
  },
] as const;

export type MerchProductId = (typeof MERCH_PRODUCTS)[number]["id"];

export const MERCH_COLORS = [
  { id: "black", label: "Black", swatch: "#0c0c0e" },
  { id: "white", label: "White", swatch: "#f2f2f0" },
  { id: "navy", label: "Navy", swatch: "#1a2332" },
  { id: "charcoal", label: "Charcoal", swatch: "#2a2a2e" },
] as const;

export type MerchColorId = (typeof MERCH_COLORS)[number]["id"];

export type MerchDesignDraft = {
  productId: MerchProductId;
  colorId: MerchColorId;
  username: string;
  customText: string;
  vehiclePhotoUrl: string | null;
  vehiclePhotoName: string | null;
  printifyReady: boolean;
  createdAt: string;
};
