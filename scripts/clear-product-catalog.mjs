/**
 * One-off: wipe Printify + Shopify product catalogs only.
 * Does not touch collections, navigation, theme, pages, or store settings.
 *
 * Usage: node scripts/clear-product-catalog.mjs
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnvLocal();

const PRINTIFY_TOKEN = process.env.PRINTIFY_API_TOKEN?.trim();
const PRINTIFY_SHOP_ID = process.env.PRINTIFY_SHOP_ID?.trim();
const SHOP_DOMAIN = (
  process.env.SHOPIFY_STORE_DOMAIN ||
  process.env.SHOPIFY_SHOP ||
  ""
)
  .trim()
  .replace(/^https?:\/\//, "")
  .replace(/\/$/, "");
const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID?.trim();
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET?.trim();
const API_VERSION = "2025-01";

if (!PRINTIFY_TOKEN || !PRINTIFY_SHOP_ID) {
  console.error("Missing PRINTIFY_API_TOKEN or PRINTIFY_SHOP_ID");
  process.exit(1);
}
if (!SHOP_DOMAIN || !SHOPIFY_CLIENT_ID || !SHOPIFY_CLIENT_SECRET) {
  console.error("Missing Shopify credentials");
  process.exit(1);
}

const report = {
  printifyListed: 0,
  printifyUnpublished: 0,
  printifyDeleted: 0,
  printifyFailed: [],
  shopifyListedBefore: 0,
  shopifyDeleted: 0,
  shopifyFailed: [],
  printifyRemaining: null,
  shopifyRemaining: null,
  printifyProducts: [],
  shopifyProducts: [],
};

async function printifyFetch(path, init = {}) {
  const res = await fetch(`https://api.printify.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${PRINTIFY_TOKEN}`,
      "User-Agent": "TunedAndThreaded/1.0 (catalog-clear)",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Printify ${res.status} ${path}: ${text.slice(0, 400)}`);
  }
  if (!text) return null;
  return JSON.parse(text);
}

async function listAllPrintifyProducts() {
  const all = [];
  let page = 1;
  for (;;) {
    const data = await printifyFetch(
      `/shops/${PRINTIFY_SHOP_ID}/products.json?limit=50&page=${page}`,
    );
    const batch = data?.data ?? [];
    all.push(...batch);
    const last = data?.last_page ?? page;
    if (page >= last || batch.length === 0) break;
    page += 1;
  }
  return all;
}

async function getShopifyToken() {
  const res = await fetch(
    `https://${SHOP_DOMAIN}/admin/oauth/access_token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: SHOPIFY_CLIENT_ID,
        client_secret: SHOPIFY_CLIENT_SECRET,
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`Shopify token ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  return json.access_token;
}

async function shopifyGql(token, query, variables) {
  const res = await fetch(
    `https://${SHOP_DOMAIN}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    },
  );
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Shopify HTTP ${res.status}: ${JSON.stringify(json)}`);
  }
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  return json.data;
}

async function listAllShopifyProducts(token) {
  const all = [];
  let cursor = null;
  for (;;) {
    const data = await shopifyGql(
      token,
      `query ($first: Int!, $after: String) {
        products(first: $first, after: $after) {
          nodes { id title handle status }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      { first: 50, after: cursor },
    );
    const nodes = data.products.nodes ?? [];
    all.push(...nodes);
    if (!data.products.pageInfo.hasNextPage) break;
    cursor = data.products.pageInfo.endCursor;
  }
  return all;
}

async function deleteShopifyProduct(token, id) {
  const data = await shopifyGql(
    token,
    `mutation ($input: ProductDeleteInput!) {
      productDelete(input: $input) {
        deletedProductId
        userErrors { field message }
      }
    }`,
    { input: { id } },
  );
  const errors = data.productDelete?.userErrors ?? [];
  if (errors.length) {
    throw new Error(errors.map((e) => e.message).join("; "));
  }
  return data.productDelete?.deletedProductId;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log("=== Catalog wipe (products only) ===");
  console.log(`Printify shop: ${PRINTIFY_SHOP_ID}`);
  console.log(`Shopify shop: ${SHOP_DOMAIN}`);

  // 1. List Printify products
  const printifyProducts = await listAllPrintifyProducts();
  report.printifyListed = printifyProducts.length;
  report.printifyProducts = printifyProducts.map((p) => ({
    id: p.id,
    title: p.title,
  }));
  console.log(`\nPrintify products found: ${printifyProducts.length}`);
  for (const p of printifyProducts) {
    console.log(`  - ${p.id}  ${p.title}`);
  }

  // 2–5. Unpublish then delete each Printify product (variants/mockups go with product)
  for (const p of printifyProducts) {
    try {
      try {
        await printifyFetch(
          `/shops/${PRINTIFY_SHOP_ID}/products/${p.id}/unpublish.json`,
          { method: "POST", body: "{}" },
        );
        report.printifyUnpublished += 1;
        console.log(`Unpublished Printify ${p.id}`);
      } catch (e) {
        console.warn(
          `Unpublish warn ${p.id}: ${e instanceof Error ? e.message : e}`,
        );
      }
      await sleep(250);
      await printifyFetch(
        `/shops/${PRINTIFY_SHOP_ID}/products/${p.id}.json`,
        { method: "DELETE" },
      );
      report.printifyDeleted += 1;
      console.log(`Deleted Printify ${p.id}`);
      await sleep(250);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      report.printifyFailed.push({ id: p.id, title: p.title, error: msg });
      console.error(`FAILED Printify ${p.id}: ${msg}`);
    }
  }

  // Shopify token + list before cleanup of leftovers
  const token = await getShopifyToken();
  const shopifyBefore = await listAllShopifyProducts(token);
  report.shopifyListedBefore = shopifyBefore.length;
  report.shopifyProducts = shopifyBefore.map((p) => ({
    id: p.id,
    title: p.title,
    handle: p.handle,
  }));
  console.log(`\nShopify products found after Printify wipe: ${shopifyBefore.length}`);
  for (const p of shopifyBefore) {
    console.log(`  - ${p.id}  ${p.title}`);
  }

  // 6–7. Delete any remaining Shopify products (removes from collections automatically)
  for (const p of shopifyBefore) {
    try {
      await deleteShopifyProduct(token, p.id);
      report.shopifyDeleted += 1;
      console.log(`Deleted Shopify ${p.id}`);
      await sleep(200);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      report.shopifyFailed.push({
        id: p.id,
        title: p.title,
        error: msg,
      });
      console.error(`FAILED Shopify ${p.id}: ${msg}`);
    }
  }

  // 8. Verify empty
  const printifyLeft = await listAllPrintifyProducts();
  const shopifyLeft = await listAllShopifyProducts(token);
  report.printifyRemaining = printifyLeft.length;
  report.shopifyRemaining = shopifyLeft.length;

  console.log("\n========== REPORT ==========");
  console.log(`Printify products listed:     ${report.printifyListed}`);
  console.log(`Printify unpublished:         ${report.printifyUnpublished}`);
  console.log(`Printify deleted:             ${report.printifyDeleted}`);
  console.log(`Printify failed:              ${report.printifyFailed.length}`);
  console.log(`Shopify products found:       ${report.shopifyListedBefore}`);
  console.log(`Shopify deleted:              ${report.shopifyDeleted}`);
  console.log(`Shopify failed:               ${report.shopifyFailed.length}`);
  console.log(`Printify remaining:           ${report.printifyRemaining}`);
  console.log(`Shopify remaining:            ${report.shopifyRemaining}`);
  if (report.printifyFailed.length) {
    console.log("\nPrintify failures:");
    for (const f of report.printifyFailed) console.log(`  ${f.id}: ${f.error}`);
  }
  if (report.shopifyFailed.length) {
    console.log("\nShopify failures:");
    for (const f of report.shopifyFailed) console.log(`  ${f.id}: ${f.error}`);
  }
  const ready =
    report.printifyRemaining === 0 &&
    report.shopifyRemaining === 0 &&
    report.printifyFailed.length === 0 &&
    report.shopifyFailed.length === 0;
  console.log(
    ready
      ? "\nBoth stores are empty and ready for a fresh catalog import."
      : "\nWARNING: Stores are not fully empty — review failures above.",
  );
  console.log("============================\n");

  // Write JSON report next to script for records
  const { writeFileSync } = await import("node:fs");
  writeFileSync(
    resolve(process.cwd(), "scripts/clear-product-catalog-report.json"),
    JSON.stringify(report, null, 2),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
