// 後台寄訂單相關信件：
// - kind=paid：重寄客人版工作單（staff 以上）
// - kind=confirmed：確認訂單後的交期通知（manager 以上，工作單須已確認）
import { hasValidPublishableKey } from "../_shared/auth.ts";
import { adminClient } from "../_shared/database.ts";
import { orderConfirmedEmail, sendEmail, type OrderSnapshot } from "../_shared/email.ts";
import { allowedOrigin, corsHeaders, response } from "../_shared/http.ts";
import { sendPaidOrderEmail } from "../_shared/order-email.ts";
import { text, uuid, type JsonObject } from "../_shared/validation.ts";

const taipeiDay = (value: string) => new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", year: "numeric", month: "long", day: "numeric" }).format(new Date(`${value}T00:00:00+08:00`));

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

    const body = await request.json() as JsonObject;
    const workOrderId = uuid(body, "workOrderId");
    const kind = text(body, "kind", 20, true);
    if (kind !== "paid" && kind !== "confirmed") throw new Error("invalid:kind");

    const allowed = kind === "paid" ? ["admin", "manager", "staff"] : ["admin", "manager"];
    const [{ data: roles }, { data: profile }] = await Promise.all([
      client.from("user_roles").select("role").eq("user_id", userData.user.id).in("role", allowed),
      client.from("profiles").select("is_active").eq("user_id", userData.user.id).maybeSingle(),
    ]);
    if (!roles?.length || !profile?.is_active) return response(origin, 403, { error: "forbidden" });

    if (kind === "paid") return response(origin, 200, await sendPaidOrderEmail(client, workOrderId));

    const { data, error } = await client.from("work_orders").select("status, due_date, snapshot, orders!inner(order_no)").eq("id", workOrderId).single();
    if (error || !data) return response(origin, 404, { error: "not_found" });
    if (data.status === "pending_confirmation" || !data.due_date) return response(origin, 409, { error: "not_confirmed" });
    const snapshot = data.snapshot as OrderSnapshot;
    const item = snapshot.items?.[0];
    const to = snapshot.customer?.email ?? "";
    const orderNo = (data.orders as unknown as { order_no: string }).order_no;
    const sent = Boolean(to) && await sendEmail({
      to,
      subject: `【鴻萊興業】訂單已確認・預計交期 ${taipeiDay(data.due_date)}（${orderNo}）`,
      html: orderConfirmedEmail({ orderNo, contactName: snapshot.customer?.contact_name ?? "", productName: item?.product_name ?? "", quantity: item?.quantity ?? 0, dueDate: taipeiDay(data.due_date) }),
    });
    if (sent) await client.from("work_orders").update({ confirmation_email_sent_at: new Date().toISOString() }).eq("id", workOrderId);
    return response(origin, 200, { sent, to });
  } catch (error) {
    const invalid = error instanceof Error && error.message.startsWith("invalid:");
    console.error("send-order-email", error);
    return response(origin, invalid ? 400 : 500, { error: invalid ? error.message : "send_failed" });
  }
});
