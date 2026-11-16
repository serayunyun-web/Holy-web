export const inquiryStatusLabels: Record<string, string> = {
  pending_review: "待處理", contacted: "審核中", needs_info: "待補件", quoted: "已提供報價", converted: "已成立訂單", closed: "已關閉／取消",
};
export const quoteStatusLabels: Record<string, string> = {
  sent: "待客戶確認", expired: "已失效（逾期）", accepted: "客戶已確認", superseded: "已被新版取代", revoked: "已撤回",
};
export const workOrderStatusLabels: Record<string, string> = {
  pending_confirmation: "待確認", scheduled: "已確認・待製作", in_production: "製作中", completed: "已完成", delivered: "已交付",
};

export const money = (value: number | null | undefined) => value === null || value === undefined ? "—" : `NT$${Number(value).toLocaleString("zh-TW")}`;
export const dateTime = (value: string | null | undefined) => value ? new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value)) : "—";

export function quoteEffectiveStatus(quote: { status: string; valid_until: string }) {
  return quote.status === "sent" && new Date(quote.valid_until) < new Date() ? "expired" : quote.status;
}
export const paymentStatusLabels: Record<string, string> = {
  unpaid: "未付款", paid: "已付款", failed: "付款失敗", cancelled: "已取消付款",
};
