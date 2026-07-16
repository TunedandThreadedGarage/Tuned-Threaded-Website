# Shopify (Dev Dashboard Client Credentials)

The site stays on **Vercel + Supabase**. Shopify is only used for commerce.

Shopify no longer shows a copy-paste Storefront access token in the Dev Dashboard.
This integration uses the **Client Credentials** OAuth grant:

1. Read `SHOPIFY_CLIENT_ID` + `SHOPIFY_CLIENT_SECRET`
2. `POST /admin/oauth/access_token` with `grant_type=client_credentials`
3. Cache the Admin API `access_token` (~24h) and refresh before expiry
4. Call GraphQL Admin API with `X-Shopify-Access-Token`

Docs: [Client credentials grant](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/client-credentials-grant) · [Get API access tokens](https://shopify.dev/docs/apps/build/dev-dashboard/get-api-access-tokens)

## Setup

1. Open [Shopify Dev Dashboard](https://dev.shopify.com/dashboard) → your app → **Settings**.
2. Copy **Client ID** and **Client secret**.
3. Install the app on your store (same organization as the app).
4. Configure Admin API scopes on the app version, at minimum:
   - `read_products`
   - `read_orders` (for Garage order history)
5. Add to `.env.local` / Vercel:

```bash
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
# or: SHOPIFY_SHOP=your-store
SHOPIFY_CLIENT_ID=…
SHOPIFY_CLIENT_SECRET=…
# Optional — collection handle for the home Shop grid
SHOPIFY_FEATURED_COLLECTION=frontpage
```

6. Redeploy after setting env vars.

## Behaviour

| Area | Behavior |
|------|----------|
| Auth | Client Credentials → cached Admin access token |
| Home `#shop` | Products via Admin GraphQL (placeholders if unset) |
| Categories | Collections via Admin GraphQL |
| Cart | Cookie cart on this site; Checkout opens Shopify cart permalink |
| Garage orders | Admin `orders` query by signed-in email |

No theme hosting. No manually pasted Storefront token.
