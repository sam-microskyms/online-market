import { createHmac, timingSafeEqual } from "node:crypto";
import type { ShopGates } from "./config";
import type { AccountRole, OrderStatus, PaymentMethod, RequestedLine, SellerAccess, StoreOffer } from "./types";

const DIVISIONS = ["Barishal", "Chattogram", "Dhaka", "Khulna", "Mymensingh", "Rajshahi", "Rangpur", "Sylhet"] as const;

export interface PreparedLine {
  offerId: string;
  variantId: string | null;
  sellerId: string;
  title: string;
  qty: number;
  priceBdt: number;
}

export interface PreparedOrder {
  status: OrderStatus;
  method: PaymentMethod;
  division: string;
  lines: PreparedLine[];
  totalBdt: number;
  customerMessage: string;
}

export type PolicyResult<T> = { ok: true; value: T } | { ok: false; code: string; message: string };

const DIVISIONS_SET = new Set<string>(DIVISIONS);

export function signupRole(): AccountRole {
  return "customer";
}

export function canAccessAdmin(role: AccountRole | null): boolean {
  return role === "admin";
}

export function canAccessSellerDesk(status: SellerAccess): boolean {
  return status === "active";
}

export function canManageListing(actor: { userId: string; role: AccountRole | null; sellerId: string | null }, listingSellerId: string): boolean {
  if (actor.role === "admin") return true;
  return actor.sellerId != null && actor.sellerId === listingSellerId;
}

export function checkoutBlockers(gates: ShopGates): string[] {
  const reasons: string[] = [];
  if (!gates.databaseConfigured) reasons.push("The shop database is not configured.");
  if (!gates.checkoutEnabled) reasons.push("Checkout is turned off.");
  if (!gates.codEnabled && !gates.prepaidEnabled) reasons.push("No payment method is enabled.");
  if (gates.prepaidEnabled && !gates.webhookSecretConfigured) {
    reasons.push("Prepaid checkout is marked on, but webhook verification is not configured.");
  }
  return reasons;
}

export function methodAvailable(gates: ShopGates, method: PaymentMethod): boolean {
  if (checkoutBlockers(gates).length > 0) return false;
  if (method === "cod") return gates.codEnabled;
  return gates.prepaidEnabled && gates.webhookSecretConfigured;
}

export function validateApplication(input: {
  businessName: string;
  area: string;
  categories: string[];
  summary: string;
  existingPending: boolean;
}): PolicyResult<{ businessName: string; area: string; categories: string[]; summary: string }> {
  if (input.existingPending) {
    return { ok: false, code: "already_pending", message: "This account already has an application waiting for review." };
  }
  const businessName = input.businessName.trim();
  const area = input.area.trim();
  const summary = input.summary.trim();
  if (businessName.length < 2 || businessName.length > 80) {
    return { ok: false, code: "invalid_name", message: "Enter the business name you want buyers to see." };
  }
  if (area.length < 2 || area.length > 80) {
    return { ok: false, code: "invalid_area", message: "Enter the area in Bangladesh where you operate." };
  }
  if (input.categories.length < 1) {
    return { ok: false, code: "invalid_category", message: "Choose at least one category." };
  }
  if (summary.length < 20 || summary.length > 600) {
    return { ok: false, code: "invalid_summary", message: "Describe the shop in 20 to 600 characters." };
  }
  return { ok: true, value: { businessName, area, categories: input.categories, summary } };
}

export function validateListing(input: {
  title: string;
  category: string;
  priceRaw: string;
  stockRaw: string;
  description: string;
  hasVideo: boolean;
  durationSec: number | null;
}): PolicyResult<{ title: string; priceBdt: number; stock: number; description: string; durationSec: number | null }> {
  const title = input.title.trim();
  if (title.length < 3 || title.length > 80) {
    return { ok: false, code: "invalid_title", message: "Use a title between 3 and 80 characters." };
  }
  if (!/^\d+$/.test(input.priceRaw.trim())) {
    return { ok: false, code: "invalid_price", message: "Enter a whole taka price." };
  }
  const priceBdt = Number(input.priceRaw.trim());
  if (priceBdt < 1 || priceBdt > 5_000_000) {
    return { ok: false, code: "invalid_price", message: "Enter a whole taka price from 1 to 5000000." };
  }
  if (!/^\d+$/.test(input.stockRaw.trim())) {
    return { ok: false, code: "invalid_stock", message: "Enter stock as a whole number." };
  }
  const stock = Number(input.stockRaw.trim());
  if (stock < 0 || stock > 9999) {
    return { ok: false, code: "invalid_stock", message: "Enter stock from 0 to 9999." };
  }
  const description = input.description.trim();
  if (description.length < 10 || description.length > 800) {
    return { ok: false, code: "invalid_description", message: "Describe the listing in 10 to 800 characters." };
  }
  if (input.hasVideo) {
    if (input.durationSec == null || !Number.isFinite(input.durationSec) || input.durationSec <= 0) {
      return { ok: false, code: "invalid_video", message: "The clip needs a readable duration of 30 seconds or less." };
    }
    if (input.durationSec > 30) {
      return { ok: false, code: "video_too_long", message: "Clips must be 30 seconds or shorter." };
    }
  }
  return {
    ok: true,
    value: { title, priceBdt, stock, description, durationSec: input.hasVideo ? Math.round((input.durationSec ?? 0) * 10) / 10 : null },
  };
}

