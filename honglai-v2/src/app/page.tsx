import Image from "next/image";
import Link from "next/link";
import { HomeHero3D } from "@/components/home-hero-3d";
import { HomeHeroCarousel } from "@/components/home-hero-carousel";
import { ProductCard } from "@/components/product-card";
import { homeNews } from "@/data/home-news";
import { featuredProducts } from "@/data/site";

const processSteps = [
  { number: "01", title: "選擇產品或服務", description: "從實際需求選擇合適的產品或加工項目。" },
  { number: "02", title: "填寫規格與需求", description: "提供尺寸、材質、數量及製作需求。" },
  { number: "03", title: "上傳檔案", description: "附上製作檔案與必要的參考資料。" },
  { number: "04", title: "提交需求", description: "送出內容供鴻萊確認，此時尚未成立正式訂單。" },
  { number: "05", title: "人工審核", description: "由專人確認價格、規格與預計交期。" },
  { number: "06", title: "確認後製作", description: "客戶確認完整內容後，才會安排製作。" },
  { number: "07", title: "完成與交付", description: "製作完成後，依雙方確認方式交付。" },
] as const;

export default function Home() {
  return (
    <main>
      <HomeHero3D />

      <section className="home-section banner-feature-section" aria-label="鴻萊精選服務">
        <div className="page-container">
          <HomeHeroCarousel className="banner-feature" headingLevel="h2" />
        </div>
      </section>

      <section className="home-section categories-section" aria-labelledby="categories-title">
        <div className="page-container">
          <div className="section-heading">
            <div><p className="eyebrow">Top Categories</p><h2 id="categories-title">熱門產品分類</h2></div>
            <div className="heading-flight" aria-hidden="true"><span /></div>
            <Link className="outline-link" href="/services">所有產品分類 <span aria-hidden="true">→</span></Link>
          </div>
          <div className="product-grid home-products">
            {featuredProducts.slice(0, 4).map((product) => <ProductCard key={product.slug} {...product} />)}
          </div>
        </div>
      </section>

      <section className="home-section audience-section" aria-labelledby="audience-title">
        <div className="page-container">
          <div className="section-heading audience-heading"><div><p className="eyebrow">Find Your Way</p><h2 id="audience-title">依你的需求快速開始</h2></div><p className="section-note">入口僅協助快速導覽，所有訪客都能自由瀏覽完整網站。</p></div>
          <div className="audience-grid">
            <Link className="audience-card business-card" href="/business">
              <span className="audience-symbol" aria-hidden="true"><Image alt="" height={560} src="/images/home/audience-b2b.png" width={560} /></span>
              <div><p>印刷同業、影印店、企業採購與大量加工需求</p><h3>我是企業方</h3><span className="audience-action">前往企業合作 →</span></div>
            </Link>
            <Link className="audience-card creator-card" href="/services">
              <span className="audience-symbol" aria-hidden="true"><Image alt="" height={560} src="/images/home/audience-b2c.png" width={560} /></span>
              <div><p>一般消費者、個人作品、少量客製與裝訂需求</p><h3>我是個人／創作者</h3><span className="audience-action">瀏覽服務與產品 →</span></div>
            </Link>
          </div>
        </div>
      </section>

      <section className="home-section news-section" aria-labelledby="news-title">
        <div className="page-container news-layout">
          <div className="news-heading"><p className="eyebrow">News & Notices</p><h2 id="news-title">最新消息／公告</h2><p>目前尚無正式公告，以下內容為開發測試資料。</p></div>
          <div className="news-list">
            {homeNews.slice(0, 3).map((item) => (
              <article className="news-item" key={item.id}>
                <time dateTime={item.date.replaceAll(".", "-")}>{item.date}</time>
                <Link href={item.href}>{item.title}<span aria-hidden="true">→</span></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section process-shell" aria-labelledby="process-title">
        <div className="page-container process-panel">
          <div className="process-heading"><div><p className="eyebrow">Printing Process</p><h2 id="process-title">承印流程</h2></div><p>提交需求不代表正式訂單成立；價格、規格及交期須經人工審核與雙方確認。</p></div>
          <ol className="process-row">
            {processSteps.map((step) => (
              <li key={step.number}>
                <div className="process-icon" aria-hidden="true"><span>{step.number}</span></div>
                <div><h3>{step.title}</h3><p>{step.description}</p></div>
              </li>
            ))}
          </ol>
          <div className="process-action"><Link className="button button-primary" href="/order">開始線上下單 <span aria-hidden="true">→</span></Link><small>填寫需求後，仍須等待鴻萊人工確認。</small></div>
        </div>
      </section>

    </main>
  );
}
