import type { Metadata } from "next";
import Image from "next/image";
import { OrderRequestForm } from "@/components/order-request-form";
import { withBase } from "@/lib/base-path";

export const metadata: Metadata = { title: "線上下單" };

export default function OrderPage() {
  return (
    <main>
      <section className="inner-image-hero order-image-hero">
        <Image alt="材質、紙張與裝訂規格靈感板" className="inner-image-hero-media" fill priority sizes="100vw" src={withBase("/images/inquiry/inquiry-banner-desktop.webp")} />
        <div className="inner-image-hero-shade" aria-hidden="true" />
        <div className="page-container inner-image-hero-content">
          <div className="inner-image-hero-copy">
            <h1>每一份獨特的需求，<span>都值得細心對待。</span></h1>
            <div className="image-page-hero-description">
              <p>從材質選擇、裝訂方式到特殊加工，歡迎與我們分享你的想法。由專人協助確認製作細節，提供合適的報價與建議。</p>
            </div>
          </div>
        </div>
      </section>
      <section className="order-notice page-container"><strong>下單流程</strong><span>選好規格、填寫聯絡資料後送出訂單，接著前往結帳（本站為示範網站，使用模擬 LINE Pay）。付款完成後會寄出訂單明細，專人確認後再通知交期。</span></section>
      <OrderRequestForm />
    </main>
  );
}
