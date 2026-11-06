"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CATEGORIES } from "@/lib/market";

export function CategoryNav() {
  const path = usePathname();
  const params = useSearchParams();
  const category = params.get("category");
  const onShop = path === "/shop";

  return (
    <nav className="retail-cats" aria-label="Categories">
      <Link href="/" aria-current={path === "/" ? "page" : undefined}>
        Reels
      </Link>
      <Link href="/shop" aria-current={onShop && !category ? "page" : undefined}>
        Shop
      </Link>
      {CATEGORIES.map((item) => (
        <Link key={item.id} href={`/shop?category=${item.id}`} aria-current={onShop && category === item.id ? "page" : undefined}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
