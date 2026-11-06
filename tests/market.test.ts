import assert from "node:assert/strict";
import test from "node:test";
import { seedState } from "../lib/catalog.ts";
import { formatBdt } from "../lib/format.ts";
import {
  addToCart,
  assessVideoDuration,
  bagLines,
  CHECKOUT_FIELDS,
  commitListing,
  customerFeed,
  fallbackPoster,
  filterProducts,
  moderateProduct,
  moderateSeller,
  placeOrder,
  sanitizeState,
  setQty,
} from "../lib/market.ts";

const NOW = "2026-11-06T12:00:00.000Z";

test("formatBdt uses the taka sign and Latin digits", () => {
  assert.equal(formatBdt(890), "৳890");
  assert.match(formatBdt(1650), /^৳1,650$/);
});

test("customer stall hides pending, hidden, rejected, and rejected sellers", () => {
  const state = seedState();
  const ids = customerFeed(state).map((product) => product.id);
  assert.equal(ids.includes("nodi-hoops"), true);
  assert.equal(ids.includes("rong-soap"), true);
  assert.equal(ids.includes("rong-mist"), true);
  assert.equal(ids.includes("meghna-pin"), false);
  assert.equal(ids.includes("rong-balm"), false);
  assert.equal(ids.includes("mobile-stand"), false);
  assert.equal(ids.includes("quickplug-charger"), false);
});

test("approving a listing and its seller makes it visible, hide removes it", () => {
  let state = seedState();
  state = moderateSeller(state, "meghna", "approve").state;
  assert.equal(customerFeed(state).some((product) => product.id === "meghna-pin"), false);
  state = moderateProduct(state, "meghna-pin", "approve").state;
  assert.equal(customerFeed(state).some((product) => product.id === "meghna-pin"), true);
  state = moderateProduct(state, "nodi-scarf", "hide").state;
  assert.equal(customerFeed(state).some((product) => product.id === "nodi-scarf"), false);
  state = moderateProduct(state, "nodi-scarf", "restore").state;
  assert.equal(customerFeed(state).some((product) => product.id === "nodi-scarf"), true);
});

test("bag and checkout respect stock and never accept a card", () => {
  let state = seedState();
  assert.equal(addToCart(state, "rong-mist").ok, false);
  state = addToCart(state, "tarit-ring").state;
  state = addToCart(state, "tarit-ring").state;
  state = addToCart(state, "tarit-ring").state;
  assert.equal(addToCart(state, "tarit-ring").ok, false);
  assert.equal(state.cart[0]?.qty, 3);
  const blocked = placeOrder(state, { division: "Dhaka", method: "card", note: "" }, NOW);
  assert.equal(blocked.ok, false);
  const missing = placeOrder(state, { division: "", method: "cod-demo", note: "" }, NOW);
  assert.equal(missing.ok, false);
  const placed = placeOrder(state, { division: "Sylhet", method: "bkash-demo", note: "leave at the demo desk" }, NOW);
  assert.equal(placed.ok, true);
  if (!placed.ok) return;
  assert.equal(placed.orderId, "OM-1010");
  assert.equal(placed.state.cart.length, 0);
  assert.equal(placed.state.products.find((product) => product.id === "tarit-ring")?.stock, 0);
  assert.equal(placed.state.orders.at(-1)?.method, "bkash-demo");
  assert.equal(JSON.stringify(placed.state.orders.at(-1)).includes("card"), false);
  assert.deepEqual([...CHECKOUT_FIELDS], ["division", "method", "note"]);
});

test("quantity edits and unavailable lines stay in the bag", () => {
  let state = addToCart(seedState(), "basha-jars").state;
  state = setQty(state, "basha-jars", 4).state;
  assert.equal(setQty(state, "basha-jars", 5).ok, false);
  state = moderateProduct(state, "basha-jars", "hide").state;
  const line = bagLines(state)[0];
  assert.equal(line?.available, false);
  const order = placeOrder(state, { division: "Dhaka", method: "cod-demo", note: "" }, NOW);
  assert.equal(order.ok, false);
});

test("video duration rules are 15 recommended and 30 maximum", () => {
  assert.equal(assessVideoDuration(15).tone, "good");
  assert.equal(assessVideoDuration(15.1).tone, "long");
  assert.equal(assessVideoDuration(15.1).ok, true);
  assert.equal(assessVideoDuration(30).ok, true);
  assert.equal(assessVideoDuration(30.1).ok, false);
  assert.equal(assessVideoDuration(Number.NaN).ok, false);
  assert.equal(assessVideoDuration(0).ok, false);
});

test("seller listing lands in review and can be approved onto the stall", () => {
  const state = seedState();
  const saved = commitListing(state, {
    sellerId: "nodi",
    productId: null,
    newId: "local-pin",
    poster: null,
    input: {
      title: "Demo clay pin",
      category: "fashion",
      priceRaw: "450",
      stockRaw: "2",
      claim: "Illustrated pin added in the browser demo.",
      description: "Not a real pin.",
      hasNewVideo: true,
      durationSec: 18,
    },
  });
  assert.equal(saved.ok, true);
  if (!saved.ok) return;
  const created = saved.state.products.find((product) => product.id === "local-pin");
  assert.equal(created?.status, "pending");
  assert.equal(created?.durationSec, 18);
  assert.equal(customerFeed(saved.state).some((product) => product.id === "local-pin"), false);
  const live = moderateProduct(saved.state, "local-pin", "approve").state;
  assert.equal(customerFeed(live)[0]?.id, "local-pin");
  assert.match(fallbackPoster("fashion", "A & B"), /^data:image\/svg\+xml/);
  const rejected = commitListing(state, {
    sellerId: "nodi",
    productId: null,
    newId: "local-long",
    poster: null,
    input: {
      title: "Too long",
      category: "phone",
      priceRaw: "100",
      stockRaw: "1",
      claim: "Illustrated clip that is too long for the demo.",
      description: "",
      hasNewVideo: true,
      durationSec: 31,
    },
  });
  assert.equal(rejected.ok, false);
});

test("search finds a scarf and can sort by price", () => {
  const state = seedState();
  const visible = customerFeed(state);
  const found = filterProducts(visible, state.sellers, {
    text: "scarf",
    category: "all",
    sellerId: "all",
    inStock: false,
    sort: "featured",
  });
  assert.deepEqual(found.map((product) => product.id), ["nodi-scarf"]);
  const prices = filterProducts(visible, state.sellers, {
    text: "",
    category: "beauty",
    sellerId: "all",
    inStock: true,
    sort: "price-asc",
  }).map((product) => product.priceBdt);
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
  assert.equal(prices.includes(350), false);
});

test("bad saved demo data is ignored", () => {
  assert.equal(sanitizeState(null), null);
  assert.equal(sanitizeState({ version: 2 }), null);
  const saved = sanitizeState(JSON.parse(JSON.stringify(seedState())));
  assert.equal(saved?.orders.length, 2);
  assert.equal(saved?.role, "customer");
});
