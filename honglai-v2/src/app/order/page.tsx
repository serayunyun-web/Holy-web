import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { OrderRequestForm } from "@/components/order-request-form";

export const metadata: Metadata = { title: "線上下單" };

export default function OrderPage() {
  return (
    <main>
      <PageHero eyebrow="Order Request" title="填寫製作需求" description="送出後僅代表建立待確認需求；公司確認規格、檔案、交期與價格後，正式訂單才成立。" />
      <section className="order-notice page-container"><strong>第一階段互動原型</strong><span>資料只暫存在這台裝置的瀏覽器，不會送出、不會上傳檔案，也不會建立正式訂單或顯示價格。</span></section>
      <OrderRequestForm />
    </main>
  );
}
