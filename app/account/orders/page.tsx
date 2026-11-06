import Link from "next/link";
import { readCommerceConfig } from "@/lib/commerce/config";
import { getViewer } from "@/lib/commerce/session";
import { createSupabaseServer } from "@/lib/supabase/server";
import { formatBdt, formatWhen } from "@/lib/format";

export const metadata = { title: "Orders" };

export default async function OrdersPage() {
  const config = readCommerceConfig(process.env);
  const viewer = await getViewer();
  if (!config.databaseConfigured || !viewer.signedIn || !viewer.userId) {
    return (
      <div className="page">
        <h1>Orders</h1>
        <p className="lede">There are no orders to show. Accounts and checkout are not both available for this session.</p>
        <Link className="btn" href="/account">
          Account
        </Link>
      </div>
    );
  }
  const supabase = await createSupabaseServer();
  const { data } = await supabase!.from("orders").select("id, status, total_bdt, created_at, division").eq("customer_id", viewer.userId).order("created_at", { ascending: false });
  const orders = data ?? [];
  return (
    <div className="page">
      <h1>Orders</h1>
      {orders.length === 0 ? <p>No orders yet.</p> : null}
      {orders.map((order) => (
        <article key={order.id} className="order-card">
          <h2>
            <Link href={`/order/${order.id}`}>{order.id}</Link>
          </h2>
          <p>
            {order.status} · {order.division} · {formatBdt(order.total_bdt)} · {formatWhen(order.created_at)}
          </p>
        </article>
      ))}
    </div>
  );
}
