import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getViewer } from "@/lib/commerce/session";
import { createSupabaseServer } from "@/lib/supabase/server";
import { formatBdt } from "@/lib/format";

export const metadata = { title: "Order" };

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="status-line">Opening the order…</p>}>
      <OrderContent params={params} />
    </Suspense>
  );
}

async function OrderContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getViewer();
  const supabase = await createSupabaseServer();
  if (!supabase || !viewer.signedIn) {
    return (
      <div className="page">
        <h1>Order unavailable</h1>
        <p>Sign in with a configured shop account to read an order. Nothing is shown from this browser alone.</p>
        <Link className="btn" href="/account">
          Account
        </Link>
      </div>
    );
  }
  const { data: order } = await supabase.from("orders").select("id, status, total_bdt, division, method").eq("id", id).maybeSingle();
  if (!order) notFound();
  const { data: items } = await supabase.from("order_items").select("id, title, qty, price_bdt").eq("order_id", id);
  return (
    <div className="page">
      <p className="eyebrow">Order</p>
      <h1>{order.status === "paid" ? "Paid" : order.status === "accepted_cod" ? "Recorded for cash on delivery" : order.status}</h1>
      <p className="lede">
        {order.status === "paid"
          ? "A verified payment event marked this order paid."
          : "This screen does not mean a card was charged or that a courier has the parcel."}
      </p>
      <p>
        {order.division} · {order.method} · {formatBdt(order.total_bdt)}
      </p>
      <ul className="list-reset">
        {(items ?? []).map((item) => (
          <li key={item.id}>
            {item.qty} × {item.title} · {formatBdt(item.price_bdt * item.qty)}
          </li>
        ))}
      </ul>
    </div>
  );
}
