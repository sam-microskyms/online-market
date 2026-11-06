import { SellApplicationForm } from "@/components/sell-portal";
import { readCommerceConfig } from "@/lib/commerce/config";
import { getViewer } from "@/lib/commerce/session";

export const metadata = { title: "Seller application" };

export default async function ApplyPage() {
  const config = readCommerceConfig(process.env);
  const viewer = await getViewer();
  return (
    <div className="page">
      <header className="page-intro">
        <p className="eyebrow">Application</p>
        <h1>Apply to sell</h1>
        <p className="lede">Submitting is stored only when the database is configured. Otherwise the form explains that and does not pretend the application was received.</p>
      </header>
      {viewer.sellerStatus === "active" ? <p className="notice">This account already has an approved seller desk.</p> : null}
      {viewer.sellerStatus === "pending" ? <p className="notice">An application from this account is already waiting for review.</p> : null}
      <SellApplicationForm accountsOpen={config.databaseConfigured} signedIn={viewer.signedIn} />
    </div>
  );
}
