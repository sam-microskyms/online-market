import type { StoreOffer } from "./types";
import type { CategoryId, Product, Seller } from "../types";

const sampleTitles: Record<string, string> = {
  "nodi-hoops": "Gold hoop earring",
  "nodi-scarf": "Printed silk scarf",
  "nodi-cuff": "Shell bangle",
  "basha-bottle": "Copper water bottle",
  "basha-cushion": "Embroidered cushion cover",
  "basha-jars": "Clay spice pots",
  "rong-soap": "Olive soap bars",
  "rong-oil": "Herb oil bottle",
  "rong-mist": "Oil bottle, alternate crop",
  "mobile-sling": "Braided cable, detail",
  "mobile-glass": "Phone screen",
  "mobile-cable": "Braided charging cables",
  "tarit-speaker": "Portable speaker",
  "tarit-lamp": "Desk lamp",
  "tarit-ring": "Ring light",
};

const sampleNote = "Sample photograph. Not merchandise held for sale. The price is a sample figure in BDT.";

export function offersFromSeed(seed: { sellers: Seller[]; products: Product[] }): StoreOffer[] {
  const activeSellers = new Set(seed.sellers.filter((seller) => seller.status === "active").map((seller) => seller.id));
  return seed.products
    .filter((product) => product.status === "live" && activeSellers.has(product.sellerId))
    .map((product) => {
      const seller = seed.sellers.find((item) => item.id === product.sellerId);
      return {
        id: product.id,
        title: sampleTitles[product.id] ?? product.title,
        category: product.category as CategoryId,
        priceBdt: product.priceBdt,
        stock: null,
        sellerId: product.sellerId,
        sellerName: seller?.name ?? "Unknown seller",
        sellerArea: seller?.area ?? "",
        description: sampleNote,
        details: ["Sample image, not inventory", "No delivery is offered"],
        poster: product.poster,
        video: product.video,
        durationSec: product.durationSec,
        preview: true,
        purchasable: false,
        variants: [],
      };
    });
}
