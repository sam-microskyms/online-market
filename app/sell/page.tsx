import Link from "next/link";
import { readCommerceConfig } from "@/lib/commerce/config";

export const metadata = { title: "Become a Seller" };

export default function SellPage() {
  const applicationsOpen = readCommerceConfig(process.env).databaseConfigured;
  return (
    <div className="page">
      <header className="page-intro">
        <p className="eyebrow">Become a Seller</p>
        <h1>Sell on Online Market</h1>
        <p className="lede">
          Approved sellers get a separate desk for listings, clips, stock, and the orders that include their items. Buyers discover products in the reel and in the shop grid.
        </p>
        <p>
          {applicationsOpen
            ? "Applications can be stored after you sign in. A new application stays pending until an admin approves it."
            : "Seller applications are not open in this deployment. The application page explains that and does not record a submission."}
        </p>
      </header>
      <div className="stat-row">
        <article className="stat">
          <strong>1</strong>
          Create a customer account.
        </article>
        <article className="stat">
          <strong>2</strong>
          {applicationsOpen
            ? "Submit an application with your business name, area, and categories."
            : "The application form is visible, but it will not accept a submission until the database is configured."}
        </article>
        <article className="stat">
          <strong>3</strong>
          An admin approves it. Until then the seller desk stays closed.
        </article>
      </div>
      <h2>What approval gives you</h2>
      <ul className="list-reset">
        <li>A listing form for title, category, taka price, stock, description, and an optional clip of 15 seconds recommended, 30 seconds maximum.</li>
        <li>New listings stay pending until moderation. You cannot publish yourself straight to the reel.</li>
        <li>Orders that contain your items, once checkout is actually open.</li>
      </ul>
      <h2>What this does not include yet</h2>
      <ul className="list-reset">
        <li>Payouts, escrow, or a split of a customer payment. Those need a later decision and are not calculated here.</li>
        <li>Cash on delivery and prepaid checkout. Both stay off until explicitly configured.</li>
        <li>Livestream broadcasting.</li>
        <li>A request for bank, bKash, or identity documents.</li>
      </ul>
      <div className="row-actions">
        <Link className="btn" href="/sell/apply">
          Start an application
        </Link>
        <Link className="btn secondary" href="/account">
          Account
        </Link>
      </div>
    </div>
  );
}
