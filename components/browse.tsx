"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatBdt } from "@/lib/format";
import { CATEGORIES, customerFeed, filterProducts, sellerById } from "@/lib/market";
import { useMarket } from "@/lib/store";

export function Browse() {
  const params = useSearchParams();
  const router = useRouter();
  const { state } = useMarket();
  const text = params.get("q") ?? "";
  const category = params.get("category") ?? "all";
  const sellerId = params.get("seller") ?? "all";
  const sort = params.get("sort") ?? "featured";
  const inStock = params.get("stock") === "in";
  const visible = customerFeed(state);
  const results = filterProducts(visible, state.sellers, { text, category, sellerId, inStock, sort });
  const categoryLabel = CATEGORIES.find((item) => item.id === category)?.label;

  function update(next: Record<string, string>) {
    const query = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (!value || value === "all" || value === "featured" || value === "any") query.delete(key);
      else query.set(key, value);
    }
    const suffix = query.toString();
    router.replace(suffix ? `/browse?${suffix}` : "/browse", { scroll: false });
  }

  return (
    <div className="page">
      <header className="page-intro">
        <p className="eyebrow">Demo stall</p>
        <h2>{categoryLabel ?? "Browse the haat"}</h2>
        <p className="lede">Search the sample catalog. Prices are in taka. Nothing here is for sale.</p>
      </header>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          update({ q: String(data.get("q") ?? "") });
        }}
      >
        <label className="field">
          <span>Search demo listings</span>
          <input name="q" value={text} placeholder="Scarf, lamp, Rong Ghor" onChange={(event) => update({ q: event.target.value })} />
        </label>
      </form>
      <div className="chips" aria-label="Categories">
        <Link className="chip" href={hrefWith(params, { category: "all" })} aria-current={category === "all" ? "true" : undefined}>
          All
        </Link>
        {CATEGORIES.map((item) => (
          <Link
            key={item.id}
            className="chip"
            href={hrefWith(params, { category: item.id })}
            aria-current={category === item.id ? "true" : undefined}
          >
            {item.short}
          </Link>
        ))}
      </div>
      <div className="filters">
        <label className="field">
          <span>Seller</span>
          <select value={sellerId} onChange={(event) => update({ seller: event.target.value })}>
            <option value="all">All sample sellers</option>
            {state.sellers
              .filter((seller) => seller.status === "active")
              .map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.name}
                </option>
              ))}
          </select>
        </label>
        <label className="field">
          <span>Sort</span>
          <select value={sort} onChange={(event) => update({ sort: event.target.value })}>
            <option value="featured">Stall order</option>
            <option value="price-asc">Price, low to high</option>
            <option value="price-desc">Price, high to low</option>
          </select>
        </label>
        <label className="field">
          <span>Stock</span>
          <select value={inStock ? "in" : "any"} onChange={(event) => update({ stock: event.target.value })}>
            <option value="any">Any demo stock</option>
            <option value="in">In stock only</option>
          </select>
        </label>
      </div>
      <p className="help">
        {results.length} listing{results.length === 1 ? "" : "s"}
        {sellerId !== "all" ? ` · ${sellerById(state.sellers, sellerId)?.name ?? "seller"}` : ""}
      </p>
      {results.length === 0 ? (
        <div className="stack" style={{ marginTop: 16 }}>
          <h2>No listings match</h2>
          <p>Try another word, or clear the filters.</p>
          <Link className="btn" href="/browse">
            Clear filters
          </Link>
        </div>
      ) : (
        <div className="grid" style={{ marginTop: 12 }}>
          {results.map((product) => {
            const seller = sellerById(state.sellers, product.sellerId);
            return (
              <Link key={product.id} className="card" href={`/product/${product.id}`}>
                <img src={product.poster} alt={`${product.title}. Demo illustration, not a photograph.`} />
                <h2>{product.title}</h2>
                <p className="price">{formatBdt(product.priceBdt)}</p>
                <p className="help">
                  {seller?.name}
                  {product.stock < 1 ? " · Sold out" : ` · Stock ${product.stock}`}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function hrefWith(params: URLSearchParams, next: Record<string, string>): string {
  const query = new URLSearchParams(params.toString());
  for (const [key, value] of Object.entries(next)) {
    if (!value || value === "all") query.delete(key);
    else query.set(key, value);
  }
  const suffix = query.toString();
  return suffix ? `/browse?${suffix}` : "/browse";
}
