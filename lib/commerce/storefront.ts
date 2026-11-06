import { CLOSED_NOTICE, readCommerceConfig, type ShopGates } from "@/lib/commerce/config";
import { checkoutBlockers } from "@/lib/commerce/policy";
import { previewOffers } from "@/lib/commerce/preview";
import { getShopGates } from "@/lib/commerce/session";
import type { StoreOffer } from "@/lib/commerce/types";
import { fallbackPoster } from "@/lib/market";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { CategoryId } from "@/lib/types";

export interface Storefront {
  source: "preview" | "database" | "unavailable";
  offers: StoreOffer[];
  gates: ShopGates;
  notice: string | null;
  checkoutOpen: boolean;
}

export async function loadStorefront(): Promise<Storefront> {
  const gates = await getShopGates();
  const checkoutOpen = checkoutBlockers(gates).length === 0;
  const config = readCommerceConfig(process.env);
  if (!config.databaseConfigured) {
    return { source: "preview", offers: previewOffers(), gates, notice: CLOSED_NOTICE, checkoutOpen: false };
  }
  const supabase = await createSupabaseServer();
  if (!supabase) {
    return { source: "unavailable", offers: [], gates, notice: "The catalog could not be loaded. Nothing is for sale.", checkoutOpen: false };
  }
  const { data, error } = await supabase
    .from("products")
    .select("id, title, category, description, price_bdt, stock, seller_id, duration_sec, poster_path, video_path, sellers(name, area, status)")
    .eq("status", "live");
  if (error) {
    return { source: "unavailable", offers: [], gates, notice: "The catalog could not be loaded. Nothing is for sale.", checkoutOpen: false };
  }
  const rows = data ?? [];
  if (rows.length === 0) {
    return {
      source: "preview",
      offers: previewOffers(),
      gates,
      notice: "No approved listings yet. This reel is an illustration preview and is not for sale.",
      checkoutOpen: false,
    };
  }
  return {
    source: "database",
    offers: rows.map((row) => mapRow(row, config.supabaseUrl, checkoutOpen)),
    gates,
    notice: checkoutOpen ? null : "Listings are visible. Checkout is not open, so nothing can be ordered.",
    checkoutOpen,
  };
}

function mapRow(
  row: {
    id: string;
    title: string;
    category: string;
    description: string;
    price_bdt: number;
    stock: number;
    seller_id: string;
    duration_sec: number | null;
    poster_path: string | null;
    video_path: string | null;
    sellers: { name: string; area: string; status: string } | { name: string; area: string; status: string }[] | null;
  },
  supabaseUrl: string | null,
  checkoutOpen: boolean,
): StoreOffer {
  const seller = Array.isArray(row.sellers) ? row.sellers[0] : row.sellers;
  const sellerActive = seller?.status === "active";
  const category = (["fashion", "home", "beauty", "phone", "electronics"] as const).includes(row.category as CategoryId)
    ? (row.category as CategoryId)
    : "home";
  return {
    id: row.id,
    title: row.title,
    category,
    priceBdt: row.price_bdt,
    stock: row.stock,
    sellerId: row.seller_id,
    sellerName: seller?.name ?? "Seller",
    sellerArea: seller?.area ?? "",
    description: row.description,
    details: [],
    poster: mediaUrl(supabaseUrl, row.poster_path) ?? fallbackPoster(category, row.title),
    video: mediaUrl(supabaseUrl, row.video_path),
    durationSec: row.duration_sec,
    preview: false,
    purchasable: checkoutOpen && sellerActive && row.stock > 0,
    variants: [],
  };
}

function mediaUrl(supabaseUrl: string | null, path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("https://") || path.startsWith("/")) return path;
  if (!supabaseUrl) return null;
  return `${supabaseUrl}/storage/v1/object/public/product-media/${path}`;
}
