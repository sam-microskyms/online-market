# Online Market

Bangladesh-first multi-seller shop. The homepage is a product reel. Category grids, product pages, accounts, and a seller application sit around that reel.

Checkout, cash on delivery, and prepaid payment are off unless you configure them. With the variables in `.env.example` left blank, the site shows an illustration preview and refuses to create accounts, seller applications, or orders.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## What works without a database

- Retail header, search, and the five categories.
- Homepage reel with clips, price, seller, and a link to the product page.
- Shop grid with search, category, and sort.
- Product pages with illustration, description, and disabled options where a listing has them.
- Become a Seller explains the real application steps and what is not included.
- Account, seller desk, admin, cart, and checkout say they are closed and do not report a fake success.
- Livestreams say they are not available.

## What needs Supabase

See [docs/BACKEND.md](docs/BACKEND.md). In short: run `supabase/migrations/20261106190000_commerce.sql`, set the URL and anon key, and promote one admin with the service role. Then customers can sign up, sellers can apply, and admins can approve. Listings a seller saves stay pending. `place_order` still refuses until both the environment flags and `shop_settings` allow a method.

Do not commit keys. `SUPABASE_SERVICE_ROLE_KEY` is server-only.

## Payments

No card form. No bKash or SSLCommerz client. Prepaid orders stay `pending_payment` until `POST /api/payments/webhook` verifies `x-online-market-signature`. Cash on delivery stays off until `COD_ENABLED` is set, which means you already have a delivery workflow. Seller payouts are not calculated.

## Tests

`tests/commerce.test.ts` covers roles, seller approval gates, preview items that cannot be ordered, server prices, closed checkout, and webhook signatures. Those tests do not call a live Supabase project. `tests/media.test.ts` checks the illustration files. `tests/market.test.ts` covers older helper functions that are not the shop checkout.
