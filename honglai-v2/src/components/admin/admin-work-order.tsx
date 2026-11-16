"use client";

import { ADMIN_BASE } from "@/lib/admin-path";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/components/admin/admin-shell";
import { supabaseBrowser } from "@/lib/supabase-public-api";
import { dateTime, money, workOrderStatusLabels } from "@/lib/admin-labels";
import { buildWorkOrderSheet, displayValue, downloadWorkOrderExcel, type WorkOrderRecord } from "@/lib/work-order-sheet";

type Row = WorkOrderRecord & { id: string; work_order_status_history: { to_status: string; created_at: string }[] };
const nextStatus: Record<string, string> = { scheduled: "in_production", in_production: "completed", completed: "delivered" };

export function AdminWorkOrder() {
  const { canManage } = useAdmin();
  const [record, setRecord] = useState<Row | null>(null);
  const [loadError, setLoadError] = useState("");
  const [assignee, setAssignee] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) { setLoadError("缺少工作單編號。"); return; }
    const { data, error } = await supabaseBrowser().from("work_orders").select("*, orders(order_no), work_order_status_history(to_status, created_at)").eq("id", id).single();
    if (error || !data) { setLoadError("找不到這張工作單，或沒有讀取權限。"); return; }
    const row = data as unknown as Row;
    setRecord(row); setAssignee(row.assignee ?? ""); setNotes(row.production_notes ?? "");
  }, []);
  useEffect(() => { const timer = window.setTimeout(load, 0); return () => window.clearTimeout(timer); }, [load]);

  if (loadError) return <p className="admin-empty">{loadError} <Link href={`${ADMIN_BASE}/`}>回列表</Link></p>;
  if (!record) return <p className="admin-empty">載入中…</p>;

  const sheet = buildWorkOrderSheet({ ...record, assignee: assignee || null, production_notes: notes || null });
  const save = async (status: string) => {
    if (busy) return;
    setBusy(true);
    const { error } = await supabaseBrowser().rpc("update_work_order", { p_work_order_id: record.id, p_status: status, p_assignee: assignee, p_production_notes: notes });
    setBusy(false);
    setMessage(error ? (error.message === "forbidden" ? "確認工作單需要 manager 以上權限。" : "更新失敗，請稍後再試。") : "已儲存。");
    if (!error) load();
  };
  const pending = record.status === "pending_confirmation";
  const next = nextStatus[record.status];

  return <>
    <div className="admin-heading no-print"><div><Link href={`${ADMIN_BASE}/`}>← 回列表</Link><h1 className="admin-title">工作單 {record.work_order_no}</h1></div><span className={`admin-badge is-${record.status}`}>{workOrderStatusLabels[record.status]}</span></div>

    <section className="admin-card no-print">
      <div className="admin-form-row">
        <label>負責人<input onChange={(event) => setAssignee(event.target.value)} value={assignee} /></label>
        <label className="admin-wide">內部製作備註<textarea onChange={(event) => setNotes(event.target.value)} rows={2} value={notes} /></label>
      </div>
      <div className="admin-inline-actions">
        {pending ? <button className="button button-primary" disabled={busy || !canManage} onClick={() => save("scheduled")} type="button">確認工作單（內部）</button>
          : next && <button className="button button-primary" disabled={busy} onClick={() => save(next)} type="button">改為「{workOrderStatusLabels[next]}」</button>}
        <button className="button button-secondary" disabled={busy} onClick={() => save(record.status)} type="button">只儲存負責人與備註</button>
        <button className="button button-secondary" onClick={() => window.print()} type="button">列印／存成 PDF</button>
        <button className="button button-secondary" onClick={() => downloadWorkOrderExcel({ ...record, assignee: assignee || null, production_notes: notes || null }).catch(() => setMessage("Excel 產生失敗。"))} type="button">下載 Excel</button>
      </div>
      {pending && !canManage && <p className="admin-muted">工作單需由 manager 以上人員確認後才能開始安排製作。</p>}
      <p className="admin-muted">PDF：按「列印／存成 PDF」，印表機選「另存為 PDF」，紙張 A4。{record.confirmed_at && `內部確認時間：${dateTime(record.confirmed_at)}`}</p>
      <p aria-live="polite" className="form-message">{message}</p>
    </section>

    <article className="work-order-sheet">
      <header><div><p>鴻萊興業</p><h2>工作單</h2></div><div><strong>{record.work_order_no}</strong><span>{workOrderStatusLabels[record.status]}</span></div></header>
      {sheet.sections.map((section) => <section key={section.title}><h3>{section.title}</h3><dl>{section.rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{displayValue(value)}</dd></div>)}</dl></section>)}
      <section><h3>報價明細 {sheet.quoteNo}</h3><table><thead><tr>{sheet.prices.header.map((head) => <th key={head}>{head}</th>)}</tr></thead>
        <tbody>{sheet.prices.rows.map((row, index) => <tr key={index}><td>{row[0]}</td><td>{money(row[1])}</td><td>{row[2]}</td><td>{row[3]}</td><td>{money(row[4])}</td></tr>)}</tbody>
        <tfoot>{sheet.prices.footer.map(([label, amount]) => <tr key={label}><th colSpan={4}>{label}</th><td>{money(amount)}</td></tr>)}</tfoot></table></section>
      <footer><span>製作確認：＿＿＿＿＿＿</span><span>品檢：＿＿＿＿＿＿</span><span>出貨：＿＿＿＿＿＿</span></footer>
    </article>

    {record.work_order_status_history.length > 0 && <section className="admin-card no-print"><h2>進度紀錄</h2><ul className="admin-files">{[...record.work_order_status_history].sort((a, b) => a.created_at.localeCompare(b.created_at)).map((entry, index) => <li key={index}><span>{workOrderStatusLabels[entry.to_status]}</span><small>{dateTime(entry.created_at)}</small></li>)}</ul></section>}
  </>;
}
