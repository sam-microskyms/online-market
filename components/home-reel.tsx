"use client";

import Link from "next/link";
import { addToCart } from "@/app/actions/commerce";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ReelStage } from "@/components/reel-stage";
import { usePrefersReducedMotion } from "@/components/use-reduced-motion";
import type { StoreOffer } from "@/lib/commerce/types";
import { formatBdt, formatSeconds } from "@/lib/format";
import { CATEGORIES } from "@/lib/market";

export function HomeReel({ offers, startId }: { offers: StoreOffer[]; startId?: string }) {
  const reduced = usePrefersReducedMotion();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const initial = offers.some((offer) => offer.id === startId) ? startId ?? offers[0]?.id ?? "" : offers[0]?.id ?? "";
  const [activeId, setActiveId] = useState(initial);
  const active = offers.find((offer) => offer.id === activeId) ?? offers[0] ?? null;

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const nodes = [...root.querySelectorAll<HTMLElement>("[data-reel]")];
    const observer = new IntersectionObserver(
      (entries) => {
        const best = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const id = best?.target instanceof HTMLElement ? best.target.dataset.reel : undefined;
        if (id) setActiveId(id);
      },
      { root, threshold: [0.6, 0.85] },
    );
    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [offers]);

  useEffect(() => {
    if (!startId) return;
    const node = scrollerRef.current?.querySelector<HTMLElement>(`[data-reel="${CSS.escape(startId)}"]`);
    node?.scrollIntoView({ block: "start" });
  }, [startId]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"].includes(event.key)) return;
    const cards = [...(scrollerRef.current?.querySelectorAll<HTMLElement>("[data-reel]") ?? [])];
    const index = Math.max(0, cards.findIndex((card) => card.dataset.reel === active?.id));
    let next = index;
    if (event.key === "ArrowDown" || event.key === "PageDown") next = Math.min(cards.length - 1, index + 1);
    if (event.key === "ArrowUp" || event.key === "PageUp") next = Math.max(0, index - 1);
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = cards.length - 1;
    event.preventDefault();
    cards[next]?.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
  }

  if (!active) {
    return (
      <section className="page">
        <h1>No listings to show</h1>
        <p>The reel is empty because the catalog could not be loaded.</p>
      </section>
    );
  }

  const category = CATEGORIES.find((item) => item.id === active.category);
  const related = offers.filter((offer) => offer.category === active.category && offer.id !== active.id).slice(0, 4);

  return (
    <div className="home-hero">
      <div
        ref={scrollerRef}
        className="scroller home-scroller"
        tabIndex={0}
        aria-label="Product reels. Arrow keys move between listings."
        onKeyDown={onKeyDown}
      >
        {offers.map((offer, index) => {
          const offerCategory = CATEGORIES.find((item) => item.id === offer.category);
          return (
            <article key={offer.id} className="reel" data-reel={offer.id} aria-labelledby={`reel-${offer.id}`}>
              <ReelStage title={offer.title} poster={offer.poster} video={offer.video} active={active.id === offer.id} reduced={reduced} />
              <div className="dock">
                <p className="eyebrow">
                  {offer.preview ? "Sample" : "Listing"} · {index + 1} / {offers.length}{offer.durationSec ? ` · ${formatSeconds(offer.durationSec)}` : ""}
                </p>
                <h2 id={`reel-${offer.id}`} className="clamp">
                  {offer.title}
                </h2>
                <p className="price">{formatBdt(offer.priceBdt)}</p>
                <p className="meta">
                  <Link href={`/shop?category=${offer.category}`}>{offerCategory?.label}</Link>
                  {" · "}
                  {offer.sellerName}
                </p>
                <div className="row-actions">
                  {offer.purchasable ? (
                    <form action={addToCart}>
                      <input type="hidden" name="productId" value={offer.id} />
                      <button className="btn" type="submit">
                        Add to bag
                      </button>
                    </form>
                  ) : (
                    <Link className="btn" href={`/product/${offer.id}`}>
                      View product
                    </Link>
                  )}
                  {offer.purchasable ? (
                    <Link className="btn secondary" href={`/product/${offer.id}`}>
                      Details
                    </Link>
                  ) : null}
                  <Link className="btn secondary" href={`/shop?category=${offer.category}`}>
                    Shop {offerCategory?.short}
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <aside className="reel-panel" aria-label="Selected listing">
        <p className="eyebrow">{category?.label}</p>
        <h2>{active.title}</h2>
        <p className="price">{formatBdt(active.priceBdt)}</p>
        <p>
          {active.sellerName}
          {active.sellerArea ? ` · ${active.sellerArea}` : ""}
        </p>
        <p>{active.description}</p>
        <p className="quiet">
          {active.purchasable ? "Available to order while checkout is open." : "Sample. Not for sale."}
        </p>
        <div className="row-actions">
          <Link className="btn" href={`/product/${active.id}`}>
            Product details
          </Link>
          <Link className="btn secondary" href="/shop">
            Browse the shop
          </Link>
        </div>
        {related.length > 0 ? (
          <div className="related">
            <h3>More in {category?.short}</h3>
            {related.map((offer) => (
              <Link key={offer.id} href={`/?item=${offer.id}`}>
                {offer.title}
                <span>{formatBdt(offer.priceBdt)}</span>
              </Link>
            ))}
          </div>
        ) : null}
      </aside>
    </div>
  );
}
