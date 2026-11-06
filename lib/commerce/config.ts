export interface CommerceConfig {
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
  serviceRoleConfigured: boolean;
  databaseConfigured: boolean;
  checkoutEnabled: boolean;
  codEnabled: boolean;
  prepaidEnabled: boolean;
  webhookSecretConfigured: boolean;
  siteUrl: string;
}

export interface ShopGates {
  databaseConfigured: boolean;
  checkoutEnabled: boolean;
  codEnabled: boolean;
  prepaidEnabled: boolean;
  webhookSecretConfigured: boolean;
}

function flag(value: string | undefined): boolean {
  return value === "true" || value === "1";
}

export function readCommerceConfig(env: Record<string, string | undefined>): CommerceConfig {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim() || null;
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || null;
  const serviceRoleConfigured = Boolean(env.SUPABASE_SERVICE_ROLE_KEY?.trim());
  return {
    supabaseUrl,
    supabaseAnonKey,
    serviceRoleConfigured,
    databaseConfigured: Boolean(supabaseUrl && supabaseAnonKey),
    checkoutEnabled: flag(env.CHECKOUT_ENABLED),
    codEnabled: flag(env.COD_ENABLED),
    prepaidEnabled: flag(env.PREPAID_ENABLED),
    webhookSecretConfigured: Boolean(env.PAYMENT_WEBHOOK_SECRET?.trim()),
    siteUrl: env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000",
  };
}

export function gatesFromConfig(config: CommerceConfig): ShopGates {
  return {
    databaseConfigured: config.databaseConfigured,
    checkoutEnabled: config.checkoutEnabled,
    codEnabled: config.codEnabled,
    prepaidEnabled: config.prepaidEnabled,
    webhookSecretConfigured: config.webhookSecretConfigured,
  };
}

export const CLOSED_NOTICE = "Orders are not open. Illustrations are not stock for sale.";
