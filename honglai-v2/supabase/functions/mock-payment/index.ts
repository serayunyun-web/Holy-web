// 模擬 LINE Pay 付款結果（示範網站用，不連線任何金流）。
// 持有送出訂單時取得的一次性付款憑證才能改付款狀態；付款成功即成立訂單與工作單，並寄客人版工作單。
import { hasValidPublishableKey } from "../_shared/auth.ts";
import { adminClient, allowSubmission } from "../_shared/database.ts";
import { allowedOrigin, corsHeaders, response } from "../_shared/http.ts";
import { sendPaidOrderEmail } from "../_shared/order-email.ts";
import { submissionFingerprints, text, type JsonObject } from "../_shared/validation.ts";

type PaymentResult = { status: "paid" | "failed" | "cancelled"; already: boolean; order_no?: string; work_order_id?: string; work_order_no?: string; total?: number };

Deno.serve(async (request) => {
  const origin = allowedOrigin(request);
  if (!origin) return new Response(null, { status: 403 });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (request.method !== "POST") return response(origin, 405, { error: "method_not_allowed" });

  try {
    if (!await hasValidPublishableKey(request)) return response(origin, 401, { error: "invalid_api_key" });
    if (Number(request.headers.get("content-length") ?? 0) > 4_096) return response(origin, 413, { error: "payload_too_large" });
    const body = await request.json() as JsonObject;
    const referenceNo = text(body, "referenceNo", 40, true)!;
    const token = text(body, "token", 64, true)!;
    const result = text(body, "result", 20, true)!;
    if (!/^[0-9a-f]{64}$/.test(token)) throw new Error("invalid:token");
    if (!["paid", "failed", "cancelled"].includes(result)) throw new Error("invalid:result");

    const client = adminClient();
    if (!await allowSubmission(client, await submissionFingerprints(request, referenceNo), "mock_payment", 20)) {
      return response(origin, 429, { error: "rate_limited" });
    }
    const { data, error } = await client.rpc("record_mock_payment", { p_inquiry_no: referenceNo, p_token: token, p_result: result });
    if (error) {
      const known = ["not_found", "not_payable", "inquiry_closed"].find((code) => error.message.includes(code));
      if (known) return response(origin, known === "not_found" ? 404 : 409, { error: known });
      throw error;
    }
    const payment = data as PaymentResult;
    let emailSent = false;
    if (payment.status === "paid" && !payment.already && payment.work_order_id) {
      // 寄信失敗不影響付款與訂單成立；後台可重寄。
      try { emailSent = (await sendPaidOrderEmail(client, payment.work_order_id)).sent; } catch (mailError) { console.error("mock-payment email", mailError); }
    }
    return response(origin, 200, { status: payment.status, already: payment.already, orderNo: payment.order_no ?? null, workOrderNo: payment.work_order_no ?? null, total: payment.total ?? null, emailSent });
  } catch (error) {
    const invalid = error instanceof Error && error.message.startsWith("invalid:");
    console.error("mock-payment", error);
    return response(origin, invalid ? 400 : 500, { error: invalid ? error.message : "payment_failed" });
  }
});
