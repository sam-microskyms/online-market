import Link from "next/link";
import type { StoreOffer } from "@/lib/commerce/types";
import { formatBdt } from "@/lib/format";
import { CATEGORIES } from "@/lib/market";

export function ShopGrid({
  offers,
  category,
  query,
  sort,
}: {
  offers: StoreOffer[];
  category: string;
  query: string;
  sort: string;
}) {
  const filtered = offers
    .filter((offer) => (category === "all" ? true : offer.category === category))
    .filter((offer) => {
      const needle = query.trim().toLowerCase();
      if (!needle) return true;
      return `${offer.title} ${offer.sellerName} ${offer.description}`.toLowerCase().includes(needle);
    })
    .sort((a, b) => (sort === "price-asc" ? a.priceBdt - b.priceBdt : sort === "price-desc" ? b.priceBdt - a.priceBdt : 0));
  const heading = CATEGORIES.find((item) => item.id === category)?.label ?? "Shop";

  return (
    <div className="page">
      <header className="page-intro">
        <p className="eyebrow">Shop</p>
        <h1>{heading}</h1>
        <p className="lede">Browse by category. The reel on the home page is the main way to look through listings.</p>
      </header>
      <form className="filters" action="/shop" method="get">
        <label className="field">
          <span>Search</span>
          <input name="q" defaultValue={query} />
        </label>
        <label className="field">
          <span>Category</span>
          <select name="category" defaultValue={category}>
            <option value="all">All categories</option>
            {CATEGORIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Sort</span>
          <select name="sort" defaultValue={sort}>
            <option value="featured">Featured</option>
            <option value="price-asc">Price, low to high</option>
            <option value="price-desc">Price, high to low</option>
          </select>
        </label>
        <button className="btn" type="submit">
          Apply
        </button>
      </form>
      <p className="help">{filtered.length} listings</p>
      {filtered.length === 0 ? (
        <p>Nothing matches. Try another category or search.</p>
      ) : (
        <div className="grid" style={{ marginTop: 12 }}>
          {filtered.map((offer) => (
            <Link key={offer.id} className="card" href={`/product/${offer.id}`}>
              <img src={offer.poster} alt={`${offer.title}. Illustration, not a photograph of stock.`} />
              <h2>{offer.title}</h2>
              <p className="price">{formatBdt(offer.priceBdt)}</p>
              <p className="help">
                {offer.sellerName}
                {offer.purchasable ? ` · Stock ${offer.stock}` : " · Not for sale"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
