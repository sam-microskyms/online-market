import { Suspense } from "react";
import { ClosedBanner } from "@/components/retail-header";
import { ShopGrid } from "@/components/shop-grid";
import { loadStorefront } from "@/lib/commerce/storefront";

export const metadata = { title: "Shop" };

export default function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}) {
  return (
    <Suspense fallback={<p className="status-line">Opening the shop…</p>}>
      <ShopContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ShopContent({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const store = await loadStorefront();
  return (
    <>
      <ClosedBanner notice={store.notice} />
      <ShopGrid offers={store.offers} category={params.category || "all"} query={params.q || ""} sort={params.sort || "featured"} />
    </>
  );
}
