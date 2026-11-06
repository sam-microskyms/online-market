import Link from "next/link";
import { addToCart } from "@/app/actions/commerce";
import type { StoreOffer } from "@/lib/commerce/types";
import { formatBdt, formatSeconds } from "@/lib/format";
import { CATEGORIES } from "@/lib/market";

export function ProductScreen({ offer, related }: { offer: StoreOffer; related: StoreOffer[] }) {
  const category = CATEGORIES.find((item) => item.id === offer.category);
  return (
    <div className="page">
      <div className="product-layout">
        <div className="hero">
          {offer.video ? (
            <video poster={offer.poster} controls playsInline preload="none" aria-label={`${offer.title}. Product clip.`}>
              <source src={offer.video} type="video/mp4" />
              <track kind="descriptions" srcLang="en" label="English description" src="/media/silent-demo.vtt" />
            </video>
          ) : (
            <img src={offer.poster} alt={`${offer.title}. Illustration, not a photograph of stock.`} />
          )}
        </div>
        <div className="stack">
          <p className="eyebrow">{category?.label}</p>
          <h1>{offer.title}</h1>
          <p className="price">{formatBdt(offer.priceBdt)}</p>
          <p>
            {offer.sellerName}
            {offer.sellerArea ? ` · ${offer.sellerArea}` : ""}
          </p>
          <p className="notice">
            {offer.purchasable
              ? `In stock: ${offer.stock}. Delivery is only available if checkout is open for your division.`
              : "Not for sale. Stock shown on preview listings is not a warehouse count. Delivery and payment are not open."}
          </p>
          <p>{offer.description}</p>
          {offer.durationSec ? <p className="help">Clip length about {formatSeconds(offer.durationSec)}. Recommended 15 seconds, maximum 30.</p> : null}
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
            <Link className="btn" href={`/?item=${offer.id}`}>
              Watch in the reel
            </Link>
            <Link className="btn secondary" href={`/shop?category=${offer.category}`}>
              More in {category?.short}
            </Link>
          </div>
          {!offer.purchasable ? <p className="help">There is no add-to-bag action because this item cannot be ordered.</p> : null}
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
