import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = { title: "聯絡我們" };

export default function ContactPage() {
  return <main>
    <section className="inner-image-hero contact-image-hero">
      <Image alt="信封、信紙、名片與書寫文具" className="inner-image-hero-media" fill priority sizes="100vw" src="/images/contact/contact-banner-desktop.webp" />
      <div className="inner-image-hero-shade" aria-hidden="true" />
      <div className="page-container inner-image-hero-content">
        <div className="inner-image-hero-copy">
          <h1>讓每一份想法，<span>都有被傾聽的機會。</span></h1>
          <div className="image-page-hero-description">
            <p>從一個簡單的詢問，到一段值得期待的合作。無論有任何疑問或製作需求，都歡迎與鴻萊興業聊聊。</p>
          </div>
        </div>
      </div>
    </section>
    <section className="section page-container content-grid"><article className="content-card"><h2>聯絡資訊</h2><p>電話：(04) 2471-3063<br />Email：hongguan8888@gmail.com<br />LINE ID：24713063</p></article><article className="content-card"><h2>營業資訊</h2><p>週一至週五 08:00–17:30<br />午休時間 12:00–13:30<br />台中市南區有恆街 55 號</p></article></section>
  </main>;
}
