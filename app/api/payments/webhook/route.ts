import { applyPaymentEvent, verifyWebhookSignature } from "@/lib/commerce/policy";
import { readCommerceConfig } from "@/lib/commerce/config";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const config = readCommerceConfig(process.env);
  if (!config.databaseConfigured || !config.serviceRoleConfigured || !config.webhookSecretConfigured) {
    return Response.json({ ok: false, code: "setup_required" }, { status: 503 });
  }
  const payload = await request.text();
  const signature = request.headers.get("x-online-market-signature");
  const secret = process.env.PAYMENT_WEBHOOK_SECRET?.trim() ?? null;
  if (!verifyWebhookSignature(payload, signature, secret)) {
    return Response.json({ ok: false, code: "invalid_signature" }, { status: 401 });
  }
  let body: { provider?: string; eventId?: string; orderId?: string; amountBdt?: number; kind?: "paid" | "failed" };
  try {
    body = JSON.parse(payload) as typeof body;
  } catch {
    return Response.json({ ok: false, code: "invalid_json" }, { status: 400 });
  }
  if (!body.provider || !body.eventId || !body.orderId || body.kind == null || typeof body.amountBdt !== "number") {
    return Response.json({ ok: false, code: "invalid_event" }, { status: 400 });
  }
  const admin = createSupabaseAdmin();
  if (!admin) return Response.json({ ok: false, code: "setup_required" }, { status: 503 });
  const { data: existing } = await admin.from("payment_events").select("id").eq("provider", body.provider).eq("event_id", body.eventId).maybeSingle();
  if (existing) return Response.json({ ok: true, duplicate: true });
  const { data: order } = await admin.from("orders").select("id, status, total_bdt").eq("id", body.orderId).maybeSingle();
  if (!order) return Response.json({ ok: false, code: "unknown_order" }, { status: 404 });
  const decision = applyPaymentEvent(
    [{ id: order.id, status: order.status, totalBdt: order.total_bdt }],
    [],
    { provider: body.provider, eventId: body.eventId, orderId: body.orderId, amountBdt: body.amountBdt, kind: body.kind },
  );
  if (!decision.ok) return Response.json({ ok: false, code: decision.code }, { status: 409 });
  const { error: insertError } = await admin.from("payment_events").insert({
    provider: body.provider,
    event_id: body.eventId,
    order_id: body.orderId,
    amount_bdt: body.amountBdt,
    kind: body.kind,
  });
  if (insertError) return Response.json({ ok: false, code: "event_not_stored" }, { status: 409 });
  if (body.kind === "paid") {
    const { error } = await admin.from("orders").update({ status: "paid" }).eq("id", order.id).eq("status", "pending_payment");
    if (error) return Response.json({ ok: false, code: "order_not_updated" }, { status: 409 });
  }
  return Response.json({ ok: true, duplicate: false });
}
