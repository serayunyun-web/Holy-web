// 後台送出正式報價後呼叫：寄出含確認連結的正式報價單。只限 admin／manager。
import { hasValidPublishableKey } from "../_shared/auth.ts";
import { adminClient } from "../_shared/database.ts";
import { formalQuoteEmail, sendEmail } from "../_shared/email.ts";
import { allowedOrigin, corsHeaders, response } from "../_shared/http.ts";
import { specRows } from "../_shared/spec-labels.ts";
import { text, uuid, type JsonObject } from "../_shared/validation.ts";

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

const taipeiDate = (value: string) => new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));

Deno.serve(async (request) => {
  const origin = allowedOrigin(request);
  if (!origin) return new Response(null, { status: 403 });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (request.method !== "POST") return response(origin, 405, { error: "method_not_allowed" });

  try {
    if (!await hasValidPublishableKey(request)) return response(origin, 401, { error: "invalid_api_key" });
    const jwt = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    const client = adminClient();
    const { data: userData, error: userError } = await client.auth.getUser(jwt);
    if (userError || !userData.user) return response(origin, 401, { error: "unauthorized" });
    const [{ data: roles }, { data: profile }] = await Promise.all([
      client.from("user_roles").select("role").eq("user_id", userData.user.id).in("role", ["admin", "manager"]),
      client.from("profiles").select("is_active").eq("user_id", userData.user.id).maybeSingle(),
    ]);
    if (!roles?.length || !profile?.is_active) return response(origin, 403, { error: "forbidden" });

    const body = await request.json() as JsonObject;
    const quoteId = uuid(body, "quoteId");
    const token = text(body, "token", 64, true)!;
    if (!/^[0-9a-f]{64}$/.test(token)) throw new Error("invalid:token");

    const { data: quote, error } = await client.from("quotes").select("*, manual_inquiries!inner(contact_name, email, manual_inquiry_items(product_name, product_slug, quantity, specifications))").eq("id", quoteId).single();
    if (error || !quote) return response(origin, 404, { error: "not_found" });
    if (quote.token_hash !== await sha256(token) || quote.status !== "sent") return response(origin, 409, { error: "quote_not_active" });

    const inquiry = quote.manual_inquiries as unknown as { contact_name: string; email: string; manual_inquiry_items: { product_name: string; product_slug: string; quantity: number; specifications: Record<string, string> }[] };
    const item = inquiry.manual_inquiry_items[0];
    const link = `${origin}/quote/confirm/#t=${token}`;
    const sent = await sendEmail({
      to: inquiry.email,
      subject: `【鴻萊興業】正式報價單（${quote.quote_no}），請於 3 天內確認`,
      html: formalQuoteEmail({
        quoteNo: quote.quote_no, contactName: inquiry.contact_name, productName: item.product_name, quantity: item.quantity,
        specs: specRows(item.product_slug, item.specifications), items: quote.items, subtotal: quote.subtotal, shippingFee: quote.shipping_fee,
        total: quote.total, deliveryDate: quote.delivery_date, validUntil: taipeiDate(quote.valid_until), notes: quote.notes, link,
      }),
    });
    if (sent) await client.from("quotes").update({ email_sent_at: new Date().toISOString() }).eq("id", quoteId);
    return response(origin, 200, { sent, to: inquiry.email });
  } catch (error) {
    const invalid = error instanceof Error && error.message.startsWith("invalid:");
    console.error("send-quote-email", error);
    return response(origin, invalid ? 400 : 500, { error: invalid ? error.message : "send_failed" });
  }
});
