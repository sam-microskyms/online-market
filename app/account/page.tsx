import { SignInForm, SignOutButton, SignUpForm } from "@/components/account-forms";
import { readCommerceConfig } from "@/lib/commerce/config";
import { getViewer } from "@/lib/commerce/session";
import Link from "next/link";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const config = readCommerceConfig(process.env);
  const viewer = await getViewer();
  return (
    <div className="page account-grid">
      <header className="page-intro">
        <p className="eyebrow">Account</p>
        <h1>{viewer.signedIn ? "Your account" : "Sign in"}</h1>
        <p className="lede">Customer accounts are separate from selling. An application and an admin approval are required before the seller desk opens.</p>
      </header>
      {viewer.signedIn ? (
        <section className="stack">
          <p>{viewer.displayName || "Customer"}</p>
          <p className="help">{viewer.email}</p>
          <p>Role: {viewer.role}</p>
          <p>Seller access: {viewer.sellerStatus}</p>
          <div className="row-actions">
            <Link className="btn secondary" href="/account/orders">
              Orders
            </Link>
            <Link className="btn secondary" href="/sell/apply">
              Seller application
            </Link>
            <SignOutButton />
          </div>
        </section>
      ) : (
        <div className="account-grid">
          <SignInForm accountsOpen={config.databaseConfigured} />
          <SignUpForm accountsOpen={config.databaseConfigured} />
        </div>
      )}
    </div>
  );
}
