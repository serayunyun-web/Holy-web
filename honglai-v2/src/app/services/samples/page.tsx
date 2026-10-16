import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/page-hero";
import { SampleBrowser } from "@/components/sample-browser";

export const metadata: Metadata = { title: "材質與配件樣品", description: "查看皮面、膠皮與護角樣品。正式資料尚待鴻萊提供。" };
export default function SamplesPage() { return <main><PageHero eyebrow="Materials & Accessories" title="材質與配件樣品" description="依正式參考編號選擇皮面／膠皮與護角；目前素材尚待提供，頁面不建立虛構資料。" /><Suspense fallback={<p className="section page-container">載入樣品分類…</p>}><SampleBrowser /></Suspense></main>; }
