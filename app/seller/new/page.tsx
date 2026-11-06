import Link from "next/link";
import { ListingEditor } from "@/components/listing-editor";
import { canAccessSellerDesk } from "@/lib/commerce/policy";
import { getViewer } from "@/lib/commerce/session";

export const metadata = { title: "New listing" };

export default async function NewListingPage() {
  const viewer = await getViewer();
  if (!canAccessSellerDesk(viewer.sellerStatus)) {
    return (
      <div className="page">
        <h1>Listings are locked</h1>
        <p>Only an approved seller can open this form.</p>
        <Link className="btn" href="/sell">
          Become a Seller
        </Link>
      </div>
    );
  }
  return (
    <div className="page">
      <header className="page-intro">
        <p className="eyebrow">Listing</p>
        <h1>New listing</h1>
        <p className="lede">Saving creates a pending row. It does not upload the clip and it does not put the product on the reel.</p>
      </header>
      <ListingEditor />
    </div>
  );
}
