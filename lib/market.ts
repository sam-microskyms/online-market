import type {
  CategoryId,
  DemoOrder,
  DemoState,
  PayMethod,
  Product,
  ProductStatus,
  Role,
  Seller,
  SellerStatus,
} from "./types";

export const CATEGORIES: { id: CategoryId; label: string; short: string; swatch: string }[] = [
  { id: "fashion", label: "Fashion accessories", short: "Fashion", swatch: "#9C3F1E" },
  { id: "home", label: "Home and kitchen", short: "Home", swatch: "#8A4B2F" },
  { id: "beauty", label: "Beauty and personal care", short: "Beauty", swatch: "#8D3B4E" },
  { id: "phone", label: "Phone accessories", short: "Phone", swatch: "#0F4F4C" },
  { id: "electronics", label: "Electronics", short: "Electronics", swatch: "#243E73" },
];

export const DIVISIONS = [
  "Barishal",
  "Chattogram",
  "Dhaka",
  "Khulna",
  "Mymensingh",
  "Rajshahi",
  "Rangpur",
  "Sylhet",
] as const;

export const PAY_METHODS: { id: PayMethod; label: string; detail: string }[] = [
  {
    id: "cod-demo",
    label: "Cash on delivery",
    detail: "Simulated. No courier is booked and no cash is collected.",
  },
  {
    id: "bkash-demo",
    label: "bKash",
    detail: "Simulated layout. No wallet number is asked and nothing is charged.",
  },
];

export const CHECKOUT_FIELDS = ["division", "method", "note"] as const;

export const REJECT_REASONS = [
  "Demo reason: illustration was unclear",
  "Demo reason: the demo label was easy to miss",
  "Demo reason: duplicate of another sample listing",
] as const;

export const STORAGE_KEY = "online-market-demo-v1";

export interface ListingInput {
  title: string;
  category: string;
  priceRaw: string;
  stockRaw: string;
  claim: string;
  description: string;
  hasNewVideo: boolean;
  durationSec: number | null;
}

export interface BagLine {
  productId: string;
  qty: number;
  product: Product | null;
  sellerName: string;
  available: boolean;
  reason: string;
  lineTotal: number;
}

export type CartStep = { ok: boolean; state: DemoState; message: string };

export type OrderResult =
  | { ok: true; state: DemoState; orderId: string; message: string }
  | { ok: false; state: DemoState; message: string };

export type ListingCommit =
  | { ok: true; state: DemoState; productId: string; message: string }
  | { ok: false; errors: Record<string, string> };

export type DurationAssessment = {
  ok: boolean;
  tone: "good" | "long" | "block";
  message: string;
};

const ROLES: Role[] = ["customer", "seller", "admin"];
const PRODUCT_STATUSES: ProductStatus[] = ["live", "pending", "rejected", "hidden"];
const SELLER_STATUSES: SellerStatus[] = ["active", "pending", "rejected"];

export function categoryById(id: string) {
  return CATEGORIES.find((category) => category.id === id) ?? null;
}

export function sellerById(sellers: Seller[], id: string): Seller | null {
  return sellers.find((seller) => seller.id === id) ?? null;
}

export function isCustomerVisible(product: Product, sellers: Seller[]): boolean {
  const seller = sellerById(sellers, product.sellerId);
  return product.status === "live" && seller?.status === "active";
}

export function customerFeed(state: DemoState): Product[] {
  return state.products.filter((product) => isCustomerVisible(product, state.sellers));
}

export function visibilityNote(product: Product, sellers: Seller[]): string | null {
  if (isCustomerVisible(product, sellers)) return null;
  const seller = sellerById(sellers, product.sellerId);
  if (seller && seller.status !== "active") {
    return `Buyers cannot see this. The seller is marked ${seller.status} in the demo.`;
  }
  return `Buyers cannot see this. The listing is marked ${product.status} in the demo.`;
}

