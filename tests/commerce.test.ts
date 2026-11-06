import assert from "node:assert/strict";
import test from "node:test";
import { readCommerceConfig } from "../lib/commerce/config.ts";
import { offersFromSeed } from "../lib/commerce/preview-map.ts";
import { seedState } from "../lib/catalog.ts";
import {
  applyPaymentEvent,
  canAccessAdmin,
  canAccessSellerDesk,
  canManageListing,
  checkoutBlockers,
  linesForSeller,
  prepareOrder,
  signupRole,
  validateApplication,
  validateListing,
  verifyWebhookSignature,
} from "../lib/commerce/policy.ts";
import { createHmac } from "node:crypto";

const closed = readCommerceConfig({});
const openCod = {
  databaseConfigured: true,
  checkoutEnabled: true,
  codEnabled: true,
  prepaidEnabled: false,
  webhookSecretConfigured: false,
};
const openPrepaid = {
  databaseConfigured: true,
  checkoutEnabled: true,
  codEnabled: false,
  prepaidEnabled: true,
  webhookSecretConfigured: true,
};

test("default configuration keeps checkout closed", () => {
  assert.equal(closed.databaseConfigured, false);
  assert.equal(closed.checkoutEnabled, false);
  assert.equal(closed.codEnabled, false);
  assert.equal(closed.prepaidEnabled, false);
  assert.ok(checkoutBlockers(closed).length > 0);
});

test("signup cannot become admin and seller desk requires approval", () => {
  assert.equal(signupRole(), "customer");
  assert.equal(canAccessAdmin("customer"), false);
  assert.equal(canAccessAdmin("admin"), true);
  assert.equal(canAccessSellerDesk("pending"), false);
  assert.equal(canAccessSellerDesk("none"), false);
  assert.equal(canAccessSellerDesk("active"), true);
  assert.equal(canManageListing({ userId: "a", role: "customer", sellerId: "s1" }, "s2"), false);
  assert.equal(canManageListing({ userId: "a", role: "customer", sellerId: "s1" }, "s1"), true);
  assert.equal(canManageListing({ userId: "a", role: "admin", sellerId: null }, "s2"), true);
});

test("preview listings are not purchasable", () => {
  const offers = offersFromSeed(seedState());
  assert.ok(offers.length >= 5);
  assert.equal(offers.every((offer) => offer.preview && offer.purchasable === false && offer.stock === null), true);
  const order = prepareOrder({
    gates: openCod,
    method: "cod",
    division: "Dhaka",
    lines: [{ offerId: offers[0]!.id, variantId: null, qty: 1, clientPriceBdt: 1 }],
    offers,
  });
  assert.equal(order.ok, false);
});

test("orders use catalog price and refuse closed methods", () => {
  const offers = offersFromSeed(seedState()).map((offer) => ({ ...offer, preview: false, purchasable: true, stock: 2 }));
  const refused = prepareOrder({
    gates: closed,
    method: "cod",
    division: "Dhaka",
    lines: [{ offerId: offers[0]!.id, variantId: null, qty: 1 }],
    offers,
  });
  assert.equal(refused.ok, false);
  const priced = prepareOrder({
    gates: openCod,
    method: "cod",
    division: "Dhaka",
    lines: [{ offerId: offers[0]!.id, variantId: null, qty: 2, clientPriceBdt: 1 }],
    offers,
  });
  assert.equal(priced.ok, true);
  if (!priced.ok) return;
  assert.equal(priced.value.lines[0]?.priceBdt, offers[0]!.priceBdt);
  assert.equal(priced.value.totalBdt, offers[0]!.priceBdt * 2);
  assert.equal(priced.value.status, "accepted_cod");
  assert.match(priced.value.customerMessage, /No payment was collected/);
  const stock = prepareOrder({
    gates: openCod,
    method: "cod",
    division: "Dhaka",
    lines: [{ offerId: offers[0]!.id, variantId: null, qty: 3 }],
    offers,
  });
  assert.equal(stock.ok, false);
  const prepaid = prepareOrder({
    gates: openPrepaid,
    method: "prepaid",
    division: "Khulna",
    lines: [{ offerId: offers[1]!.id, variantId: null, qty: 1 }],
    offers,
  });
  assert.equal(prepaid.ok, true);
  if (prepaid.ok) assert.equal(prepaid.value.status, "pending_payment");
});

test("seller isolation keeps another seller's lines out", () => {
  const lines = [
    { sellerId: "a", title: "One" },
    { sellerId: "b", title: "Two" },
  ];
  assert.deepEqual(linesForSeller(lines, "a").map((line) => line.title), ["One"]);
});

test("applications and clips are validated", () => {
  const bad = validateApplication({ businessName: "A", area: "Dhaka", categories: ["fashion"], summary: "short", existingPending: false });
  assert.equal(bad.ok, false);
  const pending = validateApplication({
    businessName: "Nodi Atelier",
    area: "Mohammadpur, Dhaka",
    categories: ["fashion"],
    summary: "Hand finished accessories from a small Dhaka studio.",
    existingPending: true,
  });
  assert.equal(pending.ok, false);
  const clip = validateListing({
    title: "Clay pin",
    category: "fashion",
    priceRaw: "450",
    stockRaw: "2",
    description: "A small illustrated pin for the fashion stall.",
    hasVideo: true,
    durationSec: 31,
  });
  assert.equal(clip.ok, false);
});

test("webhook signature and idempotency", () => {
  const secret = "test-secret";
  const payload = JSON.stringify({ orderId: "o1", amountBdt: 890 });
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  assert.equal(verifyWebhookSignature(payload, signature, secret), true);
  assert.equal(verifyWebhookSignature(payload, signature, null), false);
  assert.equal(verifyWebhookSignature(payload, "nope", secret), false);
  const orders = [{ id: "o1", status: "pending_payment" as const, totalBdt: 890 }];
  const first = applyPaymentEvent(orders, [], { provider: "gateway", eventId: "evt-1", orderId: "o1", amountBdt: 890, kind: "paid" });
  assert.equal(first.ok, true);
  if (!first.ok) return;
  assert.equal(first.value.orders[0]?.status, "paid");
  const again = applyPaymentEvent(first.value.orders, ["gateway:evt-1"], {
    provider: "gateway",
    eventId: "evt-1",
    orderId: "o1",
    amountBdt: 890,
    kind: "paid",
  });
  assert.equal(again.ok, true);
  if (again.ok) assert.equal(again.value.duplicate, true);
  const mismatch = applyPaymentEvent(orders, [], { provider: "gateway", eventId: "evt-2", orderId: "o1", amountBdt: 1, kind: "paid" });
  assert.equal(mismatch.ok, false);
});
