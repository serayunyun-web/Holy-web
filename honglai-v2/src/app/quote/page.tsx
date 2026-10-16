import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = { title: "快速查價" };

export default function QuotePage() {
  return <main><PageHero eyebrow="Quick Quote" title="快速查價" description="新版價格將依公司確認的 Excel 規則建置，不沿用舊站價格。試算結果也不等於正式成交價格。" /><section className="section page-container"><div className="content-card"><h2>價格功能尚未啟用</h2><p>目前為第一階段視覺雛形。企業、大量與客製需求將維持人工詢價。</p><Link className="button button-secondary" href="/contact">先聯絡我們</Link></div></section></main>;
}
