"use client";

import Link from "next/link";
import { formatBdt } from "@/lib/format";
import { bagLines, bagSubtotal } from "@/lib/market";
import { useMarket } from "@/lib/store";

export function CartView() {
  const { state, setQty, removeFromCart } = useMarket();
  const lines = bagLines(state);
  const subtotal = bagSubtotal(lines);
  const blocked = lines.some((line) => !line.available);

  if (lines.length === 0) {
    return (
      <div className="page">
        <header className="page-intro">
          <p className="eyebrow">Demo bag</p>
          <h2>The bag is empty</h2>
          <p className="lede">Add a sample listing from the reel or the browse stall.</p>
        </header>
        <div className="row-actions">
          <Link className="btn" href="/">
            Open the reel
          </Link>
          <Link className="btn secondary" href="/browse">
            Browse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-intro">
        <p className="eyebrow">Demo bag</p>
        <h2>Your sample bag</h2>
        <p className="lede">Quantities stay in this browser. Checkout does not take payment.</p>
      </header>
      {lines.map((line) => (
        <article key={line.productId} className="line">
          {line.product ? <img className="thumb" src={line.product.poster} alt="" /> : <div className="thumb" />}
          <div className="stack">
            <h2>{line.product?.title ?? "Removed listing"}</h2>
            <p className="help">{line.sellerName}</p>
            {line.available ? <p>{formatBdt(line.lineTotal)}</p> : <p className="error">{line.reason}</p>}
            {line.available ? (
              <div className="qty">
                <button type="button" aria-label={`Decrease quantity of ${line.product?.title ?? "item"}`} onClick={() => setQty(line.productId, line.qty - 1)}>
                  −
                </button>
                <span>{line.qty}</span>
                <button type="button" aria-label={`Increase quantity of ${line.product?.title ?? "item"}`} onClick={() => setQty(line.productId, line.qty + 1)}>
                  +
                </button>
              </div>
            ) : null}
          </div>
          <button type="button" className="btn ghost" onClick={() => removeFromCart(line.productId)}>
            Remove
          </button>
        </article>
      ))}
      <p className="price">Subtotal {formatBdt(subtotal)}</p>
      <div className="row-actions">
        {blocked ? (
          <p className="error">Remove or fix the unavailable lines before the simulated checkout.</p>
        ) : (
          <Link className="btn" href="/checkout">
            Simulated checkout
          </Link>
        )}
        <Link className="btn secondary" href="/browse">
          Keep browsing
        </Link>
      </div>
    </div>
  );
}
