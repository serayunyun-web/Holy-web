"use client";

import { ADMIN_BASE } from "@/lib/admin-path";
import { BASE_PATH } from "@/lib/base-path";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/components/admin/admin-shell";
import { callPublicFunction, supabaseBrowser } from "@/lib/supabase-public-api";
import { specRows } from "@/lib/spec-labels";
import { formatBytes } from "@/lib/attachments";
import { dateTime, inquiryStatusLabels, money, paymentStatusLabels, quoteEffectiveStatus, quoteStatusLabels } from "@/lib/admin-labels";
import type { Estimate } from "@/lib/pricing";

type Item = { label: string; unitPrice: string; quantity: string; unit: string };
type Quote = { id: string; quote_no: string; version: number; status: string; total: number; subtotal: number; shipping_fee: number; items: { label: string; unitPrice: number; quantity: number; unit: string; amount: number }[]; delivery_date: string; notes: string | null; valid_until: string; created_at: string; accepted_at: string | null; email_sent_at: string | null };
type Inquiry = {
  id: string; inquiry_no: string; status: string; created_at: string; payment_status: string; paid_at: string | null; customer_type: string; contact_name: string; phone: string; email: string; organization: string | null; line_id: string | null;
  delivery_method: string | null; delivery_address: string | null; expected_date: string | null; customer_notes: string | null; special_requirements: string | null; internal_notes: string | null;
  estimate: Estimate | null; shipping: { label: string; fee: number; district?: string } | null;
  manual_inquiry_items: { product_name: string; product_slug: string; quantity: number; specifications: Record<string, string> }[];
  manual_inquiry_attachments: { id: string; file_name: string; size_bytes: number; storage_path: string }[];
  quotes: Quote[];
  orders: { id: string; order_no: string; work_orders: { id: string; work_order_no: string } | null }[];
};

// 正式報價流程先隱藏（付款後自動成立訂單）；程式與資料保留，改成 true 即可恢復。
const SHOW_FORMAL_QUOTE = false;

const errorText: Record<string, string> = { forbidden: "只有 manager 以上可以送出正式報價。", inquiry_closed: "此需求已成立訂單或已關閉。", "invalid:items": "報價項目有誤，請檢查名稱、單價與數量。", "invalid:delivery_date": "請填寫交貨日期。" };

