import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { activeCategories, activeProducts, getProductBySlug, getRelatedProducts, leatherCoverSlugs } from "@/data/catalog";

type ProductPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return activeProducts.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "找不到產品" };
  return { title: product.title, description: product.description.replace("【暫存內容】", "") };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();
  const relatedProducts = getRelatedProducts(product);
  const category = activeCategories.find((item) => item.id === product.categoryIds[0]);

  return (
    <main className="product-detail-page">
      <div className="page-container">
        <header className="product-detail-header">
          <h1 id="product-title">{product.title}{product.isPlaceholder && <span className="placeholder-badge">暫存內容</span>}</h1>
          <nav className="breadcrumbs" aria-label="麵包屑導覽">
            <Link href="/services">服務與產品</Link><span aria-hidden="true">&gt;</span>
            {category && <><Link href="/services">{category.name}</Link><span aria-hidden="true">&gt;</span></>}
            <span aria-current="page">{product.title}</span>
          </nav>
        </header>

        <ProductGallery images={product.gallery} productName={product.title} />

        <section className="product-information" aria-labelledby="product-title">
          <dl className="product-spec-list">
            {product.details.specs.map((group) => <div key={group.label}><dt>{group.label}<span aria-hidden="true">→</span></dt>{group.items.map((item) => <dd key={item}>{item}</dd>)}{(group.label === "材質" || group.label === "結構") && leatherCoverSlugs.has(product.slug) && <dd><Link className="product-spec-link" href="/services/samples">查看精裝皮革樣品 →</Link></dd>}</div>)}
          </dl>
          <div className="product-story">
            {product.details.story.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </section>

        <section className="product-detail-cta" aria-label="詢價與下單">
          <div className="product-detail-actions">
            {product.isOrderable !== false && <>
              <Link className="button button-primary" href={`/quote?product=${product.slug}`}>快速查價</Link>
              <Link className="button button-secondary" href={`/order?product=${product.slug}`}>線上下單</Link>
            </>}
            <Link className="text-link" href={`/contact?product=${product.slug}`}>聯絡詢價 <span aria-hidden="true">→</span></Link>
          </div>
          <ul className="product-detail-notes">{product.details.notes.map((note) => <li key={note}>{note}</li>)}</ul>
        </section>

        {relatedProducts.length > 0 && <section className="related-products" aria-labelledby="related-title"><div className="section-heading"><div><p className="eyebrow">Related Products</p><h2 id="related-title">相關產品</h2></div><Link className="outline-link" href="/services">返回產品總覽 <span aria-hidden="true">→</span></Link></div><div className="product-grid">{relatedProducts.map((related) => <ProductCard key={related.id} {...related} />)}</div></section>}
      </div>
    </main>
  );
}
