import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { readCommerceConfig } from "@/lib/commerce/config";

export async function createSupabaseServer() {
  const config = readCommerceConfig(process.env);
  if (!config.databaseConfigured || !config.supabaseUrl || !config.supabaseAnonKey) return null;
  const cookieStore = await cookies();
  return createServerClient(config.supabaseUrl, config.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const cookie of cookiesToSet) {
            cookieStore.set(cookie.name, cookie.value, cookie.options);
          }
        } catch {
          // Server Components cannot always write cookies. proxy.ts refreshes the session.
        }
      },
    },
  });
}
