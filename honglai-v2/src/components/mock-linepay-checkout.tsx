"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cachedPayment, paymentStatusLabels, readCheckout, submitMockPayment, type CheckoutInfo, type PaymentResponse, type PaymentStatus } from "@/lib/checkout";
import { SubmissionError } from "@/lib/supabase-public-api";

const money = (value: number) => `NT$${value.toLocaleString("zh-TW")}`;
const errorText: Record<string, string> = {
  not_found: "找不到這筆訂單的付款資料，請回下單頁重新送出。",
  not_payable: "這筆訂單沒有可付款的金額，請與我們聯繫。",
  inquiry_closed: "這筆訂單已取消，無法付款。",
  rate_limited: "短時間內嘗試次數過多，請稍後再試。",
  not_configured: "網站尚未完成系統設定，無法付款。",
};

/** 模擬 LINE Pay 結帳頁。只用於示範，不連線任何金流。 */
export function MockLinePayCheckout() {
  const [ready, setReady] = useState(false);
  const [info, setInfo] = useState<CheckoutInfo | null>(null);
  const [result, setResult] = useState<PaymentResponse | null>(null);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const ref = new URLSearchParams(window.location.search).get("ref") ?? "";
      setInfo(ref ? readCheckout(ref) : null);
      setResult(ref ? cachedPayment(ref) : null);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const finish = async (next: Exclude<PaymentStatus, "unpaid">) => {
    if (processing || !info) return;
    setProcessing(true); setMessage(next === "paid" ? "付款處理中，請勿關閉頁面……" : "");
    try {
      setResult(await submitMockPayment(info, next));
      setMessage("");
    } catch (error) {
      const code = error instanceof SubmissionError ? error.code : "";
      setMessage(errorText[code] ?? "付款結果送出失敗，請確認網路後再試一次。");
    } finally {
      setProcessing(false);
    }
  };

  if (!ready) return null;
  const status: PaymentStatus = result?.status ?? "unpaid";

  return <div className="mock-pay-shell page-container">
    <p className="mock-pay-demo" role="note">示範用模擬付款頁面：不是真正的 LINE Pay，不會扣款，也不會收集任何付款資料。</p>
    <section className="mock-pay-card" aria-live="polite">
      <header className="mock-pay-header"><span className="mock-pay-mark" aria-hidden="true">Pay</span><div><strong>LINE Pay（模擬）</strong><small>鴻萊興業 示範結帳</small></div></header>

      {!info ? <div className="mock-pay-body">
        <h1>找不到這筆結帳資料</h1>
        <p>結帳資料只保存在送出訂單的這個瀏覽器分頁。請回到下單頁重新送出，或與我們聯繫。</p>
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
        {message && <p className="form-message">{message}</p>}
      </div> : <div className={`mock-pay-body mock-pay-result is-${status}`}>
        <span className="mock-pay-icon" aria-hidden="true">{status === "paid" ? "✓" : "!"}</span>
        <h1>{paymentStatusLabels[status]}</h1>
        {status === "paid" ? <>
          <p>已完成模擬付款 {money(result?.total ?? info.total)}，訂單 <strong>{result?.orderNo}</strong> 已成立。</p>
          <p>{result?.emailSent ? "訂單明細已寄到你的 Email。" : result?.already ? "這筆訂單先前已完成付款。" : "訂單明細信暫時沒有寄出，專人會再寄給你。"}專人確認製作內容後，會再寄信通知預計交期。</p>
        </> : <p>訂單 {info.referenceNo} 尚未付款。你可以重新嘗試付款。</p>}
        <div className="order-actions">
          {status !== "paid" && <button className="button button-primary" onClick={() => { setResult(null); setMessage(""); }} type="button">重新付款</button>}
          <Link className={`button ${status === "paid" ? "button-primary" : "button-secondary"}`} href="/">回首頁</Link>
        </div>
      </div>}
    </section>
  </div>;
}
