import { gatesFromConfig, readCommerceConfig, type ShopGates } from "@/lib/commerce/config";
import type { AccountRole, SellerAccess, Viewer } from "@/lib/commerce/types";
import { createSupabaseServer } from "@/lib/supabase/server";

const signedOut: Viewer = {
  signedIn: false,
  userId: null,
  email: null,
  displayName: null,
  role: null,
  sellerId: null,
  sellerStatus: "none",
};

export async function getShopGates(): Promise<ShopGates> {
  return gatesFromConfig(readCommerceConfig(process.env));
}

export async function getViewer(): Promise<Viewer> {
  const supabase = await createSupabaseServer();
  if (!supabase) return signedOut;
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return signedOut;
  const [{ data: profile }, { data: seller }, { data: pending }] = await Promise.all([
    supabase.from("profiles").select("role, display_name").eq("id", user.id).maybeSingle(),
    supabase.from("sellers").select("id, status").eq("owner_id", user.id).maybeSingle(),
    supabase.from("seller_applications").select("id").eq("user_id", user.id).eq("status", "pending").maybeSingle(),
  ]);
  const role: AccountRole | null = profile?.role === "admin" ? "admin" : "customer";
  let sellerStatus: SellerAccess = "none";
  if (seller?.status === "active") sellerStatus = "active";
  else if (seller?.status === "suspended") sellerStatus = "suspended";
  else if (pending) sellerStatus = "pending";
  return {
    signedIn: true,
    userId: user.id,
    email: user.email ?? null,
    displayName: profile?.display_name ?? null,
    role,
    sellerId: seller?.id ?? null,
    sellerStatus,
  };
}
