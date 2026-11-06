"use client";

import Link from "next/link";
import { formatBdt } from "@/lib/format";
import { customerFeed } from "@/lib/market";
import { useMarket } from "@/lib/store";

const SCHEDULE = [
  {
    when: "Thursday · 7:00 pm",
    title: "Scarf styling",
    seller: "Nodi Atelier",
    productId: "nodi-scarf",
  },
  {
    when: "Saturday · 4:00 pm",
    title: "Lamp walkthrough",
    seller: "Tarit Electronics",
    productId: "tarit-lamp",
  },
  {
    when: "Sunday · 11:00 am",
    title: "Shelf notes",
    seller: "Rong Ghor",
    productId: "rong-oil",
  },
];

export function LiveView() {
  const { state, setPinned } = useMarket();
  const pinned = state.products.find((product) => product.id === state.pinnedProductId) ?? customerFeed(state)[0];
  const choices = state.products.filter((product) => product.status === "live" || product.status === "pending");

  return (
    <div className="page">
      <header className="page-intro">
        <p className="eyebrow">Live layout preview</p>
        <h2>Scheduled, not broadcasting</h2>
        <p className="lede">
          Nothing on this page is live. No audience is connected, no viewer count is shown, and no stream is sent or received.
        </p>
      </header>
      <div className="banner">Demo stage only. Product pinning changes the layout in this browser. It does not start a broadcast.</div>
      <div className="split" style={{ marginTop: 16 }}>
        <section className="live-stage" aria-label="Demo stage">
          <p className="eyebrow">Pinned listing, simulated</p>
          {pinned ? (
            <>
              <img src={pinned.poster} alt={`${pinned.title}. Demo illustration, not a live camera.`} />
              <h2>{pinned.title}</h2>
              <p className="price">{formatBdt(pinned.priceBdt)}</p>
              <p className="help">{pinned.claim}</p>
              <Link className="btn" href={`/product/${pinned.id}`}>
                Open pinned listing
              </Link>
            </>
          ) : (
            <p>No listing is available to pin.</p>
          )}
          <label className="field">
            <span>Pin a sample listing</span>
            <select value={pinned?.id ?? ""} onChange={(event) => setPinned(event.target.value)}>
              {choices.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.title}
                </option>
              ))}
            </select>
          </label>
        </section>
        <section>
          <h2>Scheduled slots</h2>
          {SCHEDULE.map((slot) => (
            <article key={slot.title} className="schedule-card">
              <p className="status-pill" data-status="pending">
                Scheduled
              </p>
              <h3>{slot.title}</h3>
              <p>
                {slot.when} · {slot.seller}
              </p>
              <p className="help">Layout placeholder. No host is connected.</p>
              <Link href={`/product/${slot.productId}`}>View the sample listing</Link>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
