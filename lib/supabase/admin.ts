import { createClient } from "@supabase/supabase-js";
import { readCommerceConfig } from "@/lib/commerce/config";

export function createSupabaseAdmin() {
  const config = readCommerceConfig(process.env);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!config.supabaseUrl || !serviceRoleKey) return null;
  return createClient(config.supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
