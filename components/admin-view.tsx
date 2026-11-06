"use client";

import { useState, type ReactNode } from "react";
import { formatBdt } from "@/lib/format";
import { REJECT_REASONS, sellerById } from "@/lib/market";
import { useMarket } from "@/lib/store";
import type { Product, Seller } from "@/lib/types";

export function AdminView() {
  const { state, moderateProduct, moderateSeller } = useMarket();
  const pendingSellers = state.sellers.filter((seller) => seller.status === "pending");
  const pendingProducts = state.products.filter((product) => product.status === "pending");
  const live = state.products.filter((product) => product.status === "live");
  const closed = state.products.filter((product) => product.status === "hidden" || product.status === "rejected");
  const closedSellers = state.sellers.filter((seller) => seller.status === "rejected");

  return (
    <div className="page">
      <header className="page-intro">
        <p className="eyebrow">Admin demo</p>
        <h2>Review queue</h2>
        <p className="lede">
          Approve, reject, and hide actions change what the customer stall shows. They are stored in this browser only. This is not an account system.
        </p>
      </header>
      <nav className="queue-jump" aria-label="Queues">
        <a href="#pending-sellers">Sellers ({pendingSellers.length})</a>
        <a href="#pending-products">Listings ({pendingProducts.length})</a>
        <a href="#live">Live ({live.length})</a>
        <a href="#closed">Hidden and rejected ({closed.length})</a>
      </nav>

      <section id="pending-sellers" className="stack">
        <h2>Sellers waiting</h2>
        {pendingSellers.length === 0 ? <p className="help">No sellers are waiting.</p> : null}
        {pendingSellers.map((seller) => (
          <SellerCard key={seller.id} seller={seller} onApprove={() => moderateSeller(seller.id, "approve")} onReject={(note) => moderateSeller(seller.id, "reject", note)} />
        ))}
      </section>

      <section id="pending-products" className="stack" style={{ marginTop: 22 }}>
        <h2>Listings waiting</h2>
        {pendingProducts.length === 0 ? <p className="help">No listings are waiting.</p> : null}
        {pendingProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            sellerName={sellerById(state.sellers, product.sellerId)?.name ?? "Unknown"}
            actions={
              <Actions
                onApprove={() => moderateProduct(product.id, "approve")}
                onReject={(note) => moderateProduct(product.id, "reject", note)}
              />
            }
          />
        ))}
      </section>

      <section id="live" className="stack" style={{ marginTop: 22 }}>
        <h2>Live on the customer stall</h2>
        {live.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            sellerName={sellerById(state.sellers, product.sellerId)?.name ?? "Unknown"}
            actions={
              <button type="button" className="btn secondary" onClick={() => moderateProduct(product.id, "hide")}>
                Hide
              </button>
            }
          />
        ))}
      </section>

      <section id="closed" className="stack" style={{ marginTop: 22 }}>
        <h2>Hidden and rejected</h2>
        {closedSellers.map((seller) => (
          <article key={seller.id} className="order-card">
            <h3>{seller.name}</h3>
            <p>
              <span className="status-pill" data-status={seller.status}>
                {seller.status}
              </span>
            </p>
            <p className="help">{seller.reviewNote}</p>
            <button type="button" className="btn" onClick={() => moderateSeller(seller.id, "approve")}>
              Approve seller
            </button>
          </article>
        ))}
        {closed.length === 0 ? <p className="help">Nothing is hidden or rejected.</p> : null}
        {closed.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            sellerName={sellerById(state.sellers, product.sellerId)?.name ?? "Unknown"}
            actions={
              <button type="button" className="btn" onClick={() => moderateProduct(product.id, "restore")}>
                Restore to live
              </button>
            }
          />
        ))}
      </section>
    </div>
  );
}

function SellerCard({ seller, onApprove, onReject }: { seller: Seller; onApprove: () => void; onReject: (note: string) => void }) {
  return (
    <article className="order-card">
      <h3>{seller.name}</h3>
      <p>
        {seller.area} · <span className="status-pill" data-status={seller.status}>{seller.status}</span>
      </p>
      <p>{seller.blurb}</p>
      <Actions onApprove={onApprove} onReject={onReject} />
    </article>
  );
}

function ProductCard({ product, sellerName, actions }: { product: Product; sellerName: string; actions: ReactNode }) {
  return (
    <article className="mod-card">
      <img className="thumb" src={product.poster} alt="" />
      <div>
        <h3>{product.title}</h3>
        <p>
          {sellerName} · {formatBdt(product.priceBdt)} · stock {product.stock}
        </p>
        <p>
          <span className="status-pill" data-status={product.status}>
            {product.status}
          </span>
        </p>
        <p className="help">{product.claim}</p>
        {product.reviewNote ? <p className="help">{product.reviewNote}</p> : null}
      </div>
      <div className="row-actions">{actions}</div>
    </article>
  );
}

function Actions({ onApprove, onReject }: { onApprove: () => void; onReject: (note: string) => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(REJECT_REASONS[0]);
  return (
    <div className="row-actions">
      <button type="button" className="btn" onClick={onApprove}>
        Approve
      </button>
      {open ? (
        <>
          <label className="field" style={{ margin: 0, minWidth: 220 }}>
            <span className="visually-hidden">Demo rejection reason</span>
            <select value={reason} onChange={(event) => setReason(event.target.value)}>
              {REJECT_REASONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="btn secondary" onClick={() => onReject(reason)}>
            Confirm reject
          </button>
        </>
      ) : (
        <button type="button" className="btn secondary" onClick={() => setOpen(true)}>
          Reject
        </button>
      )}
    </div>
  );
}
