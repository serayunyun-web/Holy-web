// 付款後的客人版工作單信（mock-payment 與後台重寄共用）。
import { adminClient } from "./database.ts";
import { customerWorkOrderEmail, sendEmail, type OrderSnapshot } from "./email.ts";
import { specRows } from "./spec-labels.ts";

export async function sendPaidOrderEmail(client: ReturnType<typeof adminClient>, workOrderId: string) {
  const { data, error } = await client.from("work_orders").select("work_order_no, snapshot, orders!inner(id, order_no)").eq("id", workOrderId).single();
  if (error || !data) throw error ?? new Error("not_found");
  const order = data.orders as unknown as { id: string; order_no: string };
  const snapshot = data.snapshot as OrderSnapshot;
  const item = snapshot.items?.[0];
  const to = snapshot.customer?.email;
  if (!to) return { sent: false, to: "" };
  const sent = await sendEmail({
    to,
    subject: `【鴻萊興業】訂單明細（${order.order_no}，已付款）`,
    html: customerWorkOrderEmail({ orderNo: order.order_no, workOrderNo: data.work_order_no, snapshot, specs: item ? specRows(item.product_slug, item.specifications) : [] }),
  });
  if (sent) await client.from("orders").update({ customer_email_sent_at: new Date().toISOString() }).eq("id", order.id);
  return { sent, to };
}
