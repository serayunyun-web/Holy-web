import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/page-hero";
import { SampleBrowser } from "@/components/sample-browser";

export const metadata: Metadata = { title: "精裝皮革樣品", description: "瀏覽鴻萊興業精裝皮革樣品，依數位燙金、傳統燙金與系列篩選，適用論文、合約書、菜單、證書夾等所有精裝產品。" };

export default function SamplesPage() {
  return (
    <main>
      <PageHero title="精裝皮革樣品" description="適用論文、合約書、菜單、證書夾等所有精裝產品。可依燙金方式與系列篩選，點一下色票即可放大查看紋理。" />
      <Suspense fallback={<p className="section page-container">載入樣品分類…</p>}><SampleBrowser /></Suspense>
    </main>
  );
}
