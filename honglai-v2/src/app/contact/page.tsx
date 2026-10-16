import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = { title: "聯絡我們" };

export default function ContactPage() {
  return <main><PageHero eyebrow="Contact" title="聯絡我們" description="需要確認裝訂方式、特殊規格或大量製作，歡迎於營業時間與我們聯繫。" /><section className="section page-container content-grid"><article className="content-card"><h2>聯絡資訊</h2><p>電話：(04) 2471-3063<br />Email：hongguan8888@gmail.com<br />LINE ID：24713063</p></article><article className="content-card"><h2>營業資訊</h2><p>週一至週五 08:00–17:30<br />午休時間 12:00–13:30<br />台中市南區有恆街 55 號</p></article></section></main>;
}
