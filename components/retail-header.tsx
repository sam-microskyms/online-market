import Link from "next/link";
import type { Viewer } from "@/lib/commerce/types";
import { CATEGORIES } from "@/lib/market";

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
          <Link href="/sell">Become a Seller</Link>
          <Link href="/account">{viewer.signedIn ? viewer.displayName || "Account" : "Sign in"}</Link>
          <Link href="/cart">Bag</Link>
        </nav>
      </div>
      <nav className="retail-cats" aria-label="Categories">
        <Link href="/">Reels</Link>
        <Link href="/shop">Shop</Link>
        {CATEGORIES.map((category) => (
          <Link key={category.id} href={`/shop?category=${category.id}`}>
            {category.short}
          </Link>
        ))}
      </nav>
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

export function ClosedBanner({ notice }: { notice: string | null }) {
  if (!notice) return null;
  return (
    <p className="closed-banner" role="status">
      {notice} <Link href="/checkout">Details</Link>
    </p>
  );
}
