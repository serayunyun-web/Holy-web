import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { activeProducts, getProductBySlug, getRelatedProducts } from "@/data/catalog";

type ProductPageProps = { params: Promise<{ slug: string }> };

export const instant = false;

export function generateStaticParams() {
  return activeProducts.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "找不到產品" };
  return { title: product.title, description: product.description.replace("【暫存內容】", "") };
}

const detailGroups = [
  { key: "introduction", title: "詳細介紹" },
  { key: "materials", title: "材質" },
  { key: "specifications", title: "規格" },
  { key: "processing", title: "加工方式" },
  { key: "notes", title: "注意事項" },
] as const;

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();
  const relatedProducts = getRelatedProducts(product);

  return (
    <main className="product-detail-page">
      <div className="page-container">
        <nav className="breadcrumbs" aria-label="麵包屑導覽"><Link href="/">首頁</Link><span aria-hidden="true">/</span><Link href="/services">服務與產品</Link><span aria-hidden="true">/</span><span aria-current="page">{product.title}</span></nav>

        <section className="product-detail-hero" aria-labelledby="product-title">
          <ProductGallery images={product.gallery} productName={product.title} />
          <div className="product-detail-summary">
            <p className="eyebrow">Product Detail</p>
            <span className="placeholder-badge">暫存內容</span>
            <h1 id="product-title">{product.title}</h1>
            <p className="product-detail-lead">{product.description}</p>
            <dl className="product-basic-info">{product.basicInfo.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>
            <div className="product-detail-notice">本頁不顯示未確認價格。需求送出後，仍須等待鴻萊人工確認價格、規格與交期。</div>
            <div className="product-detail-actions">
              <Link className="button button-primary" href={`/quote?product=${product.slug}`}>快速查價</Link>
              <Link className="button button-secondary" href={`/order?product=${product.slug}`}>線上下單</Link>
              <Link className="text-link" href={`/contact?product=${product.slug}`}>聯絡詢價 <span aria-hidden="true">→</span></Link>
            </div>
          </div>
        </section>

        <section className="product-information" aria-labelledby="product-information-title">
          <div className="detail-section-heading"><p className="eyebrow">Product Information</p><h2 id="product-information-title">產品資訊</h2><p>下列內容皆為頁面架構示意，待鴻萊提供正式資料後替換。</p></div>
          <div className="product-detail-groups">{detailGroups.map((group) => <article className="product-detail-group" key={group.key}><h3>{group.title}</h3><ul>{product.details[group.key].map((item) => <li key={item}>{item}</li>)}</ul></article>)}</div>
        </section>

        {relatedProducts.length > 0 && <section className="related-products" aria-labelledby="related-title"><div className="section-heading"><div><p className="eyebrow">Related Products</p><h2 id="related-title">相關產品</h2></div><Link className="outline-link" href="/services">返回產品總覽 <span aria-hidden="true">→</span></Link></div><div className="product-grid">{relatedProducts.map((related) => <ProductCard key={related.id} {...related} />)}</div></section>}
      </div>
    </main>
  );
}
