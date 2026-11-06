"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatBdt, formatSeconds } from "@/lib/format";
import { categoryById, customerFeed, isCustomerVisible, sellerById, visibilityNote } from "@/lib/market";
import { getSessionClip } from "@/lib/session-clips";
import { useMarket } from "@/lib/store";

export function ProductView() {
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === "string" ? params.id : "";
  const router = useRouter();
  const { state, addToCart } = useMarket();
  const product = state.products.find((item) => item.id === id) ?? null;
  const [failedId, setFailedId] = useState<string | null>(null);
  const videoFailed = failedId === id;

  useEffect(() => {
    if (product) document.title = `${product.title} — Online Market demo`;
  }, [product]);

  if (!product) {
    return (
      <div className="page">
        <h2>This listing is not in the demo</h2>
        <p className="lede">It may have been removed by a reset.</p>
        <Link className="btn" href="/browse">
          Browse the stall
        </Link>
      </div>
    );
  }

  const seller = sellerById(state.sellers, product.sellerId);
  const category = categoryById(product.category);
  const note = visibilityNote(product, state.sellers);
  const src = getSessionClip(product.id) ?? product.video;
  const related = customerFeed(state).filter((item) => item.category === product.category && item.id !== product.id).slice(0, 3);
  const canBuy = isCustomerVisible(product, state.sellers) && product.stock > 0;

  return (
    <div className="page">
      <div className="product-layout">
        <div className="hero">
          {src && !videoFailed ? (
            <video
              src={src}
              poster={product.poster}
              controls
              playsInline
              preload="none"
              aria-label={`${product.title}. Demo illustration with controls.`}
              onError={() => setFailedId(id)}
            >
              <track kind="descriptions" srcLang="en" label="English description" src="/media/silent-demo.vtt" />
            </video>
          ) : (
            <img src={product.poster} alt={`${product.title}. Demo illustration, not a photograph.`} />
          )}
        </div>
        <div className="stack">
          <p className="eyebrow">Demo listing · {product.durationSec ? formatSeconds(product.durationSec) : "poster only"}</p>
          <h2>{product.title}</h2>
          <p className="price">{formatBdt(product.priceBdt)}</p>
          <p className="meta">
            <Link href={`/browse?category=${product.category}`}>{category?.label}</Link>
            {" · "}
            <Link href={`/browse?seller=${product.sellerId}`}>{seller?.name}</Link>
            {seller ? ` · ${seller.area}` : ""}
          </p>
          {note ? <p className="notice">{note}</p> : null}
          <p>{product.claim}</p>
          <p className="notice">Illustrative demo copy. Not a tested product claim, and not a photograph of stock.</p>
          <p>{product.description}</p>
          {seller ? <p className="help">{seller.blurb}</p> : null}
          <ul className="list-reset">
            {product.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
          <p>Demo stock: {product.stock}</p>
          {product.reviewNote ? <p className="help">Review note: {product.reviewNote}</p> : null}
          <div className="buybar">
            <div>
              <p className="price">{formatBdt(product.priceBdt)}</p>
              <p className="meta">
                {category?.short} · {seller?.name}
              </p>
            </div>
            <div className="row-actions">
              <button type="button" className="btn" disabled={!canBuy} onClick={() => addToCart(product.id)}>
                {product.stock < 1 ? "Sold out" : "Add to bag"}
              </button>
              <button
                type="button"
                className="btn secondary"
                disabled={!canBuy}
                onClick={() => {
                  const already = state.cart.some((line) => line.productId === product.id);
                  if (!already && !addToCart(product.id)) return;
                  router.push("/checkout");
                }}
              >
                Buy now
              </button>
            </div>
          </div>
        </div>
      </div>
      {related.length > 0 ? (
        <section className="stack" style={{ marginTop: 22 }}>
          <h2>More in {category?.label}</h2>
          <div className="grid">
            {related.map((item) => (
              <Link key={item.id} className="card" href={`/product/${item.id}`}>
                <img src={item.poster} alt="" />
                <h3>{item.title}</h3>
                <p className="price">{formatBdt(item.priceBdt)}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
