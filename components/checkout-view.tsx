"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatBdt } from "@/lib/format";
import { bagLines, bagSubtotal, CHECKOUT_FIELDS, DIVISIONS, PAY_METHODS } from "@/lib/market";
import { useMarket } from "@/lib/store";

export function CheckoutView() {
  const { state, placeOrder } = useMarket();
  const router = useRouter();
  const lines = bagLines(state);
  const blocked = lines.some((line) => !line.available);
  const [division, setDivision] = useState("");
  const [method, setMethod] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  if (lines.length === 0) {
    return (
      <div className="page">
        <h2>Nothing to check out</h2>
        <p className="lede">The demo bag is empty, so no order can be simulated.</p>
        <Link className="btn" href="/browse">
          Browse the stall
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-intro">
        <p className="eyebrow">Simulated checkout</p>
        <h2>Place a demo order</h2>
        <p className="lede">
          This form never asks for a card, wallet number, phone, or street address. The order stays in this browser and nothing is charged.
        </p>
      </header>
      <div className="notice">Fields used: {CHECKOUT_FIELDS.join(", ")}. Payment cards are not accepted here.</div>
      <ul className="list-reset">
        {lines.map((line) => (
          <li key={line.productId}>
            {line.qty} × {line.product?.title ?? line.productId}
            {line.available ? ` · ${formatBdt(line.lineTotal)}` : ` · ${line.reason}`}
          </li>
        ))}
      </ul>
      <p className="price">Total {formatBdt(bagSubtotal(lines))}</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (blocked) {
            setError("Fix the bag before placing a simulated order.");
            return;
          }
          const result = placeOrder({ division, method, note });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.push(`/order/${result.orderId}`);
        }}
      >
        <label className="field">
          <span>Demo delivery division</span>
          <select value={division} onChange={(event) => setDivision(event.target.value)} required>
            <option value="">Choose a division</option>
            {DIVISIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <span className="help">A division only. No house, road, or phone is collected.</span>
        </label>
        <fieldset className="field">
          <legend>Simulated payment</legend>
          {PAY_METHODS.map((item) => (
            <label key={item.id} className="pay-option">
              <input
                type="radio"
                name="method"
                value={item.id}
                checked={method === item.id}
                onChange={() => setMethod(item.id)}
                required
              />
              <span>{item.label}</span>
              <span className="help">{item.detail}</span>
            </label>
          ))}
        </fieldset>
        <label className="field">
          <span>Demo note, optional</span>
          <textarea value={note} maxLength={140} onChange={(event) => setNote(event.target.value)} placeholder="Stays in this browser" />
        </label>
        {error ? <p className="error">{error}</p> : null}
        {blocked ? <p className="error">The bag has a line that cannot be ordered.</p> : null}
        <div className="row-actions">
          <button type="submit" className="btn" disabled={blocked}>
            Place simulated order
          </button>
          <Link className="btn secondary" href="/cart">
            Back to bag
          </Link>
        </div>
      </form>
    </div>
  );
}
