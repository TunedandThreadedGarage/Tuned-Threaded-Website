# Printify integration

Tuned & Threaded talks to Printify’s REST API (`https://api.printify.com/v1`) using a Personal Access Token. With your Printify shop connected to Shopify, **Create Product** on `/admin/printify` creates the product and calls Printify’s publish endpoint so it syncs to Shopify.

## Environment

```bash
PRINTIFY_API_TOKEN=
PRINTIFY_SHOP_ID=
ADMIN_EMAILS=you@yourdomain.com
```

- **Token:** Printify → Account → Connections → API (scopes: shops, catalog, products, uploads, orders).
- **Shop ID:** numeric id from the Printify UI or `GET /v1/shops.json`.
- **ADMIN_EMAILS:** comma-separated Supabase login emails allowed to use `/admin/*`.

Never commit real tokens. Set the same vars in Vercel for production.

## Library

Import from `@/lib/printify`:

| Function | Endpoint |
| --- | --- |
| `getShops` | `GET /shops.json` |
| `getBlueprints` | `GET /catalog/blueprints.json` |
| `getPrintProviders` | `GET /catalog/print_providers.json` |
| `getBlueprintPrintProviders` | `GET /catalog/blueprints/{id}/print_providers.json` |
| `getBlueprintVariants` | `GET /catalog/blueprints/{id}/print_providers/{pp}/variants.json` |
| `uploadImage` | `POST /uploads/images.json` |
| `createProduct` | `POST /shops/{shop}/products.json` |
| `updateProduct` | `PUT /shops/{shop}/products/{id}.json` |
| `deleteProduct` | `DELETE /shops/{shop}/products/{id}.json` |
| `publishProduct` | `POST /shops/{shop}/products/{id}/publish.json` |
| `getOrders` | `GET /shops/{shop}/orders.json` |
| `createAndPublishProduct` | create + publish helper |

## Admin UI

- `/admin/printify` — upload artwork, pick blueprint / provider / colors / sizes, set title & price, create + publish
- `/admin/printify/orders` — recent Printify orders
