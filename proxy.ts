import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { readCommerceConfig } from "@/lib/commerce/config";

export async function proxy(request: NextRequest) {
  const config = readCommerceConfig(process.env);
  if (!config.databaseConfigured || !config.supabaseUrl || !config.supabaseAnonKey) {
    return NextResponse.next();
  }
  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.supabaseUrl, config.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const cookie of cookiesToSet) request.cookies.set(cookie.name, cookie.value);
        response = NextResponse.next({ request });
        for (const cookie of cookiesToSet) response.cookies.set(cookie.name, cookie.value, cookie.options);
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|media/|icon.svg|.*\\.(?:png|mp4|svg|vtt)$).*)"],
};
