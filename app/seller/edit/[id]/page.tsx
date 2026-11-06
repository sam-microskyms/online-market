import { Suspense } from "react";
import { EditListing } from "@/components/edit-listing";

export const metadata = { title: "Edit listing" };

export default function EditListingPage() {
  return (
    <Suspense fallback={<p className="status-line">Opening the listing form…</p>}>
      <EditListing />
    </Suspense>
  );
}
