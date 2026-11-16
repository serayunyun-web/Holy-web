"use client";

import { ADMIN_BASE } from "@/lib/admin-path";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-public-api";
import { dateTime, inquiryStatusLabels, money, paymentStatusLabels, workOrderStatusLabels } from "@/lib/admin-labels";

type InquiryRow = {
  id: string; inquiry_no: string; created_at: string; updated_at: string; contact_name: string; organization: string | null; status: string; estimate_total: number | null; payment_status: string;
  manual_inquiry_items: { product_name: string; quantity: number }[]; quotes: { total: number; version: number; status: string }[];
};
type WorkOrderRow = {
  id: string; work_order_no: string; status: string; due_date: string | null; assignee: string | null; created_at: string; updated_at: string;
  snapshot: { customer?: { contact_name?: string; organization?: string }; items?: { product_name: string; quantity: number }[] };
  orders: { order_no: string; total: number; paid_at: string | null } | null;
};

// 未付款清單：送出後還沒付款成功、也還沒成立訂單或關閉的需求。
const isUnpaidOpen = (row: InquiryRow) => row.payment_status !== "paid" && !["converted", "closed"].includes(row.status);

export function AdminHome() {
  const [tab, setTab] = useState<"inquiries" | "work-orders">("work-orders");
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrderRow[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("unpaid");
  const [workStatus, setWorkStatus] = useState("all");
  const [sort, setSort] = useState<"new" | "old">("new");

  useEffect(() => {
    const client = supabaseBrowser();
    Promise.all([
      client.from("manual_inquiries").select("id, inquiry_no, created_at, updated_at, contact_name, organization, status, estimate_total, payment_status, manual_inquiry_items(product_name, quantity), quotes(total, version, status)").order("created_at", { ascending: false }).limit(500),
      client.from("work_orders").select("id, work_order_no, status, due_date, assignee, created_at, updated_at, snapshot, orders(order_no, total, paid_at)").order("created_at", { ascending: false }).limit(500),
    ]).then(([a, b]) => {
      if (a.error || b.error) setError("資料讀取失敗，請確認帳號權限或稍後再試。");
      setInquiries((a.data ?? []) as unknown as InquiryRow[]);
      setWorkOrders((b.data ?? []) as unknown as WorkOrderRow[]);
    });
  }, []);

  const counts = {
    confirm: workOrders.filter((row) => row.status === "pending_confirmation").length,
    unpaid: inquiries.filter(isUnpaidOpen).length,
    producing: workOrders.filter((row) => ["scheduled", "in_production"].includes(row.status)).length,
    done: workOrders.filter((row) => ["completed", "delivered"].includes(row.status)).length,
  };

  const keyword = search.trim().toLowerCase();
  const filteredInquiries = useMemo(() => inquiries.filter((row) => {
    if (status === "unpaid" && !isUnpaidOpen(row)) return false;
    if (status !== "unpaid" && status !== "all" && row.status !== status) return false;
    return !keyword || [row.inquiry_no, row.contact_name, row.organization ?? "", row.manual_inquiry_items[0]?.product_name ?? ""].some((value) => value.toLowerCase().includes(keyword));
  }).sort((a, b) => sort === "new" ? b.created_at.localeCompare(a.created_at) : a.created_at.localeCompare(b.created_at)), [inquiries, status, keyword, sort]);
  const filteredWorkOrders = useMemo(() => workOrders.filter((row) => {
    if (workStatus === "pending" && row.status !== "pending_confirmation") return false;
    if (workStatus === "producing" && !["scheduled", "in_production"].includes(row.status)) return false;
    if (workStatus === "done" && !["completed", "delivered"].includes(row.status)) return false;
    return !keyword || [row.work_order_no, row.orders?.order_no ?? "", row.snapshot.customer?.contact_name ?? "", row.snapshot.customer?.organization ?? ""].some((value) => value.toLowerCase().includes(keyword));
  }).sort((a, b) => sort === "new" ? b.created_at.localeCompare(a.created_at) : a.created_at.localeCompare(b.created_at)), [workOrders, workStatus, keyword, sort]);

  const card = (label: string, value: number, onClick: () => void) => <button className="admin-stat" onClick={onClick} type="button"><strong>{value}</strong><span>{label}</span></button>;

  return <>
    <h1 className="admin-title">後台首頁</h1>
    {error && <p className="form-message">{error}</p>}
    <div className="admin-stats">
      {card("已付款・待確認訂單", counts.confirm, () => { setTab("work-orders"); setWorkStatus("pending"); })}
      {card("製作中", counts.producing, () => { setTab("work-orders"); setWorkStatus("producing"); })}
      {card("已完成／已交付", counts.done, () => { setTab("work-orders"); setWorkStatus("done"); })}
      {card("未付款／付款失敗", counts.unpaid, () => { setTab("inquiries"); setStatus("unpaid"); })}
    </div>
    <div className="admin-toolbar">
      <div className="admin-tabs" role="tablist"><button aria-selected={tab === "work-orders"} onClick={() => setTab("work-orders")} role="tab" type="button">已付款訂單</button><button aria-selected={tab === "inquiries"} onClick={() => setTab("inquiries")} role="tab" type="button">未付款與全部送出紀錄</button></div>
      <input aria-label="搜尋" onChange={(event) => setSearch(event.target.value)} placeholder="搜尋編號、客戶、公司、產品" value={search} />
      {tab === "inquiries" ? <select aria-label="狀態篩選" onChange={(event) => setStatus(event.target.value)} value={status}><option value="unpaid">未付款／付款失敗</option><option value="all">全部</option>{Object.entries(inquiryStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        : <select aria-label="訂單狀態篩選" onChange={(event) => setWorkStatus(event.target.value)} value={workStatus}><option value="all">全部訂單</option><option value="pending">待確認</option><option value="producing">製作中</option><option value="done">已完成／已交付</option></select>}
      <select aria-label="排序" onChange={(event) => setSort(event.target.value as "new" | "old")} value={sort}><option value="new">最新在前</option><option value="old">最舊在前</option></select>
    </div>

    {tab === "inquiries" ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>訂單編號</th><th>建立</th><th>客戶</th><th>商品</th><th>數量</th><th>金額</th><th>付款</th><th>狀態</th></tr></thead><tbody>
      {filteredInquiries.map((row) => {
        const latest = [...row.quotes].sort((a, b) => b.version - a.version)[0];
        return <tr key={row.id}><td><Link href={`${ADMIN_BASE}/inquiry/?id=${row.id}`}>{row.inquiry_no}</Link></td><td>{dateTime(row.created_at)}</td><td>{row.contact_name}{row.organization && <small>{row.organization}</small>}</td><td>{row.manual_inquiry_items[0]?.product_name}</td><td>{row.manual_inquiry_items[0]?.quantity}</td><td>{latest ? `${money(latest.total)}（報價）` : money(row.estimate_total)}</td><td><span className={`admin-badge is-payment-${row.payment_status}`}>{paymentStatusLabels[row.payment_status] ?? row.payment_status}</span></td><td><span className={`admin-badge is-${row.status}`}>{inquiryStatusLabels[row.status] ?? row.status}</span></td></tr>;
      })}
      {!filteredInquiries.length && <tr><td className="admin-empty" colSpan={8}>沒有符合條件的紀錄。</td></tr>}
    </tbody></table></div>
      : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>訂單編號</th><th>工作單</th><th>付款時間</th><th>客戶</th><th>商品</th><th>金額</th><th>交期</th><th>狀態</th></tr></thead><tbody>
        {filteredWorkOrders.map((row) => <tr key={row.id}><td><Link href={`${ADMIN_BASE}/work-order/?id=${row.id}`}>{row.orders?.order_no}</Link></td><td>{row.work_order_no}</td><td>{dateTime(row.orders?.paid_at)}</td><td>{row.snapshot.customer?.contact_name}{row.snapshot.customer?.organization && <small>{row.snapshot.customer.organization}</small>}</td><td>{row.snapshot.items?.[0]?.product_name} × {row.snapshot.items?.[0]?.quantity}</td><td>{money(row.orders?.total)}</td><td>{row.due_date ?? "—"}</td><td><span className={`admin-badge is-${row.status}`}>{workOrderStatusLabels[row.status]}</span></td></tr>)}
        {!filteredWorkOrders.length && <tr><td className="admin-empty" colSpan={8}>目前沒有訂單。客人付款成功後會自動出現在這裡。</td></tr>}
      </tbody></table></div>}
  </>;
}
