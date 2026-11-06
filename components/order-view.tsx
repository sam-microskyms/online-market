"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { formatBdt, formatWhen } from "@/lib/format";
import { PAY_METHODS } from "@/lib/market";
import { useMarket } from "@/lib/store";

export function OrderView() {
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === "string" ? params.id : "";
  const { state } = useMarket();
  const order = state.orders.find((item) => item.id === id) ?? null;

  if (!order) {
    return (
      <div className="page">
        <h2>No demo order with that number</h2>
        <p className="lede">It may belong to a reset browser, or the link is mistyped.</p>
        <Link className="btn" href="/orders">
          All demo orders
        </Link>
      </div>
    );
  }

  const method = PAY_METHODS.find((item) => item.id === order.method);

  return (
    <div className="page">
      <header className="page-intro">
        <p className="eyebrow">Simulated confirmation</p>
        <h2>{order.id}</h2>
        <p className="lede">Nothing was charged and no delivery was booked. This record lives in this browser only.</p>
      </header>
      <div className="banner">
        <strong>Demo complete.</strong> Keep shopping in the reel, or review the order list.
      </div>
      <p style={{ marginTop: 12 }}>{formatWhen(order.createdAt)} · Bangladesh time</p>
      <p>
        {order.division} · {method?.label ?? order.method}
        {order.historical ? " · seeded sample" : ""}
      </p>
      {order.note ? <p className="help">Note: {order.note}</p> : null}
      <ul className="list-reset">
        {order.lines.map((line) => (
          <li key={`${line.productId}-${line.sellerId}`}>
            {line.qty} × {line.title} · {formatBdt(line.priceBdt * line.qty)}
          </li>
        ))}
      </ul>
      <p className="price">Total {formatBdt(order.totalBdt)}</p>
      <div className="row-actions">
        <Link className="btn" href="/">
          Back to the reel
        </Link>
        <Link className="btn secondary" href="/orders">
          All demo orders
        </Link>
      </div>
    </div>
  );
}

export function OrdersView() {
  const { state } = useMarket();
  return (
    <div className="page">
      <header className="page-intro">
        <p className="eyebrow">This browser</p>
        <h2>Demo orders</h2>
        <p className="lede">Seeded samples plus any simulated checkout you place. None of these left the browser.</p>
      </header>
      {state.orders.length === 0 ? (
        <Link className="btn" href="/browse">
          Browse the stall
        </Link>
      ) : (
        state.orders.map((order) => (
          <article key={order.id} className="order-card">
            <h2>
              <Link href={`/order/${order.id}`}>{order.id}</Link>
            </h2>
            <p>
              {formatWhen(order.createdAt)} · {order.division} · {formatBdt(order.totalBdt)}
            </p>
            <p className="help">{order.lines.map((line) => line.title).join(", ")}</p>
          </article>
        ))
      )}
    </div>
  );
}
