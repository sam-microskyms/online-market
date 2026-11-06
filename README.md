# Online Market

Working title for a Bangladesh-first multi-seller marketplace demo. This repository is an interactive mockup for trying the customer, seller, and admin flows before any hosting or operating-cost decision.

It is a client-only Next.js app. Nothing is deployed. There is no database, no account system, and no payment integration.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other checks:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

`npm test` checks cart, simulated checkout, moderation, listing rules, and the duration of the seed clips. Node 20.9 or newer is required. This app was built with Next.js 16.

## Demo flow

The header role switch is labelled Customer, Seller, and Admin. It is not a login. No password is asked, and every role is available in the same browser. **Reset** clears this browser's demo bag, orders, listing edits, and moderation.

1. **Reel.** Scroll the vertical feed. Only the visible listing loads a clip, muted. Arrow keys move between listings. Off-screen clips pause. If the system asks for reduced motion, clips do not autoplay. **Add to bag** and **Details** stay on the listing, with price in taka, category, and seller.
2. **Details.** The sheet links to a product page. Claims are marked as illustrative. One beauty listing is poster-only. One is intentionally out of stock.
3. **Browse.** Filter by the five categories, seller, stock, and price, or search.
4. **Bag and checkout.** Choose a division and either simulated cash on delivery or simulated bKash. The form does not ask for a card, wallet number, phone, email, or street address. **Place simulated order** stores a confirmation in this browser and decrements demo stock. Nothing is charged and no delivery is booked.
5. **Seller.** Switch role, open **Sell**, and review sample orders. **New listing** accepts price, category, stock, an illustrative claim, and an optional clip. 15 seconds is the recommendation and 30 seconds is the maximum. A longer file can be previewed but cannot be saved. The file is not uploaded. New listings wait in the admin queue.
6. **Admin.** Approve or reject the waiting seller and listings. Hide a live listing and it leaves the customer reel. Restore puts it back. Reject asks for a demo reason.
7. **Live.** A scheduled layout only. You can pin a sample listing. Nothing is broadcasting and no audience is shown.

Edits, the bag, and simulated orders persist in `localStorage` under `online-market-demo-v1`. A clip chosen in the listing form lasts for the browser tab only. After a refresh, the listing text and a captured poster can remain, but the file itself is gone.

## Sample stall

Five categories are in the seed catalog: fashion accessories, home and kitchen, beauty and personal care, phone accessories, and electronics. Sellers are fictional and include stalls in Dhaka, Rajshahi, Chattogram, Sylhet, Khulna, and Barishal. Prices are in BDT. Meghna Stitch starts pending. One phone stand starts hidden. One charger sample starts rejected. See [ASSETS.md](ASSETS.md) for how the pictures were made and which licenses apply.

## What this is not

This mockup does not implement:

- accounts, sessions, or real authentication
- row level security or multi-tenant seller isolation
- Supabase, or any other database
- real orders, couriers, or payments
- video hosting or transcoding
- livestream ingest, broadcast, or a live audience
- Android or iOS apps
- departments beyond the five above

Direct visits to a non-live product URL show a banner and do not allow purchase. Roles are not a security boundary.

## Later Vercel import

Not done here. Do not treat this README as a deployment.

If you later import the Git repository into Vercel:

1. Use the Next.js framework preset.
2. Leave the build command as `next build` and the output as the Next.js default.
3. No environment variables are required for this demo.
4. Do not add payment, database, or Supabase keys for this mockup.

Vercel's Hobby plan is commonly limited to non-commercial personal use. Confirm the current plan terms before importing. This prototype itself calls no paid APIs and does not create a hosting bill.

## Scope notes

- Seed clips are silent generated illustrations. They are labelled so they are not mistaken for product footage.
- The live page cannot go live. Pinning only changes the demo layout.
- Checkout can require a short scroll on a phone before the place-order button, because the division and payment choices sit above it.
- `robots` is set to `noindex` so a later accidental deploy is less likely to be indexed as a real shop.
