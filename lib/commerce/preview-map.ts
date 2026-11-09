import type { StoreOffer } from "./types";
import type { CategoryId, Product, Seller } from "../types";

const sampleNote = "Sample photograph. Not merchandise held for sale. The price is a sample figure in BDT.";

export const FILMED_CLIP_IDS = ["basha-bottle", "basha-jars", "basha-cushion"] as const;

export function isFilmedClip(id: string) {
  return (FILMED_CLIP_IDS as readonly string[]).includes(id);
}

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
        description: isFilmedClip(product.id) ? product.description : sampleNote,
        details: isFilmedClip(product.id) ? product.details : ["Sample photograph, not inventory", "No delivery is offered"],
        poster: product.poster,
        video: product.video,
        durationSec: product.durationSec,
        preview: true,
        purchasable: false,
        variants: [],
      };
    });
}
