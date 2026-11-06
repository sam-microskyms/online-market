"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ReelStage } from "@/components/reel-stage";
import { usePrefersReducedMotion } from "@/components/use-reduced-motion";
import type { StoreOffer } from "@/lib/commerce/types";
import { formatBdt } from "@/lib/format";
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
    scrollerRef.current?.querySelector<HTMLElement>(`[data-reel="${CSS.escape(startId)}"]`)?.scrollIntoView({ block: "start" });
  }, [startId]);

  function go(delta: number) {
    const cards = [...(scrollerRef.current?.querySelectorAll<HTMLElement>("[data-reel]") ?? [])];
    if (cards.length === 0) return;
    const index = Math.max(0, cards.findIndex((card) => card.dataset.reel === active?.id));
    const next = (index + delta + cards.length) % cards.length;
    cards[next]?.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowDown" || event.key === "PageDown") {
      event.preventDefault();
      go(1);
    }
    if (event.key === "ArrowUp" || event.key === "PageUp") {
      event.preventDefault();
      go(-1);
    }
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
  const index = Math.max(0, offers.findIndex((offer) => offer.id === active.id));

  return (
    <div className="home-hero">
      <div className="reel-steps" aria-label="Reel position">
        <button type="button" className="step" onClick={() => go(-1)}>
          Previous
        </button>
        <p>
          {index + 1} / {offers.length}
        </p>
        <button type="button" className="step" onClick={() => go(1)}>
          Next
        </button>
      </div>
      <div
        ref={scrollerRef}
        className="scroller home-scroller"
        tabIndex={0}
        aria-label="Product reels. Arrow keys move between listings."
        onKeyDown={onKeyDown}
      >
        {offers.map((offer) => (
          <article key={offer.id} className="reel" data-reel={offer.id} aria-labelledby={`reel-${offer.id}`}>
            <h2 id={`reel-${offer.id}`} className="visually-hidden">
              {offer.title}
            </h2>
            <ReelStage title={offer.title} poster={offer.poster} video={offer.video} active={active.id === offer.id} reduced={reduced} />
          </article>
        ))}
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
        <p className="quiet">{active.purchasable ? "Available to order while checkout is open." : "Not for sale."}</p>
        {active.video ? <p className="quiet">The motion is a move across the photograph, not filmed footage.</p> : null}
        <div className="row-actions">
          <Link className="btn" href={`/product/${active.id}`}>
            Product details
          </Link>
          <Link className="btn secondary" href={`/shop?category=${active.category}`}>
            Shop {category?.short}
          </Link>
        </div>
      </aside>
      <nav className="reel-rail" aria-label="Sample listings">
        {offers.map((offer) => (
          <button key={offer.id} type="button" aria-current={offer.id === active.id ? "true" : undefined} onClick={() => go(offers.findIndex((item) => item.id === offer.id) - index)}>
            <img src={offer.poster} alt="" />
            <span>{offer.title}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
