"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { paymentStatus, paymentStatusLabels, readCheckout, setPaymentStatus, type CheckoutInfo, type PaymentStatus } from "@/lib/checkout";

const money = (value: number) => `NT$${value.toLocaleString("zh-TW")}`;

/** 模擬 LINE Pay 結帳頁。只用於示範，不連線任何金流。 */
export function MockLinePayCheckout() {
  const [ready, setReady] = useState(false);
  const [info, setInfo] = useState<CheckoutInfo | null>(null);
  const [referenceNo, setReferenceNo] = useState("");
  const [status, setStatus] = useState<PaymentStatus>("unpaid");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const ref = new URLSearchParams(window.location.search).get("ref") ?? "";
      setReferenceNo(ref);
      setInfo(ref ? readCheckout(ref) : null);
      setStatus(ref ? paymentStatus(ref) : "unpaid");
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const finish = (next: PaymentStatus) => {
    if (processing) return;
    setProcessing(true);
    // 模擬金流處理時間。
    window.setTimeout(() => { setPaymentStatus(referenceNo, next); setStatus(next); setProcessing(false); }, next === "cancelled" ? 0 : 900);
  };

  if (!ready) return null;

  return <div className="mock-pay-shell page-container">
    <p className="mock-pay-demo" role="note">示範用模擬付款頁面：不是真正的 LINE Pay，不會扣款，也不會收集任何付款資料。</p>
    <section className="mock-pay-card" aria-live="polite">
      <header className="mock-pay-header"><span className="mock-pay-mark" aria-hidden="true">Pay</span><div><strong>LINE Pay（模擬）</strong><small>鴻萊興業 示範結帳</small></div></header>

      {!info ? <div className="mock-pay-body">
        <h1>找不到這筆結帳資料</h1>
        <p>結帳資料只保存在送出訂單的這台裝置與瀏覽器分頁。請回到下單頁重新送出，或與我們聯繫。</p>
        <div className="order-actions"><Link className="button button-primary" href="/order/">回下單頁</Link></div>
      </div> : status === "unpaid" ? <div className="mock-pay-body">
        <dl className="mock-pay-summary">
          <div><dt>訂單編號</dt><dd>{info.referenceNo}</dd></div>
          <div><dt>商品</dt><dd>{info.productTitle} × {info.quantity} 本</dd></div>
          <div className="mock-pay-amount"><dt>付款金額</dt><dd>{money(info.total)}</dd></div>
        </dl>
        <p className="mock-pay-hint">選擇模擬結果：</p>
        <div className="mock-pay-actions">
          <button className="button button-primary" disabled={processing} onClick={() => finish("paid")} type="button">{processing ? "處理中……" : "模擬付款成功"}</button>
          <button className="button button-secondary" disabled={processing} onClick={() => finish("failed")} type="button">模擬付款失敗</button>
          <button className="text-button" disabled={processing} onClick={() => finish("cancelled")} type="button">取消付款</button>
        </div>
      </div> : <div className={`mock-pay-body mock-pay-result is-${status}`}>
        <span className="mock-pay-icon" aria-hidden="true">{status === "paid" ? "✓" : "!"}</span>
        <h1>{paymentStatusLabels[status]}</h1>
        <p>{status === "paid" ? `訂單 ${info.referenceNo} 已完成模擬付款 ${money(info.total)}。專人確認交期後會以 Email 通知你。` : `訂單 ${info.referenceNo} 尚未付款。你可以重新嘗試付款。`}</p>
        <div className="order-actions">
          {status !== "paid" && <button className="button button-primary" onClick={() => { setPaymentStatus(referenceNo, "unpaid"); setStatus("unpaid"); }} type="button">重新付款</button>}
          <Link className={`button ${status === "paid" ? "button-primary" : "button-secondary"}`} href="/">回首頁</Link>
        </div>
      </div>}
    </section>
  </div>;
}
