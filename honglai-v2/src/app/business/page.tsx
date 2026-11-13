import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cooperationBenefits, cooperationModes, cooperationSteps, partnerAudiences } from "@/data/business";

export const metadata: Metadata = { title: "企業合作", description: "數位燙金皮革封面、半成品加工、完整裝訂代工與特殊加工合作。" };

export default function BusinessPage() {
  return <main className="business-page">
    <section className="inner-image-hero business-image-hero">
      <Image alt="企業合作精裝書冊、鴻萊標誌燙金與材料樣品" className="inner-image-hero-media" fill priority sizes="100vw" src="/images/business/business-hero-desktop.jpg" />
      <div className="inner-image-hero-shade" aria-hidden="true" />
      <div className="page-container inner-image-hero-content">
        <div className="inner-image-hero-copy">
          <h1>專注每一道工序，<span>成為你值得信賴的製作夥伴。</span></h1>
          <div className="image-page-hero-description">
            <p>二十餘年的印後加工經驗，從精裝書冊、皮革燙金到半成品加工，提供靈活且專業的代工服務。</p>
            <p>無論是印刷同業、設計工作室或企業需求，都能依照不同規格與製作方式，共同完成每一份託付。</p>
          </div>
          <div className="hero-actions"><a className="button button-primary" href="#partnership-service">了解合作服務</a><a className="button button-secondary" href="#business-contact">聯絡企業合作</a></div>
        </div>
      </div>
    </section>
    <section className="business-section page-container business-feature business-feature-text-only" id="partnership-service"><div><p className="eyebrow">Featured Service</p><h2>數位燙金皮革封面・半成品加工</h2><p>鴻萊興業可先完成皮革封面的數位燙金加工，製作成半成品，再交由外縣市合作影印店自行完成後續裝訂。合作店家可以保留原有製作流程，同時取得專業加工支援。</p><ul className="check-list"><li>支援單本及少量客製</li><li>提供數位燙金皮革封面加工</li><li>可依需求提供半成品</li><li>合作店家可自行完成後續裝訂</li><li>可透過寄送方式進行跨縣市合作</li></ul></div></section>
    <section className="business-section business-soft"><div className="page-container"><div className="business-heading"><p className="eyebrow">Cooperation Models</p><h2>三種合作方式，保留你的製作彈性</h2></div><div className="cooperation-card-grid">{cooperationModes.map(mode=><article className="cooperation-card" key={mode.key}><span>{mode.icon}</span><h3>{mode.title}</h3><p>{mode.description}</p><small>{mode.example}</small><a className="text-link" href="#business-contact">聯絡洽詢此服務 →</a></article>)}</div></div></section>
    <section className="business-section page-container"><div className="business-heading"><p className="eyebrow">Who We Work With</p><h2>適合提出合作需求的對象</h2><p>以下為服務適用對象，不代表皆為現有合作客戶。</p></div><div className="audience-chip-grid">{partnerAudiences.map((item,index)=><div key={item}><span>{String(index+1).padStart(2,"0")}</span><strong>{item}</strong></div>)}</div></section>
    <section className="business-section business-benefit-section"><div className="page-container"><div className="business-heading"><p className="eyebrow">Partnership Benefits</p><h2>為合作夥伴提供更有彈性的製作選擇</h2></div><div className="benefit-grid">{cooperationBenefits.map(([title,description])=><article key={title}><h3>{title}</h3><p>{description}</p></article>)}</div></div></section>
    <section className="business-section page-container"><div className="business-heading"><p className="eyebrow">Workflow</p><h2>合作流程</h2></div><ol className="business-process">{cooperationSteps.map(([number,title,description])=><li key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></li>)}</ol></section>
    <section className="business-section business-partner-cta" id="business-contact"><div className="page-container"><p className="eyebrow">Contact Hong Lai</p><h2>有企業合作需求，歡迎直接聯絡我們</h2><p>請準備需求產品、預估數量、尺寸規格與希望交期，由鴻萊專人協助確認製作方式、價格與實際交期。</p><div className="hero-actions"><a className="button button-light" href="tel:+886424713063">電話聯絡</a><a className="button button-light" href="mailto:hongguan8888@gmail.com">Email 聯絡</a><Link className="button button-light" href="/contact">查看 LINE 與營業資訊</Link></div></div></section>
  </main>;
}
