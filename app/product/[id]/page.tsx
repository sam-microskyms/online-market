import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ClosedBanner } from "@/components/retail-header";
import { ProductScreen } from "@/components/product-screen";
import { findOffer } from "@/lib/commerce/preview";
import { loadStorefront } from "@/lib/commerce/storefront";

export const metadata = { title: "Product" };

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="status-line">Opening the product…</p>}>
      <ProductContent params={params} />
    </Suspense>
  );
}

async function ProductContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await loadStorefront();
  const offer = findOffer(store.offers, id);
  if (!offer) notFound();
  const related = store.offers.filter((item) => item.category === offer.category && item.id !== offer.id).slice(0, 3);
  return (
    <>
      <ClosedBanner notice={store.notice} />
      <ProductScreen offer={offer} related={related} />
    </>
  );
}
