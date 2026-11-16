import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContactOpenStatus } from "@/components/contact-open-status";
import { ContactQuickActions } from "@/components/contact-quick-actions";
import { contactInfo } from "@/data/contact";

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
    <section className="section page-container contact-main">
      <ContactQuickActions />

      <div className="contact-info-map">
        <div className="contact-info-panel">
          <div className="contact-info-block">
            <h2>營業時間</h2>
            <ContactOpenStatus />
            <dl className="contact-hours">
              <div><dt>週一至週五</dt><dd>08:00–17:30</dd></div>
              <div><dt>午休</dt><dd>12:00–13:30</dd></div>
              <div><dt>週末與國定假日</dt><dd>公休</dd></div>
            </dl>
          </div>
          <div className="contact-info-block">
            <h2>聯絡方式</h2>
            <dl className="contact-details">
              <div><dt>電話</dt><dd><a href={contactInfo.phoneHref}>{contactInfo.phoneDisplay}</a></dd></div>
              <div><dt>Email</dt><dd><a href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a></dd></div>
              <div><dt>LINE ID</dt><dd>{contactInfo.lineId}</dd></div>
              <div><dt>地址</dt><dd>{contactInfo.address}</dd></div>
            </dl>
          </div>
          <a className="button button-secondary contact-map-link" href={contactInfo.mapDirectionsUrl} rel="noopener noreferrer" target="_blank">用 Google 地圖規劃路線</a>
        </div>
        <div className="contact-map">
          <iframe allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={contactInfo.mapEmbedUrl} title="鴻萊興業 Google 地圖位置" />
        </div>
      </div>

      <div className="contact-notes">
        <article className="contact-note">
          <h2>交通與停車</h2>
          <ul>
            <li>工廠位於有恆街巷弄內，路面較窄，大型車輛不便進出與停靠。</li>
            <li>建議騎乘機車或駕駛小客車前來；開車請先停妥附近停車格，再步行過來。</li>
            <li>大量成品需要貨車載運時，請先來電確認取貨方式。</li>
          </ul>
        </article>
        <article className="contact-note">
          <h2>來店取件</h2>
          <ul>
            <li>請於營業時間內取件，午休 12:00–13:30 暫停服務。</li>
            <li>來店前建議先來電，確認成品已完成。</li>
          </ul>
        </article>
        <article className="contact-note contact-line">
          <h2>LINE 聯絡</h2>
          {contactInfo.lineQrImage
            ? <div className="contact-line-qr"><Image alt="鴻萊興業 LINE 官方帳號 QR Code" height={140} src={contactInfo.lineQrImage} width={140} /></div>
            : null}
          <ul>
            <li>LINE ID：{contactInfo.lineId}</li>
            <li>詢問時附上產品、數量、尺寸與希望交期，回覆更快。</li>
            <li>製作檔案可在線上下單時上傳，或以 Email 寄送。</li>
          </ul>
          {contactInfo.lineAddUrl ? <a className="button button-primary" href={contactInfo.lineAddUrl} rel="noopener noreferrer" target="_blank">加入 LINE 好友</a> : null}
        </article>
      </div>
    </section>

    <section className="contact-cta">
      <div className="page-container contact-cta-inner">
        <div><h2>還沒決定規格？</h2><p>先試算看看價格，或直接把需求交給我們。</p></div>
        <div className="contact-cta-actions"><Link className="button button-light" href="/quote">快速查價</Link><Link className="button button-ghost" href="/order">線上下單</Link></div>
      </div>
    </section>
  </main>;
}
