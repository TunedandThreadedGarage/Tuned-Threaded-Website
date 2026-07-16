export const STORE_SORTS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "best_selling", label: "Best Selling" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "alpha", label: "Alphabetical" },
] as const;

export type StoreSort = (typeof STORE_SORTS)[number]["value"];

export const PAGE_SIZE = 12;

export function sortKeyFor(sort: StoreSort): {
  sortKey: "TITLE" | "CREATED_AT" | "UPDATED_AT" | "VENDOR" | "ID";
  reverse: boolean;
} {
  switch (sort) {
    case "newest":
      return { sortKey: "CREATED_AT", reverse: true };
    case "alpha":
      return { sortKey: "TITLE", reverse: false };
    case "best_selling":
      return { sortKey: "UPDATED_AT", reverse: true };
    case "price_asc":
    case "price_desc":
    case "featured":
    default:
      return { sortKey: "UPDATED_AT", reverse: true };
  }
}

export const SHIPPING_COPY =
  "Orders typically ship within 2–4 business days. Tracking is emailed when the package leaves the bay.";

export const RETURNS_COPY =
  "Unworn items in original condition may be returned within 30 days of delivery. Start a return from your order confirmation email.";