export function assessVideoDuration(seconds: number): DurationAssessment {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return {
      ok: false,
      tone: "block",
      message: "This file has no usable duration. Choose a clip of 30 seconds or less.",
    };
  }
  if (seconds > 30) {
    return {
      ok: false,
      tone: "block",
      message: `Clips must be 30 seconds or shorter. This one is ${seconds.toFixed(1)}s.`,
    };
  }
  if (seconds > 15) {
    return {
      ok: true,
      tone: "long",
      message: `Over the 15 second recommendation (${seconds.toFixed(1)}s). You can still save this demo listing.`,
    };
  }
  return {
    ok: true,
    tone: "good",
    message: `Within the 15 second recommendation (${seconds.toFixed(1)}s).`,
  };
}

export function parseWholeNumber(raw: string, min: number, max: number): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  if (!Number.isInteger(value) || value < min || value > max) return null;
  return value;
}

export function filterProducts(
  products: Product[],
  sellers: Seller[],
  query: { text: string; category: string; sellerId: string; inStock: boolean; sort: string },
): Product[] {
  const needle = query.text.trim().toLowerCase();
  let list = products.filter((product) => {
    if (query.category !== "all" && product.category !== query.category) return false;
    if (query.sellerId !== "all" && product.sellerId !== query.sellerId) return false;
    if (query.inStock && product.stock < 1) return false;
    if (!needle) return true;
    const seller = sellerById(sellers, product.sellerId);
    const category = categoryById(product.category);
    const haystack = [product.title, product.claim, product.description, seller?.name ?? "", category?.label ?? ""]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
  if (query.sort === "price-asc") {
    list = [...list].sort((a, b) => a.priceBdt - b.priceBdt || a.title.localeCompare(b.title));
  } else if (query.sort === "price-desc") {
    list = [...list].sort((a, b) => b.priceBdt - a.priceBdt || a.title.localeCompare(b.title));
  }
  return list;
}

export function bagLines(state: DemoState): BagLine[] {
  return state.cart.map((line) => {
    const product = state.products.find((item) => item.id === line.productId) ?? null;
    const seller = product ? sellerById(state.sellers, product.sellerId) : null;
    const base = {
      productId: line.productId,
      qty: line.qty,
      product,
      sellerName: seller?.name ?? "Unknown seller",
    };
    if (!product || !seller) {
      return { ...base, available: false, reason: "Listing is no longer in the demo.", lineTotal: 0 };
    }
    if (!isCustomerVisible(product, state.sellers)) {
      return { ...base, available: false, reason: "Listing is not on the customer stall.", lineTotal: 0 };
    }
    if (product.stock < 1) {
      return { ...base, available: false, reason: "Demo stock is gone.", lineTotal: 0 };
    }
    if (line.qty > product.stock) {
      return {
        ...base,
        available: false,
        reason: `Demo stock is ${product.stock}. Lower the quantity.`,
        lineTotal: 0,
      };
    }
    return { ...base, available: true, reason: "", lineTotal: product.priceBdt * line.qty };
  });
}

export function bagSubtotal(lines: BagLine[]): number {
  return lines.reduce((sum, line) => sum + (line.available ? line.lineTotal : 0), 0);
}

export function cartCount(state: DemoState): number {
  return state.cart.reduce((sum, line) => sum + line.qty, 0);
}

export function addToCart(state: DemoState, productId: string): CartStep {
  const product = state.products.find((item) => item.id === productId);
  if (!product || !isCustomerVisible(product, state.sellers)) {
    return { ok: false, state, message: "That listing is not on the demo stall." };
  }
  if (product.stock < 1) {
    return { ok: false, state, message: "Demo stock is gone for this listing." };
  }
  const existing = state.cart.find((line) => line.productId === productId);
  const qty = existing ? existing.qty + 1 : 1;
  if (qty > product.stock) {
    return { ok: false, state, message: `Demo stock is only ${product.stock}.` };
  }
  const cart = existing
    ? state.cart.map((line) => (line.productId === productId ? { ...line, qty } : line))
    : [...state.cart, { productId, qty: 1 }];
  return { ok: true, state: { ...state, cart }, message: `${product.title} added to the demo bag.` };
}

export function setQty(state: DemoState, productId: string, qty: number): CartStep {
  if (!state.cart.some((line) => line.productId === productId)) {
    return { ok: false, state, message: "That listing is not in the bag." };
  }
  if (qty <= 0) return removeFromCart(state, productId);
  const product = state.products.find((item) => item.id === productId);
  if (product && qty > product.stock) {
    return { ok: false, state, message: `Demo stock is only ${product.stock}.` };
  }
  return {
    ok: true,
    state: {
      ...state,
      cart: state.cart.map((line) => (line.productId === productId ? { ...line, qty } : line)),
    },
    message: "Quantity updated in this demo.",
  };
}

export function removeFromCart(state: DemoState, productId: string): CartStep {
  return {
    ok: true,
    state: { ...state, cart: state.cart.filter((line) => line.productId !== productId) },
    message: "Removed from the demo bag.",
  };
}

export function placeOrder(
  state: DemoState,
  input: { division: string; method: string; note: string },
  nowIso: string,
): OrderResult {
  if (state.cart.length === 0) {
    return { ok: false, state, message: "The demo bag is empty." };
  }
  const lines = bagLines(state);
  const blocked = lines.find((line) => !line.available);
  if (blocked) {
    return { ok: false, state, message: blocked.reason || "A bag item cannot be ordered in this demo." };
  }
  if (!DIVISIONS.includes(input.division as (typeof DIVISIONS)[number])) {
    return { ok: false, state, message: "Choose a demo division. A street address is not collected." };
  }
  const method = PAY_METHODS.find((item) => item.id === input.method);
  if (!method) {
    return { ok: false, state, message: "That payment method is not part of the demo." };
  }
  const orderLines = lines.map((line) => ({
    productId: line.productId,
    sellerId: line.product!.sellerId,
    title: line.product!.title,
    qty: line.qty,
    priceBdt: line.product!.priceBdt,
  }));
  const order: DemoOrder = {
    id: nextOrderId(state.orders),
    createdAt: nowIso,
    division: input.division,
    method: method.id,
    note: input.note.trim().slice(0, 140),
    lines: orderLines,
    totalBdt: bagSubtotal(lines),
    historical: false,
  };
  const products = state.products.map((product) => {
    const line = orderLines.find((item) => item.productId === product.id);
    return line ? { ...product, stock: product.stock - line.qty } : product;
  });
  return {
    ok: true,
    orderId: order.id,
    message: `Simulated order ${order.id} saved in this browser.`,
    state: { ...state, products, cart: [], orders: [...state.orders, order] },
  };
}

export function moderateProduct(
  state: DemoState,
  id: string,
  action: "approve" | "reject" | "hide" | "restore",
  note = "",
): { state: DemoState; message: string } {
  const product = state.products.find((item) => item.id === id);
  if (!product) return { state, message: "Listing was not found." };
  const status: ProductStatus =
    action === "reject" ? "rejected" : action === "hide" ? "hidden" : "live";
  const reviewNote = note.trim().slice(0, 180) || defaultProductNote(action);
  return {
    state: {
      ...state,
      products: state.products.map((item) => (item.id === id ? { ...item, status, reviewNote } : item)),
    },
    message: `${product.title} is now ${status} in this demo.`,
  };
}

export function moderateSeller(
  state: DemoState,
  id: string,
  action: "approve" | "reject",
  note = "",
): { state: DemoState; message: string } {
  const seller = sellerById(state.sellers, id);
  if (!seller) return { state, message: "Seller was not found." };
  const status: SellerStatus = action === "approve" ? "active" : "rejected";
  const reviewNote = note.trim().slice(0, 180) || (action === "approve" ? "Approved in the demo queue." : "Rejected in the demo queue.");
  return {
    state: {
      ...state,
      sellers: state.sellers.map((item) => (item.id === id ? { ...item, status, reviewNote } : item)),
    },
    message: `${seller.name} is now ${status} in this demo.`,
  };
}

export function commitListing(
  state: DemoState,
  args: {
    sellerId: string;
    productId: string | null;
    newId: string;
    input: ListingInput;
    poster: string | null;
  },
): ListingCommit {
  const seller = sellerById(state.sellers, args.sellerId);
  if (!seller) return { ok: false, errors: { form: "Choose a demo seller first." } };
  if (!args.productId && seller.status === "rejected") {
    return {
      ok: false,
      errors: { form: "This demo seller is rejected. Approve the seller before adding listings." },
    };
  }
  const existing = args.productId ? state.products.find((item) => item.id === args.productId) ?? null : null;
  if (args.productId && (!existing || existing.sellerId !== args.sellerId)) {
    return { ok: false, errors: { form: "You can only edit listings for the seller you are acting as." } };
  }
  const errors: Record<string, string> = {};
  const title = args.input.title.trim();
  if (title.length < 3 || title.length > 80) errors.title = "Use a title between 3 and 80 characters.";
  const category = categoryById(args.input.category);
  if (!category) errors.category = "Choose one of the five demo categories.";
  const price = parseWholeNumber(args.input.priceRaw, 1, 5_000_000);
  if (price == null) errors.price = "Enter a whole taka amount from 1 to 5000000.";
  const stock = parseWholeNumber(args.input.stockRaw, 0, 9999);
  if (stock == null) errors.stock = "Enter demo stock as a whole number from 0 to 9999.";
  const claim = args.input.claim.trim();
  if (claim.length < 12 || claim.length > 180) {
    errors.claim = "Add an illustrative claim between 12 and 180 characters.";
  }
  const description = args.input.description.trim();
  if (description.length > 500) errors.description = "Keep the description within 500 characters.";
  if (args.input.hasNewVideo) {
    const duration = assessVideoDuration(args.input.durationSec ?? Number.NaN);
    if (!duration.ok) errors.video = duration.message;
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  const durationSec = args.input.hasNewVideo
    ? Math.round((args.input.durationSec ?? 0) * 10) / 10
    : existing?.durationSec ?? null;
  const poster =
    args.poster ||
    existing?.poster ||
    fallbackPoster(category!.id, title);
  if (!existing) {
    const product: Product = {
      id: args.newId,
      sellerId: args.sellerId,
      title,
      category: category!.id,
      priceBdt: price!,
      stock: stock!,
      status: "pending",
      claim,
      description: description || "Demo listing created in this browser.",
      details: ["Created in the browser demo.", "Not a warehouse item."],
      durationSec,
      poster,
      video: null,
      reviewNote: "Waiting in the demo review queue.",
    };
    return {
      ok: true,
      productId: product.id,
      message: `${title} is waiting in the demo review queue.`,
      state: { ...state, products: [product, ...state.products] },
    };
  }
  const updated: Product = {
    ...existing,
    title,
    category: category!.id,
    priceBdt: price!,
    stock: stock!,
    claim,
    description: description || existing.description,
    durationSec,
    poster,
  };
  return {
    ok: true,
    productId: updated.id,
    message: `${title} updated in this browser.`,
    state: { ...state, products: state.products.map((item) => (item.id === updated.id ? updated : item)) },
  };
}

export function fallbackPoster(category: CategoryId, title: string): string {
  const swatch = categoryById(category)?.swatch ?? "#9C3F1E";
  const safeTitle = xmlEscape(title).slice(0, 80);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280" viewBox="0 0 720 1280">
    <rect width="720" height="1280" fill="#F6E7D4"/>
    <circle cx="360" cy="520" r="180" fill="${swatch}"/>
    <text x="360" y="500" text-anchor="middle" fill="#FFF8F1" font-size="42" font-family="Georgia, serif">DEMO</text>
    <text x="360" y="900" text-anchor="middle" fill="#1C1612" font-size="36" font-family="Georgia, serif">${safeTitle}</text>
    <text x="360" y="980" text-anchor="middle" fill="#5C5148" font-size="24" font-family="Georgia, serif">Illustrated placeholder, not a photograph</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function ordersForSeller(state: DemoState, sellerId: string): DemoOrder[] {
  return state.orders.filter((order) => order.lines.some((line) => line.sellerId === sellerId));
}

export function sellerTakas(state: DemoState, sellerId: string): number {
  return ordersForSeller(state, sellerId).reduce(
    (sum, order) => sum + order.lines.filter((line) => line.sellerId === sellerId).reduce((inner, line) => inner + line.priceBdt * line.qty, 0),
    0,
  );
}

export function sanitizeState(raw: unknown): DemoState | null {
  if (!isRecord(raw) || raw.version !== 1) return null;
  const sellers = Array.isArray(raw.sellers) ? raw.sellers.map(readSeller).filter((seller): seller is Seller => seller != null) : [];
  if (sellers.length === 0) return null;
  const sellerIds = new Set(sellers.map((seller) => seller.id));
  const products = Array.isArray(raw.products)
    ? raw.products
        .map((item) => readProduct(item))
        .filter((product): product is Product => product != null && sellerIds.has(product.sellerId))
        .slice(0, 80)
    : [];
  if (products.length === 0) return null;
  const productIds = new Set(products.map((product) => product.id));
  const cart = Array.isArray(raw.cart)
    ? raw.cart
        .map((item) => {
          if (!isRecord(item) || typeof item.productId !== "string" || !productIds.has(item.productId)) return null;
          const qty = typeof item.qty === "number" && Number.isInteger(item.qty) ? Math.min(99, Math.max(1, item.qty)) : null;
          return qty == null ? null : { productId: item.productId, qty };
        })
        .filter((item): item is { productId: string; qty: number } => item != null)
        .slice(0, 40)
    : [];
  const orders = Array.isArray(raw.orders) ? raw.orders.map(readOrder).filter((order): order is DemoOrder => order != null).slice(0, 40) : [];
  const role = ROLES.includes(raw.role as Role) ? (raw.role as Role) : "customer";
  const actingSellerId = typeof raw.actingSellerId === "string" && sellerIds.has(raw.actingSellerId) ? raw.actingSellerId : sellers[0].id;
  const pinnedProductId =
    typeof raw.pinnedProductId === "string" && productIds.has(raw.pinnedProductId) ? raw.pinnedProductId : products[0].id;
  return { version: 1, role, actingSellerId, sellers, products, cart, orders, pinnedProductId };
}

function nextOrderId(orders: DemoOrder[]): string {
  let max = 1000;
  for (const order of orders) {
    const value = Number(order.id.replace(/[^\d]/g, ""));
    if (Number.isFinite(value) && value > max) max = value;
  }
  return `OM-${max + 1}`;
}

function defaultProductNote(action: "approve" | "reject" | "hide" | "restore"): string {
  if (action === "hide") return "Hidden from the customer stall in this demo.";
  if (action === "reject") return "Rejected in the demo queue.";
  if (action === "restore") return "Restored to the customer stall in this demo.";
  return "Approved in the demo queue.";
}

function xmlEscape(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    if (char === "&") return "&amp;";
    if (char === "<") return "&lt;";
    if (char === ">") return "&gt;";
    if (char === '"') return "&quot;";
    return "&apos;";
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readSeller(value: unknown): Seller | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || typeof value.name !== "string" || typeof value.area !== "string") return null;
  if (!SELLER_STATUSES.includes(value.status as SellerStatus)) return null;
  return {
    id: value.id.slice(0, 40),
    name: value.name.slice(0, 80),
    area: value.area.slice(0, 80),
    blurb: typeof value.blurb === "string" ? value.blurb.slice(0, 240) : "",
    status: value.status as SellerStatus,
    reviewNote: typeof value.reviewNote === "string" ? value.reviewNote.slice(0, 180) : "",
  };
}

function readProduct(value: unknown): Product | null {
  if (!isRecord(value)) return null;
  const category = categoryById(typeof value.category === "string" ? value.category : "");
  if (!category) return null;
  if (typeof value.id !== "string" || typeof value.sellerId !== "string" || typeof value.title !== "string") return null;
  if (!PRODUCT_STATUSES.includes(value.status as ProductStatus)) return null;
  if (typeof value.priceBdt !== "number" || typeof value.stock !== "number") return null;
  const details = Array.isArray(value.details) ? value.details.filter((item) => typeof item === "string").slice(0, 8).map((item) => item.slice(0, 160)) : [];
  return {
    id: value.id.slice(0, 40),
    sellerId: value.sellerId.slice(0, 40),
    title: value.title.slice(0, 80),
    category: category.id,
    priceBdt: Math.max(0, Math.round(value.priceBdt)),
    stock: Math.max(0, Math.min(9999, Math.round(value.stock))),
    status: value.status as ProductStatus,
    claim: typeof value.claim === "string" ? value.claim.slice(0, 180) : "",
    description: typeof value.description === "string" ? value.description.slice(0, 500) : "",
    details,
    durationSec: typeof value.durationSec === "number" && value.durationSec > 0 ? Math.min(30, value.durationSec) : null,
    poster: safePoster(value.poster, category.id, typeof value.title === "string" ? value.title : "Demo"),
    video: safeVideo(value.video),
    reviewNote: typeof value.reviewNote === "string" ? value.reviewNote.slice(0, 180) : "",
  };
}

function readOrder(value: unknown): DemoOrder | null {
  if (!isRecord(value) || typeof value.id !== "string") return null;
  const method = PAY_METHODS.find((item) => item.id === value.method);
  if (!method) return null;
  if (!DIVISIONS.includes(value.division as (typeof DIVISIONS)[number])) return null;
  if (!Array.isArray(value.lines)) return null;
  const lines = value.lines
    .map((line) => {
      if (!isRecord(line)) return null;
      if (typeof line.productId !== "string" || typeof line.sellerId !== "string" || typeof line.title !== "string") return null;
      if (typeof line.qty !== "number" || typeof line.priceBdt !== "number") return null;
      return {
        productId: line.productId.slice(0, 40),
        sellerId: line.sellerId.slice(0, 40),
        title: line.title.slice(0, 80),
        qty: Math.max(1, Math.min(99, Math.round(line.qty))),
        priceBdt: Math.max(0, Math.round(line.priceBdt)),
      };
    })
    .filter((line): line is DemoOrder["lines"][number] => line != null);
  if (lines.length === 0) return null;
  return {
    id: value.id.slice(0, 24),
    createdAt: typeof value.createdAt === "string" ? value.createdAt.slice(0, 40) : new Date(0).toISOString(),
    division: value.division as string,
    method: method.id,
    note: typeof value.note === "string" ? value.note.slice(0, 140) : "",
    lines,
    totalBdt: lines.reduce((sum, line) => sum + line.priceBdt * line.qty, 0),
    historical: value.historical === true,
  };
}

function safePoster(value: unknown, category: CategoryId, title: string): string {
  if (typeof value === "string") {
    if (value.startsWith("/media/") && !value.includes("..") && value.endsWith(".png")) return value.slice(0, 180);
    if (
      (value.startsWith("data:image/svg+xml") || value.startsWith("data:image/jpeg") || value.startsWith("data:image/png")) &&
      value.length <= 500_000
    ) {
      return value;
    }
  }
  return fallbackPoster(category, title);
}

function safeVideo(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0) return null;
  if (value.startsWith("/media/") && value.endsWith(".mp4") && !value.includes("..")) return value.slice(0, 180);
  return null;
}
