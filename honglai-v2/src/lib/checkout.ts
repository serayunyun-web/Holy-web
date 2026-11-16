// 模擬 LINE Pay 結帳：示範網站用，不連線任何金流，也不會扣款。
// 訂單送出後把結帳資訊存在這台裝置（sessionStorage），付款結果存在 localStorage。
export type CheckoutInfo = { referenceNo: string; total: number; productTitle: string; quantity: number };
export type PaymentStatus = "unpaid" | "paid" | "failed" | "cancelled";

const CHECKOUT_KEY = "honglai-checkout";
const PAYMENT_KEY = "honglai-payment-status";

export const paymentStatusLabels: Record<PaymentStatus, string> = { unpaid: "未付款", paid: "已付款", failed: "付款失敗", cancelled: "已取消付款" };

export function saveCheckout(info: CheckoutInfo) {
  sessionStorage.setItem(CHECKOUT_KEY, JSON.stringify(info));
}

export function readCheckout(referenceNo: string): CheckoutInfo | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(CHECKOUT_KEY) ?? "null") as CheckoutInfo | null;
    return saved && saved.referenceNo === referenceNo ? saved : null;
  } catch {
    return null;
  }
}

function statuses(): Record<string, PaymentStatus> {
  try {
    return JSON.parse(localStorage.getItem(PAYMENT_KEY) ?? "{}") as Record<string, PaymentStatus>;
  } catch {
    return {};
  }
}

export function paymentStatus(referenceNo: string): PaymentStatus {
  return statuses()[referenceNo] ?? "unpaid";
}

export function setPaymentStatus(referenceNo: string, status: PaymentStatus) {
  localStorage.setItem(PAYMENT_KEY, JSON.stringify({ ...statuses(), [referenceNo]: status }));
}
