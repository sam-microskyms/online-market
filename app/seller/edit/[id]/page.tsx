import Link from "next/link";

export const metadata = { title: "Edit listing" };

export default function EditListingPage() {
  return (
    <div className="page">
      <h1>Editing is not open</h1>
      <p className="lede">Approved sellers can create a pending listing. Changing an existing row is a follow-up, so this screen does not save edits.</p>
      <Link className="btn" href="/seller">
        Seller desk
      </Link>
    </div>
  );
}
