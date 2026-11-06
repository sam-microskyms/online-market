import { Suspense } from "react";
import { ProductView } from "@/components/product-view";

export const metadata = { title: "Listing" };

export default function ProductPage() {
  return (
    <Suspense fallback={<p className="status-line">Opening the listing…</p>}>
      <ProductView />
    </Suspense>
  );
}
