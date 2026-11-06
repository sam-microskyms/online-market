import { moderateApplication, moderateProduct } from "@/app/actions/commerce";
import type { ReactNode } from "react";
import { canAccessAdmin } from "@/lib/commerce/policy";
import { readCommerceConfig } from "@/lib/commerce/config";
import { getViewer } from "@/lib/commerce/session";
import { createSupabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const config = readCommerceConfig(process.env);
  const viewer = await getViewer();
  if (!config.databaseConfigured) {
    return (
      <div className="page">
        <h1>Admin is not available</h1>
        <p className="lede">
          There is no public admin switch. After Supabase is configured, promote one account with the service role: update profiles set role = admin where id = the user id.
        </p>
      </div>
    );
  }
  if (!canAccessAdmin(viewer.role)) {
    return (
      <div className="page">
        <h1>Not an admin</h1>
        <p>{viewer.signedIn ? "This account cannot review applications or listings." : "Sign in with an admin account."}</p>
      </div>
    );
  }
  const supabase = await createSupabaseServer();
  const [{ data: applications }, { data: products }] = await Promise.all([
    supabase!.from("seller_applications").select("id, business_name, area, status, summary").eq("status", "pending"),
    supabase!.from("products").select("id, title, status, price_bdt").in("status", ["pending", "live"]),
  ]);
  return (
    <div className="page">
      <h1>Moderation</h1>
      <p className="lede">Approvals are written to the database for this signed-in admin. They do not change someone else&apos;s browser storage.</p>
      <h2>Seller applications</h2>
      {(applications ?? []).length === 0 ? <p>No applications waiting.</p> : null}
      {(applications ?? []).map((application) => (
        <ApplicationRow key={application.id} id={application.id} name={application.business_name} area={application.area} summary={application.summary} />
      ))}
      <h2>Listings</h2>
      {(products ?? []).map((product) => (
        <ProductRow key={product.id} id={product.id} title={product.title} status={product.status} />
      ))}
    </div>
  );
}

function ApplicationRow({ id, name, area, summary }: { id: string; name: string; area: string; summary: string }) {
  async function approve() {
    "use server";
    await moderateApplication(id, "approved");
  }
  async function reject() {
    "use server";
    await moderateApplication(id, "rejected");
  }
  return (
    <article className="order-card">
      <h3>{name}</h3>
      <p>{area}</p>
      <p>{summary}</p>
      <form action={approve}>
        <button className="btn" type="submit">
          Approve seller
        </button>
      </form>
      <form action={reject}>
        <button className="btn secondary" type="submit">
          Reject
        </button>
      </form>
    </article>
  );
}

function ProductRow({ id, title, status }: { id: string; title: string; status: string }) {
  async function publish() {
    "use server";
    await moderateProduct(id, "live");
  }
  async function hide() {
    "use server";
    await moderateProduct(id, "hidden");
  }
  let action: ReactNode = null;
  if (status !== "live") {
    action = (
      <form action={publish}>
        <button className="btn" type="submit">
          Approve listing
        </button>
      </form>
    );
  } else {
    action = (
      <form action={hide}>
        <button className="btn secondary" type="submit">
          Hide
        </button>
      </form>
    );
  }
  return (
    <article className="order-card">
      <h3>{title}</h3>
      <p>{status}</p>
      {action}
    </article>
  );
}
