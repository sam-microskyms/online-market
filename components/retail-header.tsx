import Link from "next/link";
import { Suspense } from "react";
import { CategoryNav } from "@/components/category-nav";
import type { Viewer } from "@/lib/commerce/types";

export function RetailHeader({ viewer }: { viewer: Viewer }) {
  return (
    <header className="retail-header">
      <div className="retail-top">
        <Link className="brand" href="/">
          <span className="mark" aria-hidden="true">
            OM
          </span>
          <span className="brand-en">Online Market</span>
        </Link>
        <form className="retail-search" action="/shop" method="get" role="search">
          <label className="visually-hidden" htmlFor="q">
            Search the shop
          </label>
          <input id="q" name="q" placeholder="Search listings" />
          <button className="btn tiny" type="submit">
            Search
          </button>
        </form>
        <nav className="retail-tools" aria-label="Account">
          <Link href="/sell">
            <StoreIcon />
            Become a Seller
          </Link>
          <Link href="/account">
            <UserIcon />
            {viewer.signedIn ? viewer.displayName || "Account" : "Sign in"}
          </Link>
          <Link href="/cart">
            <BagIcon />
            Bag
          </Link>
        </nav>
      </div>
      <Suspense fallback={<nav className="retail-cats" aria-label="Categories" />}>
        <CategoryNav />
      </Suspense>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>
        <span lang="bn">অনলাইন মার্কেট</span>
        {" · "}
        Multi-seller shop for Bangladesh. Prices in BDT. Checkout is not open.
      </p>
      <nav aria-label="Footer">
        <Link href="/sell">Become a Seller</Link>
        <Link href="/account">Account</Link>
        <Link href="/checkout">Checkout status</Link>
        <Link href="/live">Livestreams</Link>
      </nav>
    </footer>
  );
}

function StoreIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9.5 12 4l8 5.5V20H4Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 20v-6h6v6" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 19.5c1.4-3 3.8-4.5 7-4.5s5.6 1.5 7 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.5 8h11l-.8 11h-9.4Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 8V6.5A3 3 0 0 1 12 3.5 3 3 0 0 1 15 6.5V8" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function ClosedBanner({ notice }: { notice: string | null }) {
  if (!notice) return null;
  return (
    <p className="closed-banner" role="status">
      {notice} <Link href="/checkout">Details</Link>
    </p>
  );
}
