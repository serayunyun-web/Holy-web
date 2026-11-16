"use client";

import { ADMIN_BASE } from "@/lib/admin-path";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/components/admin/admin-shell";
import { callPublicFunction, supabaseBrowser } from "@/lib/supabase-public-api";
import { dateTime, money, workOrderStatusLabels } from "@/lib/admin-labels";
import { formatBytes } from "@/lib/attachments";
import { buildWorkOrderSheet, displayValue, downloadWorkOrderExcel, type WorkOrderRecord } from "@/lib/work-order-sheet";

type Row = Omit<WorkOrderRecord, "orders"> & {
  id: string; confirmation_email_sent_at: string | null;
  orders: { order_no: string; paid_at: string | null; customer_email_sent_at: string | null } | null;
  work_order_status_history: { to_status: string; created_at: string }[];
};
type Attachment = { name: string; size: number; path?: string };
const nextStatus: Record<string, string> = { scheduled: "in_production", in_production: "completed", completed: "delivered" };
const confirmErrors: Record<string, string> = { forbidden: "確認訂單需要 manager 以上權限。", already_confirmed: "這筆訂單已經確認過了。", "invalid:due_date": "請填寫交期。" };

export function AdminWorkOrder() {
  const { session, canManage } = useAdmin();
  const [record, setRecord] = useState<Row | null>(null);
  const [loadError, setLoadError] = useState("");
  const [assignee, setAssignee] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) { setLoadError("缺少訂單編號。"); return; }
    const { data, error } = await supabaseBrowser().from("work_orders").select("*, orders(order_no, paid_at, customer_email_sent_at), work_order_status_history(to_status, created_at)").eq("id", id).single();
    if (error || !data) { setLoadError("找不到這筆訂單，或沒有讀取權限。"); return; }
    const row = data as unknown as Row;
    setRecord(row); setAssignee(row.assignee ?? ""); setNotes(row.production_notes ?? ""); setDueDate(row.due_date ?? "");
  }, []);
  useEffect(() => { const timer = window.setTimeout(load, 0); return () => window.clearTimeout(timer); }, [load]);

  if (loadError) return <p className="admin-empty">{loadError} <Link href={`${ADMIN_BASE}/`}>回列表</Link></p>;
  if (!record) return <p className="admin-empty">載入中…</p>;

  const sheet = buildWorkOrderSheet({ ...record, assignee: assignee || null, production_notes: notes || null });
  const pending = record.status === "pending_confirmation";
  const next = nextStatus[record.status];
  const paid = Boolean(record.snapshot.payment);
  const attachments = (record.snapshot.attachments ?? []) as Attachment[];

  const sendEmail = async (kind: "paid" | "confirmed") => {
    const result = await callPublicFunction<{ sent: boolean; to: string }>("send-order-email", { workOrderId: record.id, kind }, session.access_token);
    return result.sent ? `已寄到 ${result.to}。` : "Email 尚未設定或寄送失敗，請稍後重寄。";
  };

  const confirm = async () => {
    if (busy) return;
    if (!dueDate) { setMessage("請先填寫交期。"); return; }
    setBusy(true); setMessage("正在確認訂單…");
    const { error } = await supabaseBrowser().rpc("confirm_work_order", { p_work_order_id: record.id, p_due_date: dueDate });
    if (error) { setBusy(false); setMessage(confirmErrors[error.message] ?? "確認失敗，請稍後再試。"); return; }
    if (assignee.trim()) await supabaseBrowser().rpc("update_work_order", { p_work_order_id: record.id, p_status: "scheduled", p_assignee: assignee, p_production_notes: notes });
    let mail = "";
    try { mail = `交期通知${await sendEmail("confirmed")}`; } catch { mail = "交期通知寄送失敗，請按「重寄交期通知」。"; }
    setBusy(false); setMessage(`訂單已確認。${mail}`);
    load();
  };

  const resend = async (kind: "paid" | "confirmed") => {
    if (busy) return;
    setBusy(true);
    try { setMessage(`${kind === "paid" ? "訂單明細" : "交期通知"}${await sendEmail(kind)}`); } catch { setMessage("寄送失敗，請稍後再試。"); }
    setBusy(false);
    load();
  };

  const save = async (status: string) => {
    if (busy) return;
    setBusy(true);
    const { error } = await supabaseBrowser().rpc("update_work_order", { p_work_order_id: record.id, p_status: status, p_assignee: assignee, p_production_notes: notes });
    setBusy(false);
    setMessage(error ? (error.message === "forbidden" ? "需要 manager 以上權限。" : "更新失敗，請稍後再試。") : "已儲存。");
    if (!error) load();
  };

  const download = async (path: string) => {
    const { data, error } = await supabaseBrowser().storage.from("inquiry-files").createSignedUrl(path, 300);
    if (error || !data) { setMessage("檔案下載連結建立失敗。"); return; }
    window.open(data.signedUrl, "_blank", "noopener");
  };

  return <>
    <div className="admin-heading no-print"><div><Link href={`${ADMIN_BASE}/`}>← 回列表</Link><h1 className="admin-title">訂單 {record.orders?.order_no}</h1></div><span className={`admin-badge is-${record.status}`}>{workOrderStatusLabels[record.status]}</span></div>

    <section className="admin-card no-print">
      <h2>{pending ? "確認訂單內容" : "訂單處理"}</h2>
      <dl className="admin-dl">
        <div><dt>付款</dt><dd>{paid ? `${record.snapshot.payment?.method ?? "LINE Pay（示範）"}・已付款 ${dateTime(record.orders?.paid_at)}` : "正式報價確認（未線上付款）"}</dd></div>
        <div><dt>訂單明細信</dt><dd>{record.orders?.customer_email_sent_at ? `已寄出 ${dateTime(record.orders.customer_email_sent_at)}` : "未寄出"} {paid && <button className="text-button" disabled={busy} onClick={() => resend("paid")} type="button">重寄</button>}</dd></div>
        {!pending && <div><dt>交期通知</dt><dd>{record.confirmation_email_sent_at ? `已寄出 ${dateTime(record.confirmation_email_sent_at)}` : "未寄出"} {canManage && <button className="text-button" disabled={busy} onClick={() => resend("confirmed")} type="button">重寄交期通知</button>}</dd></div>}
        {record.confirmed_at && <div><dt>確認時間</dt><dd>{dateTime(record.confirmed_at)}</dd></div>}
      </dl>
      {attachments.length > 0 && <><h3>附件</h3><ul className="admin-files">{attachments.map((file) => <li key={file.name}>{file.path ? <button className="text-button" onClick={() => download(file.path!)} type="button">{file.name}</button> : <span>{file.name}</span>}<small>{formatBytes(file.size)}</small></li>)}</ul></>}

      {pending ? <>
        <p className="admin-muted">請核對下方訂單內容（規格、數量、金額、配送）。確認後會寄交期通知給客人。</p>
        <div className="admin-form-row">
          <label>交期<input onChange={(event) => setDueDate(event.target.value)} type="date" value={dueDate} /></label>
          <label>負責人（內部）<input onChange={(event) => setAssignee(event.target.value)} value={assignee} /></label>
        </div>
        <div className="admin-inline-actions">
          <button className="button button-primary" disabled={busy || !canManage} onClick={confirm} type="button">{busy ? "處理中…" : "確認訂單並寄交期通知"}</button>
        </div>
        {!canManage && <p className="admin-muted">確認訂單需要 manager 以上權限。</p>}
      </> : <>
        <div className="admin-form-row">
          <label>負責人<input onChange={(event) => setAssignee(event.target.value)} value={assignee} /></label>
          <label className="admin-wide">內部製作備註<textarea onChange={(event) => setNotes(event.target.value)} rows={2} value={notes} /></label>
        </div>
        <div className="admin-inline-actions">
          {next && <button className="button button-primary" disabled={busy} onClick={() => save(next)} type="button">改為「{workOrderStatusLabels[next]}」</button>}
          <button className="button button-secondary" disabled={busy} onClick={() => save(record.status)} type="button">只儲存負責人與備註</button>
        </div>
      </>}
      <div className="admin-inline-actions">
        <button className="button button-secondary" onClick={() => window.print()} type="button">列印工作單／存成 PDF</button>
        <button className="button button-secondary" onClick={() => downloadWorkOrderExcel({ ...record, assignee: assignee || null, production_notes: notes || null }).catch(() => setMessage("Excel 產生失敗。"))} type="button">下載 Excel</button>
      </div>
      <p aria-live="polite" className="form-message">{message}</p>
    </section>

    <article className="work-order-sheet">
      <header><div><p>鴻萊興業</p><h2>工作單</h2></div><div><strong>{record.work_order_no}</strong><span>{workOrderStatusLabels[record.status]}</span></div></header>
      {sheet.sections.map((section) => <section key={section.title}><h3>{section.title}</h3><dl>{section.rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{displayValue(value)}</dd></div>)}</dl></section>)}
      <section><h3>{sheet.quoteNo ? `報價明細 ${sheet.quoteNo}` : "金額明細"}</h3><table><thead><tr>{sheet.prices.header.map((head) => <th key={head}>{head}</th>)}</tr></thead>
        <tbody>{sheet.prices.rows.map((row, index) => <tr key={index}><td>{row[0]}</td><td>{money(row[1])}</td><td>{row[2]}</td><td>{row[3]}</td><td>{money(row[4])}</td></tr>)}</tbody>
        <tfoot>{sheet.prices.footer.map(([label, amount]) => <tr key={label}><th colSpan={4}>{label}</th><td>{money(amount)}</td></tr>)}</tfoot></table></section>
      <footer><span>製作確認：＿＿＿＿＿＿</span><span>品檢：＿＿＿＿＿＿</span><span>出貨：＿＿＿＿＿＿</span></footer>
    </article>

    {record.work_order_status_history.length > 0 && <section className="admin-card no-print"><h2>進度紀錄</h2><ul className="admin-files">{[...record.work_order_status_history].sort((a, b) => a.created_at.localeCompare(b.created_at)).map((entry, index) => <li key={index}><span>{workOrderStatusLabels[entry.to_status]}</span><small>{dateTime(entry.created_at)}</small></li>)}</ul></section>}
  </>;
}
