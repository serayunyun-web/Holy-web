// 交易 Email（Resend）。未設定 RESEND_API_KEY／EMAIL_FROM 時不寄送，呼叫端照常完成流程並回報未寄出。
import type { PriceLine } from "./pricing.ts";

export function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));
}

const money = (value: number) => `NT$${Number(value).toLocaleString("zh-TW")}`;

export async function sendEmail(input: { to: string; subject: string; html: string }) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("EMAIL_FROM");
  if (!apiKey || !from) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ from, to: [input.to], subject: input.subject, html: input.html, reply_to: Deno.env.get("EMAIL_REPLY_TO") || undefined }),
    });
    if (!response.ok) console.error("sendEmail", response.status, await response.text());
    return response.ok;
  } catch (error) {
    console.error("sendEmail", error);
    return false;
  }
}

function layout(title: string, body: string) {
  return `<!doctype html><html lang="zh-Hant"><body style="margin:0;background:#f4f2ec;font-family:'Noto Sans TC','PingFang TC','Microsoft JhengHei',sans-serif;color:#26332f">
<div style="max-width:640px;margin:0 auto;padding:24px"><div style="background:#fff;border-radius:16px;padding:28px;border:1px solid #ddd6ca">
<p style="margin:0 0 4px;color:#8a6a4a;font-size:12px;letter-spacing:.12em">鴻萊興業</p><h1 style="margin:0 0 18px;font-size:22px">${escapeHtml(title)}</h1>${body}
<p style="margin:24px 0 0;color:#7b857f;font-size:12px">此信由系統自動寄出。如有疑問請直接回覆此信或來電 04-2471-3063。</p></div></div></body></html>`;
}

function table(rows: [string, string][]) {
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows.map(([label, value]) => `<tr><th style="text-align:left;width:34%;padding:8px;border-bottom:1px solid #eee;color:#5c6b66;font-weight:600">${escapeHtml(label)}</th><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(value)}</td></tr>`).join("")}</table>`;
}

function priceTable(lines: { label: string; unitPrice: number; quantity: number; unit: string; amount: number }[], footer: [string, string][]) {
  const head = `<tr style="background:#f1f5f2"><th style="text-align:left;padding:8px">項目</th><th style="text-align:right;padding:8px">單價</th><th style="text-align:right;padding:8px">數量</th><th style="text-align:right;padding:8px">小計</th></tr>`;
  const body = lines.map((item) => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(item.label)}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${money(item.unitPrice)}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${escapeHtml(item.quantity)} ${escapeHtml(item.unit)}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${money(item.amount)}</td></tr>`).join("");
  const foot = footer.map(([label, value], index) => `<tr><th colspan="3" style="text-align:right;padding:8px;${index === footer.length - 1 ? "font-size:16px" : ""}">${escapeHtml(label)}</th><td style="text-align:right;padding:8px;${index === footer.length - 1 ? "font-size:16px;font-weight:700" : ""}">${escapeHtml(value)}</td></tr>`).join("");
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:16px">${head}${body}${foot}</table>`;
}

export function trialQuoteEmail(input: {
  referenceNo: string; contactName: string; productName: string; quantity: number; specs: [string, string][];
  estimate: { status: string; lines: PriceLine[]; subtotal: number | null; total: number | null; shipping: { label: string; fee: number } | null; reason?: string };
  disclaimer: string;
}) {
  const priced = input.estimate.status === "priced";
  const intro = `<p style="font-size:14px;line-height:1.8">${escapeHtml(input.contactName)} 您好，我們已收到您的製作需求（需求編號 <strong>${escapeHtml(input.referenceNo)}</strong>）。${priced ? "以下為系統依價目表產生的試算報價單。" : "此需求需由專人報價，確認後會再寄出正式報價。"}</p>`;
  const specs = table([["產品", input.productName], ["數量", `${input.quantity} 本`], ...input.specs]);
  const prices = priced ? priceTable(input.estimate.lines, [
    ["商品小計", money(input.estimate.subtotal ?? 0)],
    [`運費${input.estimate.shipping ? `（${input.estimate.shipping.label}）` : ""}`, input.estimate.shipping ? money(input.estimate.shipping.fee) : "—"],
    ["試算合計（未稅）", input.estimate.total === null ? "—" : money(input.estimate.total)],
  ]) : `<p style="font-size:14px;color:#8a4e39">${escapeHtml(input.estimate.reason ?? "")}</p>`;
  const next = `<p style="font-size:13px;line-height:1.8;background:#f3f7f5;padding:12px;border-radius:8px">${escapeHtml(input.disclaimer)}<br>專人確認規格、金額與交期後，會再寄出「正式報價單」與確認連結（有效期限 3 天）。送出需求不代表訂單成立。</p>`;
  return layout(priced ? "系統試算報價單" : "已收到您的製作需求", intro + specs + prices + next);
}

export function formalQuoteEmail(input: {
  quoteNo: string; contactName: string; productName: string; quantity: number; specs: [string, string][];
  items: { label: string; unitPrice: number; quantity: number; unit: string; amount: number }[];
  subtotal: number; shippingFee: number; total: number; deliveryDate: string; validUntil: string; notes: string | null; link: string;
}) {
  const intro = `<p style="font-size:14px;line-height:1.8">${escapeHtml(input.contactName)} 您好，以下是您的正式報價（報價編號 <strong>${escapeHtml(input.quoteNo)}</strong>）。請於 <strong>${escapeHtml(input.validUntil)}</strong> 前點選下方按鈕確認，確認後訂單即成立並開始安排製作。</p>`;
  const specs = table([["產品", input.productName], ["數量", `${input.quantity} 本`], ...input.specs, ["預計交貨日", input.deliveryDate], ...(input.notes ? [["製作備註", input.notes] as [string, string]] : [])]);
  const prices = priceTable(input.items, [["商品小計", money(input.subtotal)], ["運費", money(input.shippingFee)], ["正式報價合計（未稅）", money(input.total)]]);
  const button = `<p style="text-align:center;margin:24px 0"><a href="${escapeHtml(input.link)}" style="display:inline-block;background:#1d6f66;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700">查看並確認報價</a></p><p style="font-size:12px;color:#7b857f;word-break:break-all">若按鈕無法開啟，請複製此網址：${escapeHtml(input.link)}</p><p style="font-size:12px;color:#7b857f">此為正式報價確認，不是線上付款。</p>`;
  return layout("正式報價單", intro + specs + prices + button);
}
