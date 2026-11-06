import type { StoreOffer } from "./types";
import type { CategoryId, Product, Seller } from "../types";

const illustratedVariants: Record<string, { id: string; label: string; priceBdt: number }[]> = {
  "nodi-hoops": [
    { id: "brass", label: "Brass tone", priceBdt: 890 },
    { id: "silver", label: "Silver tone", priceBdt: 980 },
  ],
  "nodi-scarf": [
    { id: "indigo", label: "Indigo", priceBdt: 2450 },
    { id: "mustard", label: "Mustard", priceBdt: 2450 },
  ],
  "tarit-lamp": [
    { id: "warm", label: "Warm shade", priceBdt: 1540 },
    { id: "clay", label: "Clay shade", priceBdt: 1540 },
  ],
};

export function offersFromSeed(seed: { sellers: Seller[]; products: Product[] }): StoreOffer[] {
  const activeSellers = new Set(seed.sellers.filter((seller) => seller.status === "active").map((seller) => seller.id));
  return seed.products
    .filter((product) => product.status === "live" && activeSellers.has(product.sellerId))
    .map((product) => {
      const seller = seed.sellers.find((item) => item.id === product.sellerId);
      return {
        id: product.id,
        title: product.title,
        category: product.category as CategoryId,
        priceBdt: product.priceBdt,
        stock: null,
        sellerId: product.sellerId,
        sellerName: seller?.name ?? "Unknown seller",
        sellerArea: seller?.area ?? "",
        description: product.description,
        details: product.details,
        poster: product.poster,
        video: product.video,
        durationSec: product.durationSec,
        preview: true,
        purchasable: false,
        variants: (illustratedVariants[product.id] ?? []).map((variant) => ({ ...variant, stock: null })),
      };
    });
}
