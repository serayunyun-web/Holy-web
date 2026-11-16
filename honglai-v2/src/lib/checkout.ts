// 模擬 LINE Pay 結帳：示範網站用，不連線任何金流，也不會扣款。
// 訂單送出後把結帳資訊（含一次性付款憑證）存在這台裝置的分頁（sessionStorage）；
// 付款結果由後端 mock-payment 記錄，這裡只快取最後結果供重新整理時顯示。
import { callPublicFunction } from "@/lib/supabase-public-api";

export type CheckoutInfo = { referenceNo: string; total: number; productTitle: string; quantity: number; token: string };
export type PaymentStatus = "unpaid" | "paid" | "failed" | "cancelled";
export type PaymentResponse = { status: PaymentStatus; already: boolean; orderNo: string | null; workOrderNo: string | null; total: number | null; emailSent: boolean };

const CHECKOUT_KEY = "honglai-checkout";
const PAYMENT_KEY = "honglai-payment-result";

export const paymentStatusLabels: Record<PaymentStatus, string> = { unpaid: "未付款", paid: "已付款", failed: "付款失敗", cancelled: "已取消付款" };

export function saveCheckout(info: CheckoutInfo) {
  sessionStorage.setItem(CHECKOUT_KEY, JSON.stringify(info));
}

export function readCheckout(referenceNo: string): CheckoutInfo | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(CHECKOUT_KEY) ?? "null") as CheckoutInfo | null;
    return saved && saved.referenceNo === referenceNo && saved.token ? saved : null;
  } catch {
    return null;
  }
}

export function cachedPayment(referenceNo: string): PaymentResponse | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(PAYMENT_KEY) ?? "{}") as Record<string, PaymentResponse>;
    return saved[referenceNo] ?? null;
  } catch {
    return null;
  }
}

function cachePayment(referenceNo: string, result: PaymentResponse) {
  let saved: Record<string, PaymentResponse> = {};
  try { saved = JSON.parse(sessionStorage.getItem(PAYMENT_KEY) ?? "{}"); } catch { saved = {}; }
  sessionStorage.setItem(PAYMENT_KEY, JSON.stringify({ ...saved, [referenceNo]: result }));
}

/** 呼叫後端記錄模擬付款結果；付款成功時後端會成立訂單並寄出訂單明細。 */
export async function submitMockPayment(info: CheckoutInfo, result: Exclude<PaymentStatus, "unpaid">) {
  const response = await callPublicFunction<PaymentResponse>("mock-payment", { referenceNo: info.referenceNo, token: info.token, result });
  cachePayment(info.referenceNo, response);
  return response;
}
