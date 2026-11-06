import Link from "next/link";
import { canAccessSellerDesk } from "@/lib/commerce/policy";
import { readCommerceConfig } from "@/lib/commerce/config";
import { getViewer } from "@/lib/commerce/session";
import { createSupabaseServer } from "@/lib/supabase/server";
import { formatBdt } from "@/lib/format";

export const metadata = { title: "Seller desk" };

export default async function SellerPage() {
  const config = readCommerceConfig(process.env);
  const viewer = await getViewer();
  if (!config.databaseConfigured) {
    return (
      <div className="page">
        <h1>Seller desk unavailable</h1>
        <p className="lede">The desk opens only for an approved seller after Supabase is configured. There is no role switch.</p>
        <Link className="btn" href="/sell">
          Become a Seller
        </Link>
      </div>
    );
  }
  if (!canAccessSellerDesk(viewer.sellerStatus) || !viewer.sellerId) {
    return (
      <div className="page">
        <h1>Seller desk closed</h1>
        <p className="lede">
          {viewer.signedIn
            ? `This account is a customer. Seller access is ${viewer.sellerStatus}.`
            : "Sign in and wait for an approved application."}
        </p>
        <Link className="btn" href="/sell/apply">
          Application
        </Link>
      </div>
    );
  }
  const supabase = await createSupabaseServer();
  const { data: products } = await supabase!.from("products").select("id, title, price_bdt, stock, status").eq("seller_id", viewer.sellerId);
  const { data: items } = await supabase!.from("order_items").select("id, title, qty, price_bdt, order_id").eq("seller_id", viewer.sellerId);
  return (
    <div className="page">
      <header className="page-intro">
        <p className="eyebrow">Seller desk</p>
        <h1>{viewer.displayName || "Your shop"}</h1>
        <p className="lede">Listings you save stay pending until an admin approves them. You only see order lines for your seller id.</p>
      </header>
      <Link className="btn" href="/seller/new">
        New listing
      </Link>
      <h2>Listings</h2>
      {(products ?? []).length === 0 ? <p>No listings yet.</p> : null}
      {(products ?? []).map((product) => (
        <article key={product.id} className="order-card">
          <h3>{product.title}</h3>
          <p>
            {formatBdt(product.price_bdt)} · stock {product.stock} · {product.status}
          </p>
        </article>
      ))}
      <h2>Your order lines</h2>
      {(items ?? []).length === 0 ? <p>No order lines for this seller.</p> : null}
      {(items ?? []).map((item) => (
        <p key={item.id}>
          {item.qty} × {item.title} · {formatBdt(item.price_bdt * item.qty)}
        </p>
      ))}
    </div>
  );
}
