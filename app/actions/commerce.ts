"use server";

import { redirect } from "next/navigation";
import { CATEGORIES } from "@/lib/market";
import { readCommerceConfig } from "@/lib/commerce/config";
import { checkoutBlockers, validateApplication, validateListing } from "@/lib/commerce/policy";
import { getShopGates, getViewer } from "@/lib/commerce/session";
import type { ActionResult } from "@/lib/commerce/types";
import { createSupabaseServer } from "@/lib/supabase/server";

function setup(message: string): ActionResult {
  return { ok: false, code: "setup_required", message };
}

export async function submitSellerApplication(_previous: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const config = readCommerceConfig(process.env);
  if (!config.databaseConfigured) {
    return setup("Seller applications are not open. Configure Supabase before submitting.");
  }
  const supabase = await createSupabaseServer();
  const viewer = await getViewer();
  if (!supabase || !viewer.signedIn || !viewer.userId) {
    return { ok: false, code: "auth_required", message: "Sign in with a customer account before applying." };
  }
  const categories = formData.getAll("categories").map(String).filter((id) => CATEGORIES.some((category) => category.id === id));
  const { data: pending } = await supabase
    .from("seller_applications")
    .select("id")
    .eq("user_id", viewer.userId)
    .eq("status", "pending")
    .maybeSingle();
  const parsed = validateApplication({
    businessName: String(formData.get("businessName") ?? ""),
    area: String(formData.get("area") ?? ""),
    categories,
    summary: String(formData.get("summary") ?? ""),
    existingPending: Boolean(pending),
  });
  if (!parsed.ok) return { ok: false, code: parsed.code, message: parsed.message };
  const { error } = await supabase.from("seller_applications").insert({
    user_id: viewer.userId,
    business_name: parsed.value.businessName,
    area: parsed.value.area,
    categories: parsed.value.categories,
    summary: parsed.value.summary,
    status: "pending",
  });
  if (error) return { ok: false, code: "application_failed", message: error.message };
  return { ok: true, code: "application_received", message: "Application received. It stays pending until an admin approves it." };
}

export async function createListing(_previous: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (!readCommerceConfig(process.env).databaseConfigured) {
    return setup("Listings cannot be saved. The database is not configured.");
  }
  const supabase = await createSupabaseServer();
  const viewer = await getViewer();
  if (!supabase || !viewer.sellerId || viewer.sellerStatus !== "active") {
    return { ok: false, code: "seller_required", message: "Only an approved seller account can create a listing." };
  }
  const hasVideo = formData.get("hasVideo") === "true";
  const durationRaw = String(formData.get("durationSec") ?? "");
  const parsed = validateListing({
    title: String(formData.get("title") ?? ""),
    category: String(formData.get("category") ?? ""),
    priceRaw: String(formData.get("price") ?? ""),
    stockRaw: String(formData.get("stock") ?? ""),
    description: String(formData.get("description") ?? ""),
    hasVideo,
    durationSec: durationRaw ? Number(durationRaw) : null,
  });
  if (!parsed.ok) return parsed;
  if (!CATEGORIES.some((category) => category.id === String(formData.get("category")))) {
    return { ok: false, code: "invalid_category", message: "Choose one of the shop categories." };
  }
  const { error } = await supabase.from("products").insert({
    seller_id: viewer.sellerId,
    title: parsed.value.title,
    category: String(formData.get("category")),
    description: parsed.value.description,
    price_bdt: parsed.value.priceBdt,
    stock: parsed.value.stock,
    status: "pending",
    duration_sec: parsed.value.durationSec,
  });
  if (error) return { ok: false, code: "listing_failed", message: error.message };
  return { ok: true, code: "listing_pending", message: "Listing saved as pending. It is not on the shop until an admin approves it." };
}

export async function moderateApplication(applicationId: string, decision: "approved" | "rejected"): Promise<ActionResult> {
  const viewer = await getViewer();
  if (viewer.role !== "admin") return { ok: false, code: "admin_required", message: "This account cannot review sellers." };
  const supabase = await createSupabaseServer();
  if (!supabase) return setup("Moderation needs the database.");
  if (decision === "approved") {
    const { error } = await supabase.rpc("approve_seller_application", { p_application: applicationId });
    if (error) return { ok: false, code: "moderate_failed", message: error.message };
    return { ok: true, code: "seller_approved", message: "Seller approved. They can open the seller desk." };
  }
  const { error } = await supabase.from("seller_applications").update({ status: "rejected", review_note: "Rejected." }).eq("id", applicationId);
  if (error) return { ok: false, code: "moderate_failed", message: error.message };
  return { ok: true, code: "seller_rejected", message: "Application rejected." };
}

export async function moderateProduct(productId: string, status: "live" | "hidden" | "rejected"): Promise<ActionResult> {
  const viewer = await getViewer();
  if (viewer.role !== "admin") return { ok: false, code: "admin_required", message: "This account cannot moderate listings." };
  const supabase = await createSupabaseServer();
  if (!supabase) return setup("Moderation needs the database.");
  const { error } = await supabase.from("products").update({ status }).eq("id", productId);
  if (error) return { ok: false, code: "moderate_failed", message: error.message };
  return { ok: true, code: "product_updated", message: `Listing marked ${status}.` };
}

export async function addToCart(formData: FormData): Promise<void> {
  const gates = await getShopGates();
  if (checkoutBlockers(gates).length > 0) redirect("/cart");
  const viewer = await getViewer();
  if (!viewer.signedIn || !viewer.userId) redirect("/account");
  const supabase = await createSupabaseServer();
  if (!supabase) redirect("/cart");
  const productId = String(formData.get("productId") ?? "");
  const { data: product } = await supabase.from("products").select("id, stock, status").eq("id", productId).maybeSingle();
  if (!product || product.status !== "live" || product.stock < 1) redirect("/cart");
  const { data: existing } = await supabase.from("cart_items").select("qty").eq("user_id", viewer.userId).eq("product_id", productId).maybeSingle();
  const qty = Math.min(20, (existing?.qty ?? 0) + 1);
  await supabase.from("cart_items").upsert({ user_id: viewer.userId, product_id: productId, qty });
  redirect("/cart");
}

export async function placeOrder(formData: FormData): Promise<void> {
  const config = readCommerceConfig(process.env);
  const gates = await getShopGates();
  if (!config.databaseConfigured) redirect("/checkout");
  const blockers = checkoutBlockers(gates);
  if (blockers.length > 0) redirect("/checkout");
  const method = String(formData.get("method") ?? "");
  if (method !== "cod" && method !== "prepaid") redirect("/checkout");
  const division = String(formData.get("division") ?? "");
  const viewer = await getViewer();
  if (!viewer.signedIn) redirect("/account");
  const supabase = await createSupabaseServer();
  if (!supabase) redirect("/checkout");
  let requested: { product_id: string; variant_id: string | null; qty: number }[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("lines") ?? "[]")) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("lines");
    requested = parsed.map((line) => {
      const record = line as { offerId?: string; variantId?: string | null; qty?: number };
      return { product_id: String(record.offerId ?? ""), variant_id: record.variantId ? String(record.variantId) : null, qty: Number(record.qty) };
    });
  } catch {
    redirect("/checkout");
  }
  const { data, error } = await supabase.rpc("place_order", {
    p_division: division,
    p_method: method,
    p_lines: requested,
  });
  if (error) redirect("/checkout");
  const record = data as { id?: string };
  if (!record.id) redirect("/checkout");
  redirect(`/order/${record.id}`);
}
