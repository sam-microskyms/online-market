"use client";

import { useActionState } from "react";
import Link from "next/link";
import { submitSellerApplication } from "@/app/actions/commerce";
import type { ActionResult } from "@/lib/commerce/types";
import { CATEGORIES } from "@/lib/market";

const initial: ActionResult | null = null;

export function SellApplicationForm({ accountsOpen, signedIn }: { accountsOpen: boolean; signedIn: boolean }) {
  const [state, action, pending] = useActionState(submitSellerApplication, initial);
  if (!accountsOpen) {
    return <p className="notice">Applications are not being accepted yet. Configuring the database does not happen from this form, and nothing is submitted.</p>;
  }
  if (!signedIn) {
    return (
      <p>
        <Link href="/account">Sign in</Link> or create a customer account, then come back to apply.
      </p>
    );
  }
  return (
    <form action={action} className="stack">
      <label className="field">
        <span>Business name</span>
        <input name="businessName" required maxLength={80} />
      </label>
      <label className="field">
        <span>Area in Bangladesh</span>
        <input name="area" required maxLength={80} placeholder="Mohammadpur, Dhaka" />
      </label>
      <fieldset className="field">
        <legend>Categories you want to sell</legend>
        {CATEGORIES.map((category) => (
          <label key={category.id} className="pay-option">
            <input type="checkbox" name="categories" value={category.id} />
            <span>{category.label}</span>
          </label>
        ))}
      </fieldset>
      <label className="field">
        <span>What you sell</span>
        <textarea name="summary" required minLength={20} maxLength={600} />
      </label>
      <p className="help">Do not send bank, bKash, or national ID details. Those are not part of this application.</p>
      {state ? <p className={state.ok ? "good" : "error"}>{state.message}</p> : null}
      <button className="btn" type="submit" disabled={pending}>
        Submit application
      </button>
    </form>
  );
}
