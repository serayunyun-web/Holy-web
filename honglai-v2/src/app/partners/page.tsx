import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = { title: "合作廠商專區", description: "合作廠商資格與未來專區功能介紹。" };
export default function PartnersPage(){return <main className="business-page"><PageHero eyebrow="Partner Area" title="合作廠商專區" description="第一階段提供專區規劃與合作資格申請入口；合作資格須經鴻萊人工審核。"/><section className="business-section page-container partner-intro-grid"><article><span>01</span><h2>提出合作需求</h2><p>透過企業合作洽詢介面整理公司資料、合作方向與需求內容。</p></article><article><span>02</span><h2>人工審核資格</h2><p>填寫洽詢不會自動取得合作資格；是否核准由管理員於後續系統中審核。</p></article><article><span>03</span><h2>專區功能待開放</h2><p>專屬報價、常用規格、進度與歷史訂單仍是未來規劃，現在不可使用。</p></article></section><section className="business-section business-partner-cta"><div className="page-container"><p className="eyebrow">Apply for Partnership</p><h2>想申請合作資格？</h2><p>先前往企業合作洽詢介面選擇「其他合作需求」。內容只供格式檢查，目前不會正式送出。</p><Link className="button button-light" href="/business?cooperation=%E5%85%B6%E4%BB%96%E5%90%88%E4%BD%9C%E9%9C%80%E6%B1%82#business-inquiry">前往申請入口</Link></div></section></main>}
