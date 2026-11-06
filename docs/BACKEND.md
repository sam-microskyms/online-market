# Backend setup

This app does not create a Supabase project, apply migrations, or turn on payments. Do those steps yourself when you are ready. The Hobby deployment should stay a non-commercial preview until you choose a hosting plan and approve a real launch.

## What is already in the repo

- `supabase/migrations/20261106190000_commerce.sql` creates profiles, seller applications, sellers, products, variants, orders, order lines, payment events, and shop settings.
- Row level security is on. Customers read their own orders. Sellers read only their own order lines. Listings a seller inserts are forced to `pending`. Profile roles cannot be changed with a normal user token.
- `place_order` reads price and stock from the database, refuses to run unless `shop_settings.checkout_enabled` is true, and refuses cash on delivery or prepaid unless that flag is also true.
- Signup creates a `customer` profile. It never creates an admin or a seller.
- `.env.example` lists the variables. Real keys stay out of git.

## Configure a project

1. Create a Supabase project in the dashboard.
2. In the SQL editor, run `supabase/migrations/20261106190000_commerce.sql`.
3. In Authentication, decide whether email confirmation is required.
4. Copy the project URL and anon key into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Put `SUPABASE_SERVICE_ROLE_KEY` only in server environment variables. Do not expose it to the browser.
6. Create a customer account through `/account`.
7. Promote that account once, with the service role:

```sql
update public.profiles set role = 'admin' where id = '<user uuid>';
```

8. Sign in as that admin and use `/admin` to approve seller applications and listings.

Leave these false until you mean to take orders:

```
CHECKOUT_ENABLED=false
COD_ENABLED=false
PREPAID_ENABLED=false
```

`shop_settings` also defaults to all false. Both the environment flags and the database row have to allow a method before `place_order` will record one. Set `COD_ENABLED` only after a delivery workflow exists outside this app. Set `PREPAID_ENABLED` only together with `PAYMENT_WEBHOOK_SECRET` and a gateway you have approved. The webhook route is `POST /api/payments/webhook` with header `x-online-market-signature` set to the hex HMAC-SHA256 of the raw body. There is no bKash or SSLCommerz client in this repo.

Product clips can be uploaded to the `product-media` bucket, limited to 25 MB and to jpeg, png, webp, mp4, and webm. The listing form in this version saves the pending row and the declared duration. It does not store the file bytes yet. A later worker should also measure duration on the server, because the browser can only declare it.

## Not decided here

- Seller payouts and any split of a payment. Do not treat the order total as money held for a seller.
- Refund, warranty, business address, and support contact copy. Add those only from text you supply.
- Livestream hosting.
- A commercial hosting plan. The current Vercel Hobby deployment is a non-commercial demo host, not a public shop launch.