export function AdminInquiry() {
  const { session, canManage } = useAdmin();
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [loadError, setLoadError] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [shippingFee, setShippingFee] = useState("0");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");

  const load = useCallback(async () => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) { setLoadError("缺少需求編號。"); return; }
    const { data, error } = await supabaseBrowser().from("manual_inquiries")
      .select("*, manual_inquiry_items(product_name, product_slug, quantity, specifications), manual_inquiry_attachments(id, file_name, size_bytes, storage_path), quotes(*), orders(id, order_no, work_orders(id, work_order_no))")
      .eq("id", id).single();
    if (error || !data) { setLoadError("找不到這筆需求，或沒有讀取權限。"); return; }
    const row = data as unknown as Inquiry;
    setInquiry(row);
    const item = row.manual_inquiry_items[0];
    const latest = [...row.quotes].sort((a, b) => b.version - a.version)[0];
    if (latest) {
      setItems(latest.items.map((line) => ({ label: line.label, unitPrice: String(line.unitPrice), quantity: String(line.quantity), unit: line.unit })));
      setShippingFee(String(latest.shipping_fee)); setDeliveryDate(latest.delivery_date); setNotes(latest.notes ?? "");
    } else if (row.estimate?.status === "priced") {
      setItems(row.estimate.lines.map((line) => ({ label: line.label, unitPrice: String(line.unitPrice), quantity: String(line.quantity), unit: line.unit })));
      setShippingFee(String(row.shipping?.fee ?? 0));
    } else {
      setItems([{ label: item?.product_name ?? "", unitPrice: "", quantity: String(item?.quantity ?? 1), unit: "本" }]);
      setShippingFee(String(row.shipping?.fee ?? 0));
    }
  }, []);
  useEffect(() => { const timer = window.setTimeout(load, 0); return () => window.clearTimeout(timer); }, [load]);

  if (loadError) return <p className="admin-empty">{loadError} <Link href={`${ADMIN_BASE}/`}>回列表</Link></p>;
  if (!inquiry) return <p className="admin-empty">載入中…</p>;

  const item = inquiry.manual_inquiry_items[0];
  const quotes = [...inquiry.quotes].sort((a, b) => b.version - a.version);
  const order = inquiry.orders[0];
  const subtotal = items.reduce((sum, line) => sum + Math.round(Number(line.unitPrice || 0) * Number(line.quantity || 0)), 0);
  const locked = ["converted", "closed"].includes(inquiry.status);
  const setItem = (index: number, key: keyof Item, value: string) => setItems((current) => current.map((line, i) => i === index ? { ...line, [key]: value } : line));

  const download = async (path: string) => {
    const { data, error } = await supabaseBrowser().storage.from("inquiry-files").createSignedUrl(path, 300);
    if (error || !data) { setMessage("檔案下載連結建立失敗。"); return; }
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const setStatus = async (status: string) => {
    const { error } = await supabaseBrowser().from("manual_inquiries").update({ status }).eq("id", inquiry.id);
    setMessage(error ? "狀態更新失敗（需要 manager 以上權限）。" : "狀態已更新。");
    if (!error) load();
  };

  const issue = async () => {
    if (busy) return;
    if (!deliveryDate) { setMessage("請填寫交貨日期。"); return; }
    if (items.some((line) => !line.label.trim() || line.unitPrice === "" || !Number(line.quantity))) { setMessage("每個報價項目都需要名稱、單價與數量。"); return; }
    setBusy(true); setMessage("正在建立正式報價…"); setLink("");
    const { data, error } = await supabaseBrowser().rpc("issue_quote", {
      p_inquiry_id: inquiry.id,
      p_items: items.map((line) => ({ label: line.label.trim(), unitPrice: Number(line.unitPrice), quantity: Number(line.quantity), unit: line.unit })),
      p_shipping_fee: Math.round(Number(shippingFee || 0)), p_delivery_date: deliveryDate, p_notes: notes,
    });
    if (error || !data) { setBusy(false); setMessage(errorText[error?.message ?? ""] ?? "報價建立失敗，請稍後再試。"); return; }
    const created = data as { quote_id: string; quote_no: string; token: string };
    const confirmLink = `${window.location.origin}${BASE_PATH}/quote/confirm/#t=${created.token}`;
    setLink(confirmLink);
    try {
      const sent = await callPublicFunction<{ sent: boolean; to: string }>("send-quote-email", { quoteId: created.quote_id, token: created.token }, session.access_token);
      setMessage(sent.sent ? `正式報價 ${created.quote_no} 已建立並寄到 ${sent.to}。` : `正式報價 ${created.quote_no} 已建立，但 Email 尚未設定，請複製下方連結傳給客戶。`);
    } catch {
      setMessage(`正式報價 ${created.quote_no} 已建立，但 Email 寄送失敗，請複製下方連結傳給客戶。`);
    }
    setBusy(false);
    load();
  };

  const revoke = async (quoteId: string) => {
    if (!window.confirm("撤回後客戶將無法再確認這份報價，確定撤回？")) return;
    const { error } = await supabaseBrowser().rpc("revoke_quote", { p_quote_id: quoteId });
    setMessage(error ? "撤回失敗。" : "已撤回報價。");
    load();
  };

  return <>
    <div className="admin-heading"><div><Link className="no-print" href={`${ADMIN_BASE}/`}>← 回列表</Link><h1 className="admin-title">{inquiry.inquiry_no}</h1></div><span className={`admin-badge is-${inquiry.status}`}>{inquiryStatusLabels[inquiry.status]}</span></div>
    {order && <p className="admin-callout">{inquiry.payment_status === "paid" ? "客人已付款" : "客戶已確認報價"}，訂單 <strong>{order.order_no}</strong> 已成立。{order.work_orders && <Link href={`${ADMIN_BASE}/work-order/?id=${order.work_orders.id}`}>前往確認訂單／工作單 {order.work_orders.work_order_no}</Link>}</p>}

    <div className="admin-grid">
      <section className="admin-card"><h2>客戶資料</h2><dl className="admin-dl">
        {([["客戶類型", inquiry.customer_type], ["聯絡人", inquiry.contact_name], ["公司／學校", inquiry.organization], ["電話", inquiry.phone], ["Email", inquiry.email], ["LINE", inquiry.line_id], ["配送", inquiry.shipping ? `${inquiry.shipping.label}${inquiry.shipping.district ? `・${inquiry.shipping.district}` : ""}` : inquiry.delivery_method], ["地址", inquiry.delivery_address], ["希望完成日", inquiry.expected_date], ["建立時間", dateTime(inquiry.created_at)], ["付款狀態", `${paymentStatusLabels[inquiry.payment_status] ?? inquiry.payment_status}${inquiry.paid_at ? ` ${dateTime(inquiry.paid_at)}` : ""}`]] as [string, string | null][]).filter(([, value]) => value).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl></section>
      <section className="admin-card"><h2>製作規格</h2><dl className="admin-dl">
        <div><dt>產品</dt><dd>{item?.product_name}</dd></div><div><dt>數量</dt><dd>{item?.quantity} 本</dd></div>
        {item && specRows(item.product_slug, item.specifications).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
        {inquiry.customer_notes && <div><dt>製作備註</dt><dd>{inquiry.customer_notes}</dd></div>}
        {inquiry.special_requirements && <div><dt>特殊需求</dt><dd>{inquiry.special_requirements}</dd></div>}
      </dl>
        <h3>附件</h3>{inquiry.manual_inquiry_attachments.length ? <ul className="admin-files">{inquiry.manual_inquiry_attachments.map((file) => <li key={file.id}><button className="text-button" onClick={() => download(file.storage_path)} type="button">{file.file_name}</button><small>{formatBytes(file.size_bytes)}</small></li>)}</ul> : <p className="admin-muted">沒有附件</p>}
      </section>
    </div>

    <section className="admin-card"><h2>系統試算</h2>
      {inquiry.estimate?.status === "priced" ? <p>試算合計 <strong>{money(inquiry.estimate.total)}</strong>（價格版本 {inquiry.estimate.priceVersion}）</p> : <p className="admin-muted">{inquiry.estimate?.reason ?? "此需求沒有系統試算。"}</p>}
    </section>

    {!SHOW_FORMAL_QUOTE && !locked && <section className="admin-card"><h2>處理</h2><p className="admin-muted">客人付款成功後會自動成立訂單。若客人不再付款，可以關閉這筆紀錄。</p><div className="admin-inline-actions"><button className="text-button" disabled={!canManage} onClick={() => window.confirm("確定關閉這筆紀錄？") && setStatus("closed")} type="button">關閉／取消</button></div></section>}

    {SHOW_FORMAL_QUOTE && !locked && <section className="admin-card"><h2>正式報價{quotes.length ? `（將建立第 ${quotes[0].version + 1} 版，舊版連結自動失效）` : ""}</h2>
      <div className="admin-table-wrap"><table className="admin-table admin-quote-table"><thead><tr><th>項目</th><th>單價</th><th>數量</th><th>單位</th><th>小計</th><th /></tr></thead><tbody>
        {items.map((line, index) => <tr key={index}>
          <td><input aria-label="項目名稱" onChange={(event) => setItem(index, "label", event.target.value)} value={line.label} /></td>
          <td><input aria-label="單價" inputMode="decimal" onChange={(event) => setItem(index, "unitPrice", event.target.value)} value={line.unitPrice} /></td>
          <td><input aria-label="數量" inputMode="decimal" onChange={(event) => setItem(index, "quantity", event.target.value)} value={line.quantity} /></td>
          <td><input aria-label="單位" onChange={(event) => setItem(index, "unit", event.target.value)} value={line.unit} /></td>
          <td>{money(Math.round(Number(line.unitPrice || 0) * Number(line.quantity || 0)))}</td>
          <td><button className="text-button" disabled={items.length === 1} onClick={() => setItems((current) => current.filter((_, i) => i !== index))} type="button">刪除</button></td>
        </tr>)}
      </tbody></table></div>
      <button className="text-button" onClick={() => setItems((current) => [...current, { label: "", unitPrice: "", quantity: "1", unit: "件" }])} type="button">＋ 新增項目</button>
      <div className="admin-form-row">
        <label>運費<input inputMode="numeric" onChange={(event) => setShippingFee(event.target.value.replace(/[^\d]/g, ""))} value={shippingFee} /></label>
        <label>交貨日期<input onChange={(event) => setDeliveryDate(event.target.value)} type="date" value={deliveryDate} /></label>
        <label className="admin-wide">製作備註（會顯示給客戶）<textarea onChange={(event) => setNotes(event.target.value)} rows={2} value={notes} /></label>
      </div>
      <p className="admin-total">報價合計 <strong>{money(subtotal + Number(shippingFee || 0))}</strong>（商品 {money(subtotal)} ＋ 運費 {money(Number(shippingFee || 0))}）・有效期限 3 天</p>
      <button className="button button-primary" disabled={busy || !canManage} onClick={issue} type="button">{busy ? "處理中…" : "送出正式報價並寄給客戶"}</button>
      {!canManage && <p className="admin-muted">只有 manager 以上可以送出正式報價。</p>}
      <div className="admin-inline-actions">
        <button className="text-button" disabled={!canManage} onClick={() => setStatus("needs_info")} type="button">標記為待補件</button>
        <button className="text-button" disabled={!canManage} onClick={() => setStatus("contacted")} type="button">標記為審核中</button>
        <button className="text-button" disabled={!canManage} onClick={() => window.confirm("確定關閉這筆需求？") && setStatus("closed")} type="button">關閉／取消需求</button>
      </div>
    </section>}

    {link && <div className="admin-callout"><span>客戶確認連結（3 天內有效）：</span><input readOnly value={link} /><button className="button button-secondary" onClick={() => { navigator.clipboard.writeText(link); setMessage("已複製確認連結。"); }} type="button">複製連結</button></div>}
    <p aria-live="polite" className="form-message">{message}</p>

    {quotes.length > 0 && <section className="admin-card"><h2>報價紀錄</h2><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>報價編號</th><th>版本</th><th>金額</th><th>交貨日</th><th>建立</th><th>有效至</th><th>Email</th><th>狀態</th><th /></tr></thead><tbody>
      {quotes.map((quote) => { const status = quoteEffectiveStatus(quote); return <tr key={quote.id}><td>{quote.quote_no}</td><td>v{quote.version}</td><td>{money(quote.total)}</td><td>{quote.delivery_date}</td><td>{dateTime(quote.created_at)}</td><td>{dateTime(quote.valid_until)}</td><td>{quote.email_sent_at ? "已寄出" : "未寄出"}</td><td><span className={`admin-badge is-${status}`}>{quoteStatusLabels[status]}</span>{quote.accepted_at && <small>{dateTime(quote.accepted_at)}</small>}</td><td>{status === "sent" && canManage && <button className="text-button" onClick={() => revoke(quote.id)} type="button">撤回</button>}</td></tr>; })}
    </tbody></table></div><p className="admin-muted">確認連結只在建立當下顯示；若客戶遺失連結，請重新送出報價（會建立新版本，舊連結失效）。</p></section>}
  </>;
}
