"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { activeCategories, orderableProducts } from "@/data/catalog";
import { calculateEstimate } from "@/lib/pricing";
import { handOffQuote } from "@/lib/order-draft";
import { ProductPicker } from "@/components/product-picker";
import { PriceBreakdown, ShippingPicker, SpecFields, specSummary } from "@/components/spec-fields";

type Values = Record<string, string>;

export function QuoteCatalog() {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState("all");
  const [productSlug, setProductSlug] = useState("");
  const [values, setValues] = useState<Values>({});
  const [quantity, setQuantity] = useState("1");
  const [shippingId, setShippingId] = useState("pickup");
  const [district, setDistrict] = useState("");
  const specificationRef = useRef<HTMLElement>(null);

  const products = useMemo(() => categoryId === "all" ? orderableProducts : orderableProducts.filter((product) => product.categoryIds.includes(categoryId)), [categoryId]);
  const product = orderableProducts.find((item) => item.slug === productSlug);
  const numericQuantity = Number(quantity);
  const estimate = product ? calculateEstimate({ productSlug: product.slug, quantity: numericQuantity, values, shippingId, district }) : null;
  const summary = product ? specSummary(product.slug, values) : [];

  const chooseProduct = (slug: string) => {
    if (slug !== productSlug) { setValues({}); setQuantity("1"); }
    setProductSlug(slug);
    window.setTimeout(() => specificationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  const order = () => {
    if (!product) return;
    handOffQuote({ productSlug: product.slug, values, quantity, shippingId, district });
    router.push("/order/?from=quote");
  };

  return <div className="quote-catalog-shell">
    <section className="quote-intro page-container">
      <div><p className="eyebrow">PRODUCT DIRECTORY</p><h2>做多少、花多少，<br />先算給你看</h2></div>
      <p>論文、膠裝、精裝等常見品項可直接線上試算；特殊材質或客製需求，由專人估價後以 Email 回覆。</p>
    </section>

    <section className="quote-directory page-container" aria-labelledby="quote-products-heading">
      <div className="quote-section-heading"><div><span>01</span><h2 id="quote-products-heading">選擇一項產品</h2></div></div>
      <ProductPicker onChoose={chooseProduct} products={products} selectedSlug={productSlug}>
        <div className="quote-category-list" role="group" aria-label="產品分類篩選">
          <button aria-pressed={categoryId === "all"} onClick={() => setCategoryId("all")} type="button"><span>全部產品</span><small>{orderableProducts.length}</small></button>
          {activeCategories.map((category) => <button aria-pressed={categoryId === category.id} key={category.id} onClick={() => setCategoryId(category.id)} type="button"><span>{category.name}</span><small>{orderableProducts.filter((item) => item.categoryIds.includes(category.id)).length}</small></button>)}
        </div>
      </ProductPicker>
    </section>

    {product && <section className="quote-specification page-container" id="quote-specification" ref={specificationRef} tabIndex={-1}>
      <div className="quote-section-heading"><div><span>02</span><h2>{product.title}規格</h2></div><p>{product.description.replace("【暫存內容】", "")}</p></div>
      <div className="quote-workbench">
        <div className="quote-form-sheet">
          <div className="quote-binding-tab"><strong>{product.title}</strong><span>規格</span></div>
          <div className="quote-field-grid">
            <SpecFields idPrefix="quote" onChange={(id, value) => setValues((current) => ({ ...current, [id]: value }))} slug={product.slug} values={values} />
            <div className="quote-field"><label htmlFor="quote-quantity">製作數量<span className="quote-required">必填</span></label>
              <div className="spec-number"><input id="quote-quantity" inputMode="numeric" onChange={(event) => setQuantity(event.target.value.replace(/[^\d]/g, ""))} type="text" value={quantity} /><span>本</span></div></div>
          </div>
          <ShippingPicker district={district} idPrefix="quote" onChange={(next) => { if (next.shippingId !== undefined) setShippingId(next.shippingId); if (next.district !== undefined) setDistrict(next.district); }} shippingId={shippingId} />
        </div>

        <aside className={`quote-summary ${estimate?.status === "manual" ? "is-manual" : ""}`} aria-live="polite">
          <div className="quote-summary-tab">試算結果</div>
          <p className="quote-summary-product"><span>產品</span><strong>{product.title}</strong></p>
          {summary.length > 0 && <dl>{summary.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}<div><dt>數量</dt><dd>{quantity || "—"} 本</dd></div></dl>}
          <PriceBreakdown compact estimate={estimate} />
          <button className="button button-primary quote-order-link" disabled={!numericQuantity} onClick={order} type="button">用這個規格下單</button>
        </aside>
      </div>
    </section>}
  </div>;
}
