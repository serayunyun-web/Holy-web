"use client";

import { ADMIN_BASE } from "@/lib/admin-path";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-public-api";
import { dateTime, inquiryStatusLabels, money, workOrderStatusLabels } from "@/lib/admin-labels";

type InquiryRow = {
  id: string; inquiry_no: string; created_at: string; updated_at: string; contact_name: string; organization: string | null; status: string; estimate_total: number | null;
  manual_inquiry_items: { product_name: string; quantity: number }[]; quotes: { total: number; version: number; status: string }[];
};
type WorkOrderRow = {
  id: string; work_order_no: string; status: string; due_date: string | null; assignee: string | null; created_at: string; updated_at: string;
  snapshot: { customer?: { contact_name?: string; organization?: string }; items?: { product_name: string; quantity: number }[] }; orders: { order_no: string; total: number } | null;
};

export function AdminHome() {
  const [tab, setTab] = useState<"inquiries" | "work-orders">("inquiries");
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrderRow[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("open");
  const [sort, setSort] = useState<"new" | "old">("new");

  useEffect(() => {
    const client = supabaseBrowser();
    Promise.all([
      client.from("manual_inquiries").select("id, inquiry_no, created_at, updated_at, contact_name, organization, status, estimate_total, manual_inquiry_items(product_name, quantity), quotes(total, version, status)").order("created_at", { ascending: false }).limit(500),
      client.from("work_orders").select("id, work_order_no, status, due_date, assignee, created_at, updated_at, snapshot, orders(order_no, total)").order("created_at", { ascending: false }).limit(500),
    ]).then(([a, b]) => {
      if (a.error || b.error) setError("資料讀取失敗，請確認帳號權限或稍後再試。");
      setInquiries((a.data ?? []) as unknown as InquiryRow[]);
      setWorkOrders((b.data ?? []) as unknown as WorkOrderRow[]);
    });
  }, []);

  const counts = {
    pending: inquiries.filter((row) => ["pending_review", "contacted"].includes(row.status)).length,
    needsInfo: inquiries.filter((row) => row.status === "needs_info").length,
    quoted: inquiries.filter((row) => row.status === "quoted").length,
    confirm: workOrders.filter((row) => row.status === "pending_confirmation").length,
    producing: workOrders.filter((row) => ["scheduled", "in_production"].includes(row.status)).length,
    done: workOrders.filter((row) => ["completed", "delivered"].includes(row.status)).length,
  };

  const keyword = search.trim().toLowerCase();
  const filteredInquiries = useMemo(() => inquiries.filter((row) => {
    if (status === "open" && ["converted", "closed"].includes(row.status)) return false;
    if (status !== "open" && status !== "all" && row.status !== status) return false;
    return !keyword || [row.inquiry_no, row.contact_name, row.organization ?? "", row.manual_inquiry_items[0]?.product_name ?? ""].some((value) => value.toLowerCase().includes(keyword));
  }).sort((a, b) => sort === "new" ? b.created_at.localeCompare(a.created_at) : a.created_at.localeCompare(b.created_at)), [inquiries, status, keyword, sort]);
  const filteredWorkOrders = useMemo(() => workOrders.filter((row) => !keyword || [row.work_order_no, row.orders?.order_no ?? "", row.snapshot.customer?.contact_name ?? "", row.snapshot.customer?.organization ?? ""].some((value) => value.toLowerCase().includes(keyword)))
    .sort((a, b) => sort === "new" ? b.created_at.localeCompare(a.created_at) : a.created_at.localeCompare(b.created_at)), [workOrders, keyword, sort]);

  const card = (label: string, value: number, onClick: () => void) => <button className="admin-stat" onClick={onClick} type="button"><strong>{value}</strong><span>{label}</span></button>;

  return <>
    <h1 className="admin-title">後台首頁</h1>
    {error && <p className="form-message">{error}</p>}
    <div className="admin-stats">
      {card("待處理需求", counts.pending, () => { setTab("inquiries"); setStatus("pending_review"); })}
      {card("待補件", counts.needsInfo, () => { setTab("inquiries"); setStatus("needs_info"); })}
      {card("待客戶確認報價", counts.quoted, () => { setTab("inquiries"); setStatus("quoted"); })}
      {card("工作單待內部確認", counts.confirm, () => setTab("work-orders"))}
      {card("製作中", counts.producing, () => setTab("work-orders"))}
      {card("已完成／已交付", counts.done, () => setTab("work-orders"))}
    </div>
    <div className="admin-toolbar">
      <div className="admin-tabs" role="tablist"><button aria-selected={tab === "inquiries"} onClick={() => setTab("inquiries")} role="tab" type="button">需求與報價</button><button aria-selected={tab === "work-orders"} onClick={() => setTab("work-orders")} role="tab" type="button">訂單與工作單</button></div>
      <input aria-label="搜尋" onChange={(event) => setSearch(event.target.value)} placeholder="搜尋編號、客戶、公司、產品" value={search} />
      {tab === "inquiries" && <select aria-label="狀態篩選" onChange={(event) => setStatus(event.target.value)} value={status}><option value="open">未結案</option><option value="all">全部</option>{Object.entries(inquiryStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>}
      <select aria-label="排序" onChange={(event) => setSort(event.target.value as "new" | "old")} value={sort}><option value="new">最新在前</option><option value="old">最舊在前</option></select>
    </div>

    {tab === "inquiries" ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>需求編號</th><th>建立</th><th>客戶</th><th>商品</th><th>數量</th><th>金額</th><th>狀態</th><th>最後更新</th></tr></thead><tbody>
      {filteredInquiries.map((row) => {
        const latest = [...row.quotes].sort((a, b) => b.version - a.version)[0];
        return <tr key={row.id}><td><Link href={`${ADMIN_BASE}/inquiry/?id=${row.id}`}>{row.inquiry_no}</Link></td><td>{dateTime(row.created_at)}</td><td>{row.contact_name}{row.organization && <small>{row.organization}</small>}</td><td>{row.manual_inquiry_items[0]?.product_name}</td><td>{row.manual_inquiry_items[0]?.quantity}</td><td>{latest ? `${money(latest.total)}（報價）` : row.estimate_total !== null ? `${money(row.estimate_total)}（試算）` : "專人報價"}</td><td><span className={`admin-badge is-${row.status}`}>{inquiryStatusLabels[row.status] ?? row.status}</span></td><td>{dateTime(row.updated_at)}</td></tr>;
      })}
      {!filteredInquiries.length && <tr><td className="admin-empty" colSpan={8}>沒有符合條件的需求。</td></tr>}
    </tbody></table></div>
      : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>工作單</th><th>訂單編號</th><th>客戶</th><th>商品</th><th>金額</th><th>交貨日</th><th>負責人</th><th>狀態</th></tr></thead><tbody>
        {filteredWorkOrders.map((row) => <tr key={row.id}><td><Link href={`${ADMIN_BASE}/work-order/?id=${row.id}`}>{row.work_order_no}</Link></td><td>{row.orders?.order_no}</td><td>{row.snapshot.customer?.contact_name}{row.snapshot.customer?.organization && <small>{row.snapshot.customer.organization}</small>}</td><td>{row.snapshot.items?.[0]?.product_name} × {row.snapshot.items?.[0]?.quantity}</td><td>{money(row.orders?.total)}</td><td>{row.due_date ?? "—"}</td><td>{row.assignee ?? "—"}</td><td><span className={`admin-badge is-${row.status}`}>{workOrderStatusLabels[row.status]}</span></td></tr>)}
        {!filteredWorkOrders.length && <tr><td className="admin-empty" colSpan={8}>目前沒有工作單。客戶確認正式報價後會自動產生。</td></tr>}
      </tbody></table></div>}
  </>;
}
