import Link from "next/link";
import { addToCart } from "@/app/actions/commerce";
import { isFilmedClip } from "@/lib/commerce/preview-map";
import type { StoreOffer } from "@/lib/commerce/types";
import { formatBdt, formatSeconds } from "@/lib/format";
import { CATEGORIES } from "@/lib/market";

export function ProductScreen({ offer, related }: { offer: StoreOffer; related: StoreOffer[] }) {
  const category = CATEGORIES.find((item) => item.id === offer.category);
  return (
    <div className="page product-page">
      <div className="product-layout">
        <div className={isFilmedClip(offer.id) && offer.video ? "hero filmed" : "hero"}>
          {isFilmedClip(offer.id) && offer.video ? (
            <video poster={offer.poster} controls playsInline preload="metadata" aria-label={`${offer.title}. Demo video of a sample product, not for sale.`}>
              <source src={offer.video} type="video/mp4" />
            </video>
          ) : (
            <img src={offer.poster} alt={`${offer.title}. Sample photograph, not merchandise in stock.`} />
          )}
        </div>
        <div className="stack">
          <p className="eyebrow">{category?.label}</p>
          <h1>{offer.title}</h1>
          <p className="price">
            <span className="help">Sample price </span>
            {formatBdt(offer.priceBdt)}
          </p>
          <p>
            {offer.sellerName}
            {offer.sellerArea ? ` · ${offer.sellerArea}` : ""}
          </p>
          <p>{offer.description}</p>
          {offer.purchasable ? <p className="quiet">Stock {offer.stock}. Delivery follows the method enabled at checkout.</p> : <p className="quiet">Not for sale.</p>}
          {isFilmedClip(offer.id) ? (
            <p className="help">Demo video, about {formatSeconds(offer.durationSec ?? 0)}. Sample product, not for sale. This is reused footage, not a film made for this shop.</p>
          ) : offer.durationSec ? (
            <p className="help">Photograph only on this page. Not filmed product footage.</p>
          ) : (
            <p className="help">Photograph only. There is no video for this sample.</p>
          )}
          {offer.details.length > 0 ? (
            <ul className="list-reset">
              {offer.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          ) : null}
          {offer.variants.length > 0 ? (
            <fieldset className="field" disabled>
              <legend>Options</legend>
              {offer.variants.map((variant) => (
                <label key={variant.id} className="pay-option">
                  <input type="radio" name="variant" disabled />
                  <span>
                    {variant.label} · {formatBdt(variant.priceBdt)}
                  </span>
                </label>
              ))}
              <p className="help">Options are part of the listing layout. They cannot be selected while this item is not for sale.</p>
            </fieldset>
          ) : null}
          <div className="row-actions">
            {offer.purchasable ? (
              <form action={addToCart}>
                <input type="hidden" name="productId" value={offer.id} />
                <button className="btn" type="submit">
                  Add to bag
                </button>
              </form>
            ) : null}
            {isFilmedClip(offer.id) && offer.video ? (
              <Link className="btn" href={`/?item=${offer.id}`}>
                Open in the reel
              </Link>
            ) : (
              <p className="help">This listing is not in the reel. The reel only plays the filmed sample clips.</p>
            )}
            <Link className="btn secondary" href={`/shop?category=${offer.category}`}>
              More in {category?.short}
            </Link>
          </div>
        </div>
      </div>
      {related.length > 0 ? (
        <section className="stack" style={{ marginTop: 24 }}>
          <h2>Also in {category?.label}</h2>
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
