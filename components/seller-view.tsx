"use client";

import Link from "next/link";
import { formatBdt, formatWhen } from "@/lib/format";
import { categoryById, ordersForSeller, sellerById, sellerTakas } from "@/lib/market";
import { useMarket } from "@/lib/store";

export function SellerView() {
  const { state } = useMarket();
  const seller = sellerById(state.sellers, state.actingSellerId);
  if (!seller) {
    return (
      <div className="page">
        <h2>No demo seller selected</h2>
        <p>Use the seller switch in the header.</p>
      </div>
    );
  }
  const mine = state.products.filter((product) => product.sellerId === seller.id);
  const orders = ordersForSeller(state, seller.id);
  const live = mine.filter((product) => product.status === "live").length;
  const pending = mine.filter((product) => product.status === "pending").length;

  return (
    <div className="page">
      <header className="page-intro">
        <p className="eyebrow">Seller demo</p>
        <h2>{seller.name}</h2>
        <p className="lede">
          {seller.area}. {seller.blurb}
        </p>
      </header>
      {seller.status !== "active" ? (
        <p className="notice">
          This seller is {seller.status}. Buyers cannot see the listings until an admin approves the seller.
          {seller.reviewNote ? ` ${seller.reviewNote}` : ""}
        </p>
      ) : null}
      <div className="stat-row">
        <div className="stat">
          <strong>{live}</strong>
          Live listings
        </div>
        <div className="stat">
          <strong>{pending}</strong>
          Waiting for review
        </div>
        <div className="stat">
          <strong>{formatBdt(sellerTakas(state, seller.id))}</strong>
          Demo takas in sample orders
        </div>
      </div>
      <div className="row-actions">
        {seller.status === "rejected" ? (
          <p className="help">New listings stay closed while this seller is rejected. Switch to Admin to approve them.</p>
        ) : (
          <Link className="btn" href="/seller/new">
            New listing
          </Link>
        )}
      </div>
      <h2 style={{ marginTop: 22 }}>Listings</h2>
      {mine.length === 0 ? <p className="help">No listings for this seller yet.</p> : null}
      {mine.map((product) => (
        <article key={product.id} className="line">
          <img className="thumb" src={product.poster} alt="" />
          <div>
            <h3>{product.title}</h3>
            <p>
              {formatBdt(product.priceBdt)} · {categoryById(product.category)?.short} · stock {product.stock}
            </p>
            <p>
              <span className="status-pill" data-status={product.status}>
                {product.status}
              </span>
            </p>
            {product.reviewNote ? <p className="help">{product.reviewNote}</p> : null}
          </div>
          <Link className="btn secondary" href={`/seller/edit/${product.id}`}>
            Edit
          </Link>
        </article>
      ))}
      <h2 style={{ marginTop: 8 }}>Mock orders</h2>
      {orders.length === 0 ? (
        <p className="help">No sample orders for this seller yet. Place a simulated order as a customer.</p>
      ) : (
        orders.map((order) => (
          <article key={order.id} className="order-card">
            <h3>
              <Link href={`/order/${order.id}`}>{order.id}</Link>
            </h3>
            <p className="help">{formatWhen(order.createdAt)} · {order.historical ? "seeded sample" : "placed in this browser"}</p>
            <ul className="list-reset">
              {order.lines
                .filter((line) => line.sellerId === seller.id)
                .map((line) => (
                  <li key={line.productId}>
                    {line.qty} × {line.title} · {formatBdt(line.priceBdt * line.qty)}
                  </li>
                ))}
            </ul>
          </article>
        ))
      )}
    </div>
  );
}
