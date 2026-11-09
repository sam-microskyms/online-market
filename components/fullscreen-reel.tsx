"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { usePrefersReducedMotion } from "@/components/use-reduced-motion";
import type { StoreOffer } from "@/lib/commerce/types";
import { formatBdt } from "@/lib/format";

export function FullscreenReel({ offers, startId }: { offers: StoreOffer[]; startId?: string }) {
  const reduced = usePrefersReducedMotion();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const searchId = useId();
  const initial = offers.some((offer) => offer.id === startId) ? startId ?? offers[0]?.id ?? "" : offers[0]?.id ?? "";
  const activeRef = useRef(initial);
  const [activeId, setActiveId] = useState(initial);
  const [muted, setMuted] = useState(true);
  const [hold, setHold] = useState(false);
  const [manualPlay, setManualPlay] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [failed, setFailed] = useState<Record<string, string>>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape" || (!menuOpen && !searchOpen)) return;
      event.preventDefault();
      setMenuOpen(false);
      setSearchOpen(false);
      menuButtonRef.current?.focus();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen, searchOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const panel = document.getElementById(menuId);
    panel?.querySelector<HTMLElement>("a, button")?.focus();
  }, [menuId, menuOpen]);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const nodes = [...root.querySelectorAll<HTMLElement>("[data-reel]")];
    const observer = new IntersectionObserver(
      (entries) => {
        const best = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const id = best?.target instanceof HTMLElement ? best.target.dataset.reel : undefined;
        if (!id || id === activeRef.current) return;
        activeRef.current = id;
        setActiveId(id);
        setHold(false);
        setManualPlay(false);
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
      const id = video.closest<HTMLElement>("[data-reel]")?.dataset.reel ?? "";
      const active = id === activeId;
      video.muted = muted;
      const mayAutoplay = reduced === false;
      const shouldPlay = active && !hidden && !failed[id] && !hold && (mayAutoplay || manualPlay);
      if (!shouldPlay) {
        video.pause();
        continue;
      }
      const pending = video.play();
      if (pending) {
        pending.catch(() => {
          setFailed((current) => ({ ...current, [id]: "Playback did not start." }));
        });
      }
    }
  }, [activeId, failed, hidden, hold, manualPlay, muted, reduced]);

  function go(delta: number) {
    const cards = [...(scrollerRef.current?.querySelectorAll<HTMLElement>("[data-reel]") ?? [])];
    if (!cards.length) return;
    const index = Math.max(0, cards.findIndex((card) => card.dataset.reel === activeId));
    const next = Math.min(cards.length - 1, Math.max(0, index + delta));
    cards[next]?.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
  }

  function closeOverlays() {
    setMenuOpen(false);
    setSearchOpen(false);
    menuButtonRef.current?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      if (menuOpen || searchOpen) {
        event.preventDefault();
        closeOverlays();
      }
      return;
    }
    const target = event.target as HTMLElement;
    const inControl = target.closest("input, textarea, select, video, a, button");
    if (inControl && inControl !== event.currentTarget) return;
    if (event.key === "ArrowDown" || event.key === "PageDown") {
      event.preventDefault();
      go(1);
    } else if (event.key === "ArrowUp" || event.key === "PageUp") {
      event.preventDefault();
      go(-1);
    } else if (event.key === " " || event.key === "k") {
      event.preventDefault();
      togglePlay();
    } else if (event.key === "m") {
      event.preventDefault();
      setMuted((value) => !value);
    }
  }

  function togglePlay() {
    const activeFailed = Boolean(failed[activeId]);
    const isPlaying = !hold && !activeFailed && (reduced === false || manualPlay);
    if (isPlaying) {
      setHold(true);
      setManualPlay(false);
      return;
    }
    setHold(false);
    setManualPlay(true);
    setFailed((current) => {
      if (!current[activeId]) return current;
      const next = { ...current };
      delete next[activeId];
      return next;
    });
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
  const playing = !hold && (reduced === false || manualPlay) && !failed[activeId];

  return (
    <div className="reel-screen">
      <div className="reel-top">
        <Link href="/shop">Shop</Link>
        {searchOpen ? (
          <form className="reel-search" action="/shop" method="get" role="search">
            <label className="visually-hidden" htmlFor={searchId}>
              Search listings
            </label>
            <input id={searchId} ref={searchRef} name="q" placeholder="Search listings" />
            <button type="submit">Search</button>
          </form>
        ) : (
          <button type="button" onClick={() => { setSearchOpen(true); setMenuOpen(false); }}>
            Search
          </button>
        )}
        <button
          ref={menuButtonRef}
          type="button"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          onClick={() => {
            setMenuOpen((open) => !open);
            setSearchOpen(false);
          }}
        >
          Menu
        </button>
        <span>
          {index + 1} / {offers.length}
        </span>
        {menuOpen ? (
          <nav id={menuId} className="reel-menu" aria-label="Shop">
            <Link href="/shop">Shop</Link>
            <Link href="/cart">Cart</Link>
            <Link href="/sell">Become a Seller</Link>
            <Link href="/account">Account</Link>
            <Link href="/checkout">Checkout status</Link>
            <p>Checkout is not open. Prices on the reel are sample figures.</p>
          </nav>
        ) : null}
      </div>
      <div
        ref={scrollerRef}
        className="reel-scroller"
        tabIndex={0}
        aria-label="Product videos. Arrow keys move between clips. Space pauses when this list is focused. M mutes."
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
              <div className="reel-hit">
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
                    onError={() => setFailed((current) => ({ ...current, [offer.id]: "This clip could not be loaded." }))}
                  />
                )}
              </div>
              <div className="reel-meta">
                <p className="reel-kicker">Browse-only demo · not for sale</p>
                <p className="reel-title">{offer.title}</p>
                <p className="reel-price">
                  <span>Sample price</span> {formatBdt(offer.priceBdt)}
                </p>
                <p className="reel-seller">
                  {offer.sellerName}
                  {offer.sellerArea ? ` · ${offer.sellerArea}` : ""}
                </p>
                {failed[offer.id] ? <p role="status">{failed[offer.id]}</p> : null}
                <div className="reel-actions">
                  <button type="button" aria-pressed={playing} onClick={togglePlay}>
                    {playing ? "Pause" : "Play"}
                  </button>
                  <button type="button" aria-pressed={!muted} onClick={() => setMuted((value) => !value)}>
                    {muted ? "Unmute" : "Mute"}
                  </button>
                  <Link className="btn" href={`/product/${offer.id}`}>
                    Product details
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
