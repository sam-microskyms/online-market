"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ReelStage } from "@/components/reel-stage";
import { usePrefersReducedMotion } from "@/components/use-reduced-motion";
import { formatBdt, formatSeconds } from "@/lib/format";
import { categoryById, customerFeed, isCustomerVisible, sellerById } from "@/lib/market";
import { useMarket } from "@/lib/store";
import type { Product } from "@/lib/types";

export function Feed() {
  const { state, addToCart } = useMarket();
  const products = customerFeed(state);
  const reduced = usePrefersReducedMotion();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDialogElement>(null);
  const [activeId, setActiveId] = useState(products[0]?.id ?? "");
  const [sheetId, setSheetId] = useState<string | null>(null);
  const visibleActive = products.some((product) => product.id === activeId) ? activeId : (products[0]?.id ?? "");

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const nodes = [...root.querySelectorAll<HTMLElement>("[data-reel]")];
    const observer = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const id = best?.target instanceof HTMLElement ? best.target.dataset.reel : undefined;
        if (id) setActiveId(id);
      },
      { root, threshold: [0.6, 0.8] },
    );
    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [products]);

  function openSheet(product: Product) {
    setSheetId(product.id);
  }

  useEffect(() => {
    const dialog = sheetRef.current;
    if (!dialog) return;
    if (sheetId && !dialog.open) dialog.showModal();
  }, [sheetId]);

  useEffect(() => {
    const dialog = sheetRef.current;
    return () => dialog?.close();
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"].includes(event.key)) return;
    const root = scrollerRef.current;
    if (!root) return;
    const cards = [...root.querySelectorAll<HTMLElement>("[data-reel]")];
    const index = Math.max(0, cards.findIndex((card) => card.dataset.reel === visibleActive));
    let next = index;
    if (event.key === "ArrowDown" || event.key === "PageDown") next = Math.min(cards.length - 1, index + 1);
    if (event.key === "ArrowUp" || event.key === "PageUp") next = Math.max(0, index - 1);
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = cards.length - 1;
    event.preventDefault();
    cards[next]?.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
  }

  const active = products.find((product) => product.id === visibleActive) ?? null;
  const sheetProduct = products.find((product) => product.id === sheetId) ?? null;

  if (products.length === 0) {
    return (
      <div className="page">
        <h2>The demo stall is empty</h2>
        <p className="lede">Approved listings will appear here. An admin can restore one, or you can reset the demo.</p>
        <div className="row-actions">
          <Link className="btn" href="/admin">
            Admin desk
          </Link>
          <Link className="btn secondary" href="/browse">
            Browse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="feed-layout">
      <div
        ref={scrollerRef}
        className="scroller"
        tabIndex={0}
        aria-label="Product reel. Arrow keys move between listings."
        onKeyDown={onKeyDown}
      >
        {products.map((product, index) => {
          const seller = sellerById(state.sellers, product.sellerId);
          const category = categoryById(product.category);
          const visible = isCustomerVisible(product, state.sellers);
          return (
            <article key={product.id} className="reel" data-reel={product.id} aria-labelledby={`reel-${product.id}`}>
              <ReelStage product={product} active={visibleActive === product.id && sheetId !== product.id} reduced={reduced} />
              <div className="dock">
                <p className="eyebrow">
                  Demo · {product.durationSec ? `${formatSeconds(product.durationSec)} illustration` : "poster only"} · {index + 1} of {products.length}
                </p>
                <h2 id={`reel-${product.id}`} className="clamp">
                  {product.title}
                </h2>
                <p className="price">{formatBdt(product.priceBdt)}</p>
                <p className="meta">
                  <Link href={`/browse?category=${product.category}`}>{category?.label}</Link>
                  {" · "}
                  <Link href={`/browse?seller=${product.sellerId}`}>{seller?.name}</Link>
                </p>
                <p className="help">Demo stock: {product.stock}</p>
                <div className="row-actions">
                  <button type="button" className="btn" disabled={!visible || product.stock < 1} onClick={() => addToCart(product.id)}>
                    {product.stock < 1 ? "Sold out" : "Add to bag"}
                  </button>
                  <button type="button" className="btn secondary" onClick={() => openSheet(product)}>
                    Details
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <aside className="side-panel">
        {active ? <DetailCopy product={active} sellers={state.sellers} onAdd={() => addToCart(active.id)} /> : null}
        <p className="help">Arrow keys move the reel. Clips stay muted until you unmute, and only the visible listing loads.</p>
      </aside>
      <dialog
        ref={sheetRef}
        className="sheet"
        aria-labelledby="sheet-title"
        onClose={() => setSheetId(null)}
      >
        {sheetProduct ? (
          <div className="sheet-body">
            <p className="eyebrow">Demo listing</p>
            <DetailCopy
              product={sheetProduct}
              sellers={state.sellers}
              onAdd={() => addToCart(sheetProduct.id)}
              onOpen={() => sheetRef.current?.close()}
              headingId="sheet-title"
            />
            <button type="button" className="btn ghost" onClick={() => sheetRef.current?.close()}>
              Close
            </button>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}

function DetailCopy({
  product,
  sellers,
  onAdd,
  onOpen,
  headingId,
}: {
  product: Product;
  sellers: { id: string; name: string; area: string; blurb: string }[];
  onAdd: () => void;
  onOpen?: () => void;
  headingId?: string;
}) {
  const seller = sellers.find((item) => item.id === product.sellerId);
  const category = categoryById(product.category);
  return (
    <div className="stack">
      <h2 id={headingId}>{product.title}</h2>
      <p className="price">{formatBdt(product.priceBdt)}</p>
      <p>
        {category?.label} · {seller?.name} · {seller?.area}
      </p>
      <p>{product.claim}</p>
      <p className="notice">Illustrative demo copy. Not a tested product claim, and not a photograph of stock.</p>
      <p>{product.description}</p>
      <p className="help">Demo stock: {product.stock}</p>
      <div className="row-actions">
        <button type="button" className="btn" disabled={product.stock < 1} onClick={onAdd}>
          {product.stock < 1 ? "Sold out" : "Add to bag"}
        </button>
        <Link className="btn secondary" href={`/product/${product.id}`} onClick={onOpen}>
          Open product page
        </Link>
      </div>
    </div>
  );
}
