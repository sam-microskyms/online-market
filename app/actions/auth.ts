"use server";

import { redirect } from "next/navigation";
import { readCommerceConfig } from "@/lib/commerce/config";
import type { ActionResult } from "@/lib/commerce/types";
import { createSupabaseServer } from "@/lib/supabase/server";

function closed(): ActionResult {
  return {
    ok: false,
    code: "setup_required",
    message: "Accounts are not open. Add the Supabase URL and anon key, apply the migration, then try again.",
  };
}

export async function signUp(_previous: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const config = readCommerceConfig(process.env);
  if (!config.databaseConfigured) return closed();
  const supabase = await createSupabaseServer();
  if (!supabase) return closed();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();
  if (!email.includes("@") || password.length < 8) {
    return { ok: false, code: "invalid_account", message: "Use a valid email and a password of at least 8 characters." };
  }
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName || email.split("@")[0] }, emailRedirectTo: `${config.siteUrl}/account` },
  });
  if (error) return { ok: false, code: "signup_failed", message: error.message };
  return {
    ok: true,
    code: "signup_started",
    message: "Check your email if confirmation is required. This signup does not grant seller or admin access.",
  };
}

export async function signIn(_previous: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (!readCommerceConfig(process.env).databaseConfigured) return closed();
  const supabase = await createSupabaseServer();
  if (!supabase) return closed();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, code: "signin_failed", message: error.message };
  redirect("/account");
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServer();
  if (supabase) await supabase.auth.signOut();
  redirect("/");
}
