import Link from "next/link";
import { checkoutBlockers } from "@/lib/commerce/policy";
import { getShopGates } from "@/lib/commerce/session";

export const metadata = { title: "Bag" };

export default async function CartPage() {
  const gates = await getShopGates();
  const blockers = checkoutBlockers(gates);
  return (
    <div className="page">
      <header className="page-intro">
        <p className="eyebrow">Bag</p>
        <h1>Nothing is held for checkout</h1>
        <p className="lede">
          Preview listings cannot be added to a bag. A bag is created only for a signed-in customer after checkout is deliberately opened.
        </p>
      </header>
      {blockers.length > 0 ? (
        <ul className="list-reset">
          {blockers.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : (
        <p>Checkout flags are on. Order lines still have to come from live database stock, not from this page alone.</p>
      )}
      <div className="row-actions">
        <Link className="btn" href="/">
          Back to the reel
        </Link>
        <Link className="btn secondary" href="/checkout">
          Checkout status
        </Link>
      </div>
    </div>
  );
}
