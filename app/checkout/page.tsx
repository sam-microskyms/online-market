import Link from "next/link";
import { placeOrder } from "@/app/actions/commerce";
import { checkoutBlockers, methodAvailable } from "@/lib/commerce/policy";
import { getShopGates, getViewer } from "@/lib/commerce/session";
import { createSupabaseServer } from "@/lib/supabase/server";
import { DIVISIONS } from "@/lib/market";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const gates = await getShopGates();
  const viewer = await getViewer();
  const blockers = checkoutBlockers(gates);
  const cod = methodAvailable(gates, "cod");
  const prepaid = methodAvailable(gates, "prepaid");
  const supabase = blockers.length === 0 ? await createSupabaseServer() : null;
  const { data: bag } = supabase && viewer.userId
    ? await supabase.from("cart_items").select("product_id, qty").eq("user_id", viewer.userId)
    : { data: [] };
  const lines = (bag ?? []).map((item) => ({ offerId: item.product_id, variantId: null, qty: item.qty }));
  return (
    <div className="page">
      <header className="page-intro">
        <p className="eyebrow">Checkout</p>
        <h1>{blockers.length === 0 ? "Checkout can record an order" : "Checkout is not open"}</h1>
        <p className="lede">This page does not collect card numbers, wallet numbers, or a street address. It also does not mark an order paid by itself.</p>
      </header>
      {blockers.length > 0 ? (
        <>
          <p className="notice">No order will be created from this deployment.</p>
          <ul className="list-reset">
            {blockers.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </>
      ) : viewer.signedIn ? (
        <form action={placeOrder} className="stack">
          <p>{lines.length === 0 ? "The bag is empty." : `${lines.length} bag line${lines.length === 1 ? "" : "s"} will be priced from the database.`}</p>
          <input type="hidden" name="lines" value={JSON.stringify(lines)} />
          <label className="field">
            <span>Delivery division</span>
            <select name="division" required>
              {DIVISIONS.map((division) => (
                <option key={division}>{division}</option>
              ))}
            </select>
          </label>
          <fieldset className="field">
            <legend>Method</legend>
            {cod ? (
              <label className="pay-option">
                <input type="radio" name="method" value="cod" required />
                <span>Cash on delivery. No card is collected and nothing is marked shipped.</span>
              </label>
            ) : null}
            {prepaid ? (
              <label className="pay-option">
                <input type="radio" name="method" value="prepaid" required />
                <span>Prepaid. The order stays unpaid until a verified webhook.</span>
              </label>
            ) : null}
          </fieldset>
          <button className="btn" type="submit" disabled={lines.length === 0}>
            Record order
          </button>
        </form>
      ) : (
        <p>
          <Link href="/account">Sign in</Link> to record an order. Prices still come from the database, not from this page.
        </p>
      )}
      <h2>Still required before a public launch</h2>
      <ul className="list-reset">
        <li>A Supabase project, the migration in supabase/migrations, and an admin promoted with the service role.</li>
        <li>A decision to set CHECKOUT_ENABLED, and COD_ENABLED only after a real delivery workflow exists.</li>
        <li>A payment provider you have approved, plus PAYMENT_WEBHOOK_SECRET, before prepaid orders can be marked paid.</li>
        <li>Seller payouts are not built. There is no escrow balance in this app.</li>
        <li>Refunds, warranty text, a business address, and a support contact are not published because they have not been supplied.</li>
      </ul>
      <Link className="btn" href="/">
        Back to the reel
      </Link>
    </div>
  );
}
