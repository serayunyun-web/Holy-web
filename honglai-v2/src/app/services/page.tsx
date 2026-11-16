import type { Metadata } from "next";
import Image from "next/image";
import { ServicesCatalog } from "@/components/services-catalog";
import { activeCategories, activeProducts, catalogFilter } from "@/data/catalog";
import Link from "next/link";
import { withBase } from "@/lib/base-path";

export const metadata: Metadata = { title: "服務與產品", description: "瀏覽鴻萊興業的論文書冊、工程企業、創作生活與裝訂加工服務。" };

export default function ServicesPage() {
  return (
    <main>
      <section className="inner-image-hero services-image-hero">
        <Image alt="精裝書冊、線圈裝訂與多種書冊加工成品" className="inner-image-hero-media" fill priority sizes="100vw" src={withBase("/images/services/services-banner-desktop.webp")} />
        <div className="inner-image-hero-shade" aria-hidden="true" />
        <div className="page-container inner-image-hero-content">
          <div className="inner-image-hero-copy">
            <h1>從紙張到成品，<span>讓每一份構想都有形狀。</span></h1>
            <div className="image-page-hero-description">
              <p>不同的作品，值得不同的呈現方式。</p>
              <p>從精裝書冊、作品集到各式裝訂加工，以多元工藝與細緻製作，滿足企業、學生及個人創作者的不同需求。</p>
            </div>
          </div>
        </div>
      </section>
      <ServicesCatalog allFilter={catalogFilter} categories={activeCategories} products={activeProducts} />
      <section className="samples-entry-section"><div className="page-container samples-entry"><div><p className="eyebrow">Material Library</p><h2>精裝皮革樣品</h2><p>58 款精裝皮革，適用論文、合約書、菜單、證書夾等所有精裝產品，可依數位燙金或傳統燙金篩選。</p></div><Link className="button button-primary" href="/services/samples">查看皮革樣品</Link></div></section>
    </main>
  );
}
