import Link from "next/link";
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
  const requested = params.item;
  if (requested && !clips.some((offer) => offer.id === requested)) {
    const named = store.offers.find((offer) => offer.id === requested);
    return (
      <section className="page">
        <h1>Not in the reel</h1>
        <p>
          {named
            ? `${named.title} is not one of the filmed clips, so it is not opened in the reel.`
            : "That listing is not in the reel."}
        </p>
        <p>
          <Link href="/">Open the filmed reel</Link>
          {" · "}
          <Link href={named ? `/product/${named.id}` : "/shop"}>{named ? "Back to the product" : "Shop"}</Link>
        </p>
      </section>
    );
  }
  return <FullscreenReel offers={clips} startId={requested} />;
}
