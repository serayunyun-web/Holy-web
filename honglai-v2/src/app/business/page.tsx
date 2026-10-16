import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = { title: "企業合作" };

export default function BusinessPage() {
  return <main><PageHero eyebrow="Business" title="企業合作" description="同業代工、大量製作與特殊規格皆採人工詢價，由專人確認產能、交期及正式價格。" /><section className="section page-container content-grid"><article className="content-card"><h2>同業代工</h2><p>依合作需求確認工法、規格、數量與交期；詳細合作條件待公司確認後提供。</p></article><article className="content-card"><h2>大量與客製</h2><p>特殊尺寸、材料或大量案件不套用網站預估價格，改由專人逐案評估。</p></article></section></main>;
}
