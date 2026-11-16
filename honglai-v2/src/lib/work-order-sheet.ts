// 工作單內容（PDF 列印與 Excel 匯出共用同一份資料，確保兩者一致）。
// 鴻萊沒有既有工作單範本，此為系統標準格式。
import { specRows } from "@/lib/spec-labels";
import { workOrderStatusLabels } from "@/lib/admin-labels";

export type WorkOrderSnapshot = {
  inquiry_no?: string;
  customer?: { customer_type?: string; contact_name?: string; organization?: string | null; phone?: string; email?: string; line_id?: string | null };
  delivery?: { method?: string | null; address?: string | null; shipping?: { label?: string; district?: string } | null };
  customer_notes?: string | null;
  expected_date?: string | null;
  items?: { product_name: string; product_slug: string; quantity: number; specifications: Record<string, string> }[];
  attachments?: { name: string; size: number }[];
  quote?: { quote_no: string; version: number; items: { label: string; unitPrice: number; quantity: number; unit: string; amount: number }[]; shipping_fee: number; subtotal: number; total: number; delivery_date: string; notes: string | null; accepted_at: string };
};

export type WorkOrderRecord = {
  work_order_no: string; status: string; created_at: string; due_date: string | null; assignee: string | null; production_notes: string | null;
  confirmed_at: string | null; snapshot: WorkOrderSnapshot; orders: { order_no: string } | null;
};

export type SheetValue = string | number | Date | null;
export type SheetSection = { title: string; rows: [string, SheetValue][] };
export type SheetPrices = { header: string[]; rows: [string, number, number, string, number][]; footer: [string, number][] };

const asDate = (value: string | null | undefined) => value ? new Date(value.length === 10 ? `${value}T00:00:00+08:00` : value) : null;

export function buildWorkOrderSheet(record: WorkOrderRecord) {
  const snap = record.snapshot;
  const item = snap.items?.[0];
  const specs = item ? specRows(item.product_slug, item.specifications) : [];
  const pick = (label: string) => specs.find(([key]) => key === label)?.[1] ?? null;
  const coverKeys = ["封面材質", "封面", "封面封底", "封面顏色／樣品編號", "選擇的樣品", "封面燙金", "燙金內容", "封底燙校徽"];
  const sections: SheetSection[] = [
    { title: "基本資料", rows: [["工作單編號", record.work_order_no], ["訂單編號", record.orders?.order_no ?? ""], ["需求編號", snap.inquiry_no ?? ""], ["建立日期", asDate(record.created_at)], ["客戶名稱", snap.customer?.organization || snap.customer?.contact_name || ""], ["聯絡人", snap.customer?.contact_name ?? ""], ["電話", snap.customer?.phone ?? ""]] },
    { title: "產品資料", rows: [["商品", item?.product_name ?? ""], ["尺寸", pick("成品尺寸") ?? pick("原稿 → 成品尺寸") ?? pick("原圖 → 成品尺寸") ?? pick("圖面尺寸")], ["數量", item?.quantity ?? null]] },
    { title: "封面資訊", rows: specs.filter(([label]) => coverKeys.includes(label)) },
    { title: "裝訂與加工", rows: specs.filter(([label]) => !coverKeys.includes(label) && !["成品尺寸"].includes(label)) },
    { title: "製作管理", rows: [["交貨日期", asDate(record.due_date ?? snap.quote?.delivery_date)], ["配送方式", [snap.delivery?.shipping?.label ?? snap.delivery?.method, snap.delivery?.shipping?.district].filter(Boolean).join("・")], ["配送地址", snap.delivery?.address ?? ""], ["負責人", record.assignee ?? ""], ["製作進度", workOrderStatusLabels[record.status] ?? record.status], ["客戶備註", snap.customer_notes ?? ""], ["報價備註", snap.quote?.notes ?? ""], ["內部製作備註", record.production_notes ?? ""], ["附件", (snap.attachments ?? []).map((file) => file.name).join("、")]] },
  ];
  const prices: SheetPrices = {
    header: ["項目", "單價", "數量", "單位", "小計"],
    rows: (snap.quote?.items ?? []).map((line) => [line.label, line.unitPrice, line.quantity, line.unit, line.amount]),
    footer: [["商品小計", snap.quote?.subtotal ?? 0], ["運費", snap.quote?.shipping_fee ?? 0], ["合計（未稅）", snap.quote?.total ?? 0]],
  };
  return { sections: sections.filter((section) => section.rows.length), prices, quoteNo: snap.quote?.quote_no ?? "" };
}

export function displayValue(value: SheetValue) {
  if (value instanceof Date) return new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
  return value === null || value === "" ? "—" : String(value);
}

export async function downloadWorkOrderExcel(record: WorkOrderRecord) {
  const { sections, prices, quoteNo } = buildWorkOrderSheet(record);
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "鴻萊興業";
  const sheet = workbook.addWorksheet("工作單", { pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
  sheet.columns = [{ width: 22 }, { width: 14 }, { width: 10 }, { width: 8 }, { width: 14 }];
  const title = sheet.addRow([`鴻萊興業 工作單 ${record.work_order_no}`]);
  title.font = { bold: true, size: 16 };
  sheet.mergeCells(title.number, 1, title.number, 5);
  for (const section of sections) {
    sheet.addRow([]);
    const head = sheet.addRow([section.title]);
    head.font = { bold: true, color: { argb: "FFFFFFFF" } };
    head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D6F66" } };
    sheet.mergeCells(head.number, 1, head.number, 5);
    for (const [label, value] of section.rows) {
      const row = sheet.addRow([label, value ?? ""]);
      sheet.mergeCells(row.number, 2, row.number, 5);
      row.getCell(1).font = { bold: true };
      row.getCell(2).alignment = { wrapText: true, vertical: "top" };
      if (value instanceof Date) row.getCell(2).numFmt = "yyyy/mm/dd";
    }
  }
  sheet.addRow([]);
  const priceHead = sheet.addRow([`報價明細 ${quoteNo}`]);
  priceHead.font = { bold: true, color: { argb: "FFFFFFFF" } };
  priceHead.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D6F66" } };
  sheet.mergeCells(priceHead.number, 1, priceHead.number, 5);
  sheet.addRow(prices.header).font = { bold: true };
  for (const line of prices.rows) {
    const row = sheet.addRow(line);
    row.getCell(2).numFmt = "#,##0.##"; row.getCell(5).numFmt = "#,##0";
    row.getCell(1).alignment = { wrapText: true };
  }
  for (const [label, amount] of prices.footer) {
    const row = sheet.addRow([label, null, null, null, amount]);
    row.font = { bold: true }; row.getCell(5).numFmt = "#,##0";
  }
  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const link = document.createElement("a");
  link.href = url; link.download = `${record.work_order_no}.xlsx`;
  document.body.append(link); link.click(); link.remove();
  URL.revokeObjectURL(url);
}
