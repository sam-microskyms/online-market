import type { CategoryId } from "@/lib/types";

export type AccountRole = "customer" | "admin";

export type SellerAccess = "none" | "pending" | "active" | "suspended";

export type OrderStatus = "pending_payment" | "accepted_cod" | "paid" | "cancelled";

export type PaymentMethod = "cod" | "prepaid";

export interface OfferVariant {
  id: string;
  label: string;
  priceBdt: number;
  stock: number | null;
}

export interface StoreOffer {
  id: string;
  title: string;
  category: CategoryId;
  priceBdt: number;
  stock: number | null;
  sellerId: string;
  sellerName: string;
  sellerArea: string;
  description: string;
  details: string[];
  poster: string;
  video: string | null;
  durationSec: number | null;
  preview: boolean;
  purchasable: boolean;
  variants: OfferVariant[];
}

export interface Viewer {
  signedIn: boolean;
  userId: string | null;
  email: string | null;
  displayName: string | null;
  role: AccountRole | null;
  sellerId: string | null;
  sellerStatus: SellerAccess;
}

export interface ActionResult {
  ok: boolean;
  code: string;
  message: string;
  orderId?: string;
  status?: OrderStatus;
}

export interface RequestedLine {
  offerId: string;
  variantId: string | null;
  qty: number;
  clientPriceBdt?: number;
}
