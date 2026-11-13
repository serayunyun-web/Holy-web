import type { Metadata } from "next";
import Image from "next/image";
import { QuoteCatalog } from "@/components/quote-catalog";

export const metadata: Metadata = { title: "快速查價" };

export default function QuotePage() {
  return <main>
    <section className="inner-image-hero quote-image-hero">
      <Image alt="精裝書冊、材質樣本、尺規與計算工具" className="inner-image-hero-media" fill priority sizes="100vw" src="/images/quote/quote-banner-desktop.webp" />
      <div className="inner-image-hero-shade" aria-hidden="true" />
      <div className="page-container inner-image-hero-content">
        <div className="inner-image-hero-copy">
          <h1>選好規格，<span>查價更輕鬆。</span></h1>
          <div className="image-page-hero-description"><p>依照產品類型、尺寸、材質與數量，快速了解參考價格。特殊需求也能交由專人協助估價。</p></div>
        </div>
      </div>
    </section>
    <QuoteCatalog />
  </main>;
}
