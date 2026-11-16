"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseBrowser, isSupabaseConfigured } from "@/lib/supabase-public-api";
import { specRows } from "@/lib/spec-labels";
import { dateTime, money } from "@/lib/admin-labels";

type QuoteView = {
  quote_no: string; status: string; contact_name: string; organization: string | null; product_name: string; product_slug: string; quantity: number;
  specifications: Record<string, string>; items: { label: string; unitPrice: number; quantity: number; unit: string; amount: number }[];
  shipping_fee: number; shipping: { label: string; district?: string } | null; subtotal: number; total: number; delivery_date: string; notes: string | null;
  valid_until: string; accepted_at: string | null; order_no: string | null;
};

const statusText: Record<string, string> = {
  expired: "此報價已超過 3 天有效期限，請聯絡鴻萊重新報價。",
  superseded: "此報價已更新為新版本，請使用最新 Email 中的確認連結。",
  revoked: "此報價已被撤回，請聯絡鴻萊。",
};

export function QuoteConfirmation() {
  const [token, setToken] = useState("");
  const [quote, setQuote] = useState<QuoteView | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const value = new URLSearchParams(window.location.hash.slice(1)).get("t") ?? "";
      if (!/^[0-9a-f]{64}$/.test(value)) { setError("確認連結不完整，請從 Email 重新開啟。"); return; }
      if (!isSupabaseConfigured()) { setError("網站尚未完成系統設定。"); return; }
      setToken(value);
      const { data, error: rpcError } = await supabaseBrowser().rpc("get_quote_for_customer", { p_token: value });
      if (rpcError || !data) { setError("找不到這份報價，請確認連結是否正確。"); return; }
      setQuote(data as QuoteView);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const accept = async () => {
    if (busy || !quote) return;
    setBusy(true);
    const { data, error: rpcError } = await supabaseBrowser().rpc("accept_quote", { p_token: token });
    setBusy(false);
    if (rpcError || !data) {
      setError(rpcError?.message === "quote_expired" ? statusText.expired : rpcError?.message === "quote_not_active" ? "此報價已無法確認，請聯絡鴻萊。" : "確認失敗，請稍後再試。");
      return;
    }
    setQuote({ ...quote, status: "accepted", accepted_at: new Date().toISOString(), order_no: (data as { order_no: string }).order_no });
  };

  if (error && !quote) return <section className="quote-confirm page-container"><p className="admin-callout">{error}</p><Link className="button button-secondary" href="/contact">聯絡鴻萊</Link></section>;
  if (!quote) return <section className="quote-confirm page-container"><p className="admin-empty">載入報價中…</p></section>;

  const accepted = quote.status === "accepted";
  return <section className="quote-confirm page-container">
    <div className="quote-confirm-card">
      <p className="eyebrow">正式報價確認</p>
      <h1>報價編號 {quote.quote_no}</h1>
      <p>{quote.organization ? `${quote.organization}・` : ""}{quote.contact_name} 您好，請確認以下製作內容與金額。這是正式報價確認，<strong>不是線上付款</strong>。</p>
      <dl className="order-summary">
        <div><dt>商品</dt><dd>{quote.product_name}</dd></div><div><dt>數量</dt><dd>{quote.quantity} 本</dd></div>
        {specRows(quote.product_slug, quote.specifications).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
        <div><dt>預計交貨日</dt><dd>{quote.delivery_date}</dd></div>
        {quote.shipping && <div><dt>配送方式</dt><dd>{quote.shipping.label}{quote.shipping.district ? `・${quote.shipping.district}` : ""}</dd></div>}
        {quote.notes && <div><dt>製作備註</dt><dd>{quote.notes}</dd></div>}
        <div><dt>報價有效至</dt><dd>{dateTime(quote.valid_until)}</dd></div>
      </dl>
      <div className="price-breakdown"><table><thead><tr><th>項目</th><th>單價</th><th>數量</th><th>小計</th></tr></thead>
        <tbody>{quote.items.map((item, index) => <tr key={index}><td>{item.label}</td><td>{money(item.unitPrice)}</td><td>{item.quantity} {item.unit}</td><td>{money(item.amount)}</td></tr>)}</tbody>
        <tfoot><tr><th colSpan={3}>商品小計</th><td>{money(quote.subtotal)}</td></tr><tr><th colSpan={3}>運費</th><td>{money(quote.shipping_fee)}</td></tr><tr className="price-total"><th colSpan={3}>正式報價合計（未稅）</th><td>{money(quote.total)}</td></tr></tfoot></table></div>
      {accepted ? <div className="summary-banner"><span aria-hidden="true">✓</span><div><strong>您已確認此報價</strong><small>訂單編號：{quote.order_no}{quote.accepted_at ? `・確認時間 ${dateTime(quote.accepted_at)}` : ""}。我們會依交貨日安排製作。</small></div></div>
        : quote.status === "sent" ? <div className="order-actions"><button className="button button-primary" disabled={busy} onClick={accept} type="button">{busy ? "確認中…" : "確認接受此報價"}</button><span className="admin-muted">確認後訂單成立，鴻萊開始安排製作。</span></div>
        : <p className="admin-callout">{statusText[quote.status] ?? "此報價目前無法確認。"}</p>}
      {error && <p className="form-message">{error}</p>}
    </div>
  </section>;
}