export function prepareOrder(input: {
  gates: ShopGates;
  method: PaymentMethod;
  division: string;
  lines: RequestedLine[];
  offers: StoreOffer[];
}): PolicyResult<PreparedOrder> {
  const blockers = checkoutBlockers(input.gates);
  if (blockers.length > 0) {
    return { ok: false, code: "checkout_closed", message: blockers[0] ?? "Checkout is closed." };
  }
  if (!methodAvailable(input.gates, input.method)) {
    return { ok: false, code: "method_closed", message: "That payment method is not enabled." };
  }
  if (!DIVISIONS_SET.has(input.division)) {
    return { ok: false, code: "invalid_division", message: "Choose a delivery division. A street address is not collected here." };
  }
  if (input.lines.length === 0) {
    return { ok: false, code: "empty_order", message: "The bag is empty." };
  }
  const prepared: PreparedLine[] = [];
  for (const line of input.lines) {
    const offer = input.offers.find((item) => item.id === line.offerId);
    if (!offer || !offer.purchasable || offer.preview) {
      return { ok: false, code: "not_for_sale", message: "One of the items is not for sale." };
    }
    if (!Number.isInteger(line.qty) || line.qty < 1 || line.qty > 20) {
      return { ok: false, code: "invalid_qty", message: "Choose a quantity from 1 to 20." };
    }
    const variant = line.variantId ? offer.variants.find((item) => item.id === line.variantId) ?? null : null;
    if (line.variantId && !variant) {
      return { ok: false, code: "invalid_variant", message: "Choose an available option." };
    }
    const priceBdt = variant?.priceBdt ?? offer.priceBdt;
    const stock = variant?.stock ?? offer.stock;
    if (stock == null || stock < line.qty) {
      return { ok: false, code: "insufficient_stock", message: `${offer.title} does not have enough stock.` };
    }
    prepared.push({
      offerId: offer.id,
      variantId: variant?.id ?? null,
      sellerId: offer.sellerId,
      title: offer.title,
      qty: line.qty,
      priceBdt,
    });
  }
  const totalBdt = prepared.reduce((sum, line) => sum + line.priceBdt * line.qty, 0);
  const status: OrderStatus = input.method === "cod" ? "accepted_cod" : "pending_payment";
  const customerMessage =
    status === "accepted_cod"
      ? "Order recorded for cash on delivery. No payment was collected on this website, and nothing has shipped."
      : "Order reserved as pending payment. Nothing is paid until a verified gateway event arrives.";
  return { ok: true, value: { status, method: input.method, division: input.division, lines: prepared, totalBdt, customerMessage } };
}

export function verifyWebhookSignature(payload: string, signature: string | null, secret: string | null): boolean {
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const left = Buffer.from(expected);
  const right = Buffer.from(signature);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export interface PaymentEvent {
  provider: string;
  eventId: string;
  orderId: string;
  amountBdt: number;
  kind: "paid" | "failed";
}

export function applyPaymentEvent(
  orders: { id: string; status: OrderStatus; totalBdt: number }[],
  seenEventIds: string[],
  event: PaymentEvent,
): PolicyResult<{ orders: { id: string; status: OrderStatus; totalBdt: number }[]; duplicate: boolean }> {
  const key = `${event.provider}:${event.eventId}`;
  if (seenEventIds.includes(key)) {
    return { ok: true, value: { orders, duplicate: true } };
  }
  const order = orders.find((item) => item.id === event.orderId);
  if (!order) return { ok: false, code: "unknown_order", message: "No matching order." };
  if (event.amountBdt !== order.totalBdt) {
    return { ok: false, code: "amount_mismatch", message: "The payment amount does not match the order." };
  }
  if (event.kind === "failed") {
    return { ok: true, value: { orders, duplicate: false } };
  }
  if (order.status !== "pending_payment") {
    return { ok: false, code: "not_payable", message: "This order is not waiting for payment." };
  }
  return {
    ok: true,
    value: {
      duplicate: false,
      orders: orders.map((item) => (item.id === order.id ? { ...item, status: "paid" } : item)),
    },
  };
}

export function linesForSeller<T extends { sellerId: string }>(lines: T[], sellerId: string): T[] {
  return lines.filter((line) => line.sellerId === sellerId);
}
