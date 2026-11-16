import type { Metadata } from "next";
import Image from "next/image";
import { OrderRequestForm } from "@/components/order-request-form";

export const metadata: Metadata = { title: "線上下單" };

export default function OrderPage() {
  return (
    <main>
      <section className="inner-image-hero order-image-hero">
        <Image alt="材質、紙張與裝訂規格靈感板" className="inner-image-hero-media" fill priority sizes="100vw" src="/images/inquiry/inquiry-banner-desktop.webp" />
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
      <section className="order-notice page-container"><strong>下單流程</strong><span>送出需求後會寄出試算報價單；專人確認規格、金額與交期後，再寄出正式報價與確認連結，你點選確認後訂單才成立。</span></section>
      <OrderRequestForm />
    </main>
  );
}
