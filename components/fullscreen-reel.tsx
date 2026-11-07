"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { usePrefersReducedMotion } from "@/components/use-reduced-motion";
import type { StoreOffer } from "@/lib/commerce/types";
import { formatBdt } from "@/lib/format";

export function FullscreenReel({ offers, startId }: { offers: StoreOffer[]; startId?: string }) {
  const reduced = usePrefersReducedMotion();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const initial = offers.some((offer) => offer.id === startId) ? startId ?? offers[0]?.id ?? "" : offers[0]?.id ?? "";
  const [activeId, setActiveId] = useState(initial);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [failed, setFailed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    document.body.classList.add("reel-open");
    return () => document.body.classList.remove("reel-open");
  }, []);

  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const nodes = [...root.querySelectorAll<HTMLElement>("[data-reel]")];
    const observer = new IntersectionObserver(
      (entries) => {
        const best = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const id = best?.target instanceof HTMLElement ? best.target.dataset.reel : undefined;
        if (id) setActiveId(id);
      },
      { root, threshold: [0.65, 0.9] },
    );
    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [offers]);

  useEffect(() => {
    if (!startId) return;
    scrollerRef.current?.querySelector<HTMLElement>(`[data-reel="${CSS.escape(startId)}"]`)?.scrollIntoView({ block: "start" });
  }, [startId]);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const videos = [...root.querySelectorAll<HTMLVideoElement>("video")];
    for (const video of videos) {
      const id = video.closest<HTMLElement>("[data-reel]")?.dataset.reel;
      const active = id === activeId;
      video.muted = muted;
      if (!active || hidden || reduced !== false || paused || failed[id ?? ""]) {
        video.pause();
        continue;
      }
      const pending = video.play();
      if (pending) pending.catch(() => undefined);
    }
  }, [activeId, failed, hidden, muted, paused, reduced]);

  function go(delta: number) {
    const cards = [...(scrollerRef.current?.querySelectorAll<HTMLElement>("[data-reel]") ?? [])];
    if (!cards.length) return;
    const index = Math.max(0, cards.findIndex((card) => card.dataset.reel === activeId));
    const next = Math.min(cards.length - 1, Math.max(0, index + delta));
    cards[next]?.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowDown" || event.key === "PageDown") {
      event.preventDefault();
      go(1);
    } else if (event.key === "ArrowUp" || event.key === "PageUp") {
      event.preventDefault();
      go(-1);
    } else if (event.key === " " || event.key === "k") {
      event.preventDefault();
      setPaused((value) => !value);
    } else if (event.key === "m") {
      event.preventDefault();
      setMuted((value) => !value);
    }
  }

  if (!offers.length) {
    return (
      <section className="reel-screen">
        <p className="reel-empty">No demo videos are available.</p>
        <Link href="/shop">Open the shop</Link>
      </section>
    );
  }

  const index = Math.max(0, offers.findIndex((offer) => offer.id === activeId));

  return (
    <div className="reel-screen">
      <div className="reel-top">
        <Link href="/shop">Shop</Link>
        <Link href="/shop">Search</Link>
        <Link href="/account">Account</Link>
        <span>
          {index + 1} / {offers.length}
        </span>
      </div>
      <div
        ref={scrollerRef}
        className="reel-scroller"
        tabIndex={0}
        aria-label="Product videos. Arrow keys move between clips. Space pauses. M mutes."
        onKeyDown={onKeyDown}
      >
        {offers.map((offer, offerIndex) => {
          const active = offer.id === activeId;
          const near = Math.abs(offerIndex - index) <= 1;
          return (
            <article key={offer.id} className="reel-frame" data-reel={offer.id}>
              <h2 id={`reel-${offer.id}`} className="visually-hidden">
                {offer.title}
              </h2>
              <button
                type="button"
                className="reel-hit"
                aria-label={paused || !active ? `Play ${offer.title}` : `Pause ${offer.title}`}
                onClick={() => {
                  if (active) setPaused((value) => !value);
                }}
              >
                {failed[offer.id] || !offer.video ? (
                  <img src={offer.poster} alt="" />
                ) : (
                  <video
                    src={near ? offer.video ?? undefined : undefined}
                    poster={offer.poster}
                    playsInline
                    loop
                    muted={muted}
                    preload={active ? "auto" : near ? "metadata" : "none"}
                    onError={() => setFailed((current) => ({ ...current, [offer.id]: true }))}
                  />
                )}
              </button>
              {failed[offer.id] ? <p className="reel-fallback">Video unavailable. The poster is a frame from the clip.</p> : null}
              <div className="reel-meta">
                <p className="reel-kicker">Demo video · sample product, not for sale</p>
                <p className="reel-title">{offer.title}</p>
                <p className="reel-price">{formatBdt(offer.priceBdt)}</p>
                <p className="reel-seller">
                  {offer.sellerName}
                  {offer.sellerArea ? ` · ${offer.sellerArea}` : ""}
                </p>
                <Link className="btn" href={`/product/${offer.id}`}>
                  Product details
                </Link>
              </div>
              <button type="button" className="reel-mute" aria-pressed={!muted} onClick={() => setMuted((value) => !value)}>
                {muted ? "Unmute" : "Mute"}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
