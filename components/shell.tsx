"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useRef, type KeyboardEvent, type ReactNode } from "react";
import { Canopy, Icon } from "@/components/icons";
import { cartCount, sellerById } from "@/lib/market";
import { useMarket } from "@/lib/store";
import type { Role } from "@/lib/types";

const ROLES: { id: Role; label: string }[] = [
  { id: "customer", label: "Customer" },
  { id: "seller", label: "Seller" },
  { id: "admin", label: "Admin" },
];

export function Shell({ children }: { children: ReactNode }) {
  const { state, toast, dismissToast, setRole, setActingSeller, reset } = useMarket();
  const resetRef = useRef<HTMLDialogElement>(null);
  const seller = sellerById(state.sellers, state.actingSellerId);
  const count = cartCount(state);
  const deskHref = state.role === "seller" ? "/seller" : state.role === "admin" ? "/admin" : "/orders";
  const deskLabel = state.role === "seller" ? "Sell" : state.role === "admin" ? "Admin" : "Orders";
  const links = [
    { href: "/", label: "Reel", icon: "reel" as const },
    { href: "/browse", label: "Browse", icon: "browse" as const },
    { href: "/live", label: "Live", icon: "live" as const },
    { href: "/cart", label: "Bag", icon: "bag" as const },
    { href: deskHref, label: deskLabel, icon: "desk" as const },
  ];

  function onRoleKey(event: KeyboardEvent) {
    const index = ROLES.findIndex((item) => item.id === state.role);
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      setRole(ROLES[(index + 1) % ROLES.length].id);
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      setRole(ROLES[(index - 1 + ROLES.length) % ROLES.length].id);
    }
  }

  return (
    <div className="app">
      <a className="skip" href="#content">
        Skip to content
      </a>
      <header className="site-header">
        <Link className="brand" href="/">
          <Canopy />
          <h1>
            <span className="brand-en">Online Market</span>
            <span className="brand-bn" lang="bn">
              অনলাইন মার্কেট
            </span>
          </h1>
        </Link>
        <span className="demo-pill">Demo</span>
        <div className="role" role="radiogroup" aria-label="Demo role" aria-describedby="role-help" onKeyDown={onRoleKey}>
          {ROLES.map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={state.role === item.id}
              onClick={() => setRole(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p id="role-help" className="visually-hidden">
          Not a login. Every role is available in this browser. No password is asked.
        </p>
        <button type="button" className="btn secondary tiny header-reset" onClick={() => resetRef.current?.showModal()}>
          Reset
        </button>
      </header>
      <div className="workspace">
        <div className="main-col">
          {state.role !== "customer" ? (
            <div className="subbar">
              {state.role === "seller" ? (
                <>
                  <p>
                    Seller demo, acting as <strong>{seller?.name ?? "a sample seller"}</strong>. Buyers do not see pending listings.
                  </p>
                  <label className="field" style={{ margin: 0, minWidth: 180 }}>
                    <span className="visually-hidden">Acting seller</span>
                    <select value={state.actingSellerId} onChange={(event) => setActingSeller(event.target.value)} aria-label="Acting seller">
                      {state.sellers.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.status})
                        </option>
                      ))}
                    </select>
                  </label>
                  <Link href="/seller">Open seller desk</Link>
                </>
              ) : (
                <>
                  <p>Admin demo. Approve, reject, and hide actions stay in this browser.</p>
                  <Link href="/admin">Open admin desk</Link>
                </>
              )}
            </div>
          ) : null}
          <main id="content">{children}</main>
        </div>
        <Suspense fallback={<TabLinks links={links} count={count} pathname="" />}>
          <PrimaryNav links={links} count={count} />
        </Suspense>
      </div>
      <dialog ref={resetRef} className="sheet" aria-labelledby="reset-title">
        <div className="sheet-body">
          <h2 id="reset-title">Reset demo data?</h2>
          <p>This clears the bag, simulated orders, listing edits, and moderation stored in this browser. The sample stall returns.</p>
          <div className="row-actions">
            <button type="button" className="btn secondary" onClick={() => resetRef.current?.close()}>
              Keep edits
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                reset();
                resetRef.current?.close();
              }}
            >
              Reset demo
            </button>
          </div>
        </div>
      </dialog>
      {toast ? (
        <div className="toast" role="status">
          <p>{toast}</p>
          <button type="button" onClick={dismissToast}>
            Dismiss
          </button>
        </div>
      ) : null}
    </div>
  );
}

function PrimaryNav({
  links,
  count,
}: {
  links: { href: string; label: string; icon: "reel" | "browse" | "live" | "bag" | "desk" }[];
  count: number;
}) {
  const pathname = usePathname();
  return <TabLinks links={links} count={count} pathname={pathname} />;
}

function TabLinks({
  links,
  count,
  pathname,
}: {
  links: { href: string; label: string; icon: "reel" | "browse" | "live" | "bag" | "desk" }[];
  count: number;
  pathname: string;
}) {
  return (
    <nav className="tabbar" aria-label="Primary">
      {links.map((link) => (
        <Link key={link.label} href={link.href} aria-current={pathname && isCurrent(pathname, link.href) ? "page" : undefined}>
          <Icon name={link.icon} />
          <span>{link.label}</span>
          {link.href === "/cart" && count > 0 ? <span className="tab-count">{count}</span> : null}
        </Link>
      ))}
    </nav>
  );
}

function isCurrent(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/orders") return pathname === "/orders" || pathname.startsWith("/order/");
  return pathname === href || pathname.startsWith(`${href}/`);
}
