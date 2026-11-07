import { Suspense } from "react";
import { FullscreenReel } from "@/components/fullscreen-reel";
import { isFilmedClip } from "@/lib/commerce/preview-map";
import { loadStorefront } from "@/lib/commerce/storefront";

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
  const clips = store.offers.filter((offer) => isFilmedClip(offer.id) && offer.video);
  return <FullscreenReel offers={clips} startId={params.item} />;
}
