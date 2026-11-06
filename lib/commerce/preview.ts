import { seedState } from "@/lib/catalog";
import { offersFromSeed } from "@/lib/commerce/preview-map";
import type { StoreOffer } from "@/lib/commerce/types";

export function previewOffers(): StoreOffer[] {
  return offersFromSeed(seedState());
}

export function findOffer(offers: StoreOffer[], id: string): StoreOffer | null {
  return offers.find((offer) => offer.id === id) ?? null;
}
