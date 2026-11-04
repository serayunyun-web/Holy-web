import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { ServicesCatalog } from "@/components/services-catalog";
import { activeCategories, activeProducts, catalogFilter } from "@/data/catalog";
import Link from "next/link";

export const metadata: Metadata = { title: "服務與產品", description: "瀏覽鴻萊興業的論文書冊、工程企業、創作生活與裝訂加工服務。" };

export default function ServicesPage() {
  return (
    <main>
      <PageHero eyebrow="Services" title="服務與產品" description="依用途瀏覽論文書冊、工程企業、創作生活與加工服務；實際材質、規格、交期與價格均由專人確認。" />
      <ServicesCatalog allFilter={catalogFilter} categories={activeCategories} products={activeProducts} />
      <section className="samples-entry-section"><div className="page-container samples-entry"><div><p className="eyebrow">Material Library</p><h2>材質與配件樣品</h2><p>查看皮面／膠皮與護角的參考資料。正式照片與編號尚待鴻萊提供，目前以「資料待補」清楚標示。</p></div><Link className="button button-primary" href="/services/samples">前往樣品頁</Link></div></section>
    </main>
  );
}
