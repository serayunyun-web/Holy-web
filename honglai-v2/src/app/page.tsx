import Link from "next/link";
import { PlaceholderArtwork } from "@/components/placeholder-artwork";
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
      <section className="editorial-hero">
        <div className="hero-copy-panel">
          <div className="hero-copy-inner">
            <p className="hero-kicker">HONG LAI PRINTING</p>
            <h1>用印刷，<br /><span>裝訂</span>每一個<br />重要時刻。</h1>
            <p className="hero-lead">從論文、證書到施工本與菜單，鴻萊提供專業裝訂與印製服務，並由專人確認每一項製作需求。</p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/quote">快速查價 <span aria-hidden="true">↗</span></Link>
              <Link className="button button-secondary" href="/services">瀏覽產品 <span aria-hidden="true">→</span></Link>
            </div>
            <p className="hero-note">網站不提供線上付款；正式價格與訂單須經人工確認。</p>
          </div>
        </div>
        <div className="hero-photo-panel" role="img" aria-label="專業裝訂產品攝影構圖佔位區">
          <div className="flight-path flight-path-top" aria-hidden="true" />
          <div className="photo-prop prop-book" aria-hidden="true"><span>論文裝訂</span></div>
          <div className="photo-prop prop-certificate" aria-hidden="true"><span>證書夾</span></div>
          <div className="photo-prop prop-menu" aria-hidden="true"><span>菜單</span></div>
          <div className="photo-paper paper-one" aria-hidden="true" />
          <div className="photo-paper paper-two" aria-hidden="true" />
          <div className="pencil pencil-one" aria-hidden="true" />
          <div className="pencil pencil-two" aria-hidden="true" />
          <div className="photo-placeholder-label"><strong>Banner 攝影佔位</strong><span>後續替換鴻萊正式產品照片</span></div>
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
              <span className="audience-symbol" aria-hidden="true">企</span>
              <div><p>印刷同業、影印店、企業採購與大量加工需求</p><h3>我是企業方</h3><span className="audience-action">前往企業合作 →</span></div>
            </Link>
            <Link className="audience-card creator-card" href="/services">
              <span className="audience-symbol" aria-hidden="true">創</span>
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

      <section className="home-section company-section" aria-labelledby="company-title">
        <div className="page-container company-grid">
          <div className="company-art"><PlaceholderArtwork label="公司服務形象佔位圖" tone="teal" /></div>
          <div className="company-copy">
            <p className="eyebrow">About Hong Lai</p>
            <h2 id="company-title">專注印刷後加工與裝訂需求</h2>
            <p>鴻萊興業以印刷後加工與裝訂服務為核心，承作論文裝訂、證書夾、施工本、菜單及客製加工需求。從個人少量製作到企業與同業合作，實際材質、規格、價格與交期皆在需求送出後由專人逐項確認，協助客戶整理合適的製作方式。</p>
            <div className="company-actions"><Link className="button button-primary" href="/business">企業合作</Link><Link className="text-link" href="/contact">聯絡我們 <span aria-hidden="true">→</span></Link></div>
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

      <button aria-label="AI 客服功能建置中" className="ai-service-button" disabled title="AI 客服功能尚未啟用" type="button"><span aria-hidden="true">•••</span><strong>AI 客服</strong><small>建置中</small></button>
    </main>
  );
}
