import Link from "next/link";
import { Suspense } from "react";
import { ClosedBanner } from "@/components/retail-header";
import { HomeReel } from "@/components/home-reel";
import { loadStorefront } from "@/lib/commerce/storefront";
import { CATEGORIES } from "@/lib/market";

export default function HomePage({ searchParams }: { searchParams: Promise<{ item?: string }> }) {
  return (
    <Suspense fallback={<p className="status-line">Opening the reel…</p>}>
      <HomeContent searchParams={searchParams} />
    </Suspense>
  );
}

async function HomeContent({ searchParams }: { searchParams: Promise<{ item?: string }> }) {
  const params = await searchParams;
  const store = await loadStorefront();
  return (
    <>
      <ClosedBanner notice={store.notice} />
      <HomeReel offers={store.offers} startId={params.item} />
      <section className="page">
        <header className="page-intro">
          <p className="eyebrow">Shop</p>
          <h2>Categories</h2>
          <p className="lede">The reel is the front of the shop. These departments are the same listings in a grid.</p>
        </header>
        <div className="category-grid">
          {CATEGORIES.map((category) => (
            <Link key={category.id} href={`/shop?category=${category.id}`}>
              <strong>{category.label}</strong>
              <span>Open the grid</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
