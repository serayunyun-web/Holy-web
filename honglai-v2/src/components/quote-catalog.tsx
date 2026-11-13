"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { activeCategories, orderableProducts } from "@/data/catalog";
import { fieldsByProduct, formTypes, productFormTypeBySlug, type OrderField } from "@/data/order-options";
import { evaluateQuoteReadiness, shippingOptions } from "@/data/quote-options";

type Values = Record<string, string>;

function QuoteField({ field, value, onChange }: { field: OrderField; value: string; onChange: (value: string) => void }) {
  const id = `quote-${field.id}`;
  if (field.type === "radio") {
    return <fieldset className="quote-field quote-field-wide"><legend>{field.label}{field.required && <span className="quote-required">必填</span>}</legend>{field.help && <p>{field.help}</p>}<div className="quote-choice-row">{field.options?.map((option) => <label className="quote-choice" key={option}><input checked={value === option} name={id} onChange={() => onChange(option)} type="radio" /><span>{option}</span></label>)}</div></fieldset>;
  }

  const shared = { id, value, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => onChange(event.target.value) };
  return <div className={`quote-field${field.type === "textarea" ? " quote-field-wide" : ""}`}><label htmlFor={id}>{field.label}{field.required && <span className="quote-required">必填</span>}</label>{field.help && <p>{field.help}</p>}{field.type === "select" ? <select {...shared}><option value="">請選擇</option>{field.options?.map((option) => <option key={option}>{option}</option>)}</select> : field.type === "textarea" ? <textarea {...shared} placeholder={field.placeholder} rows={3} /> : <input {...shared} min={field.type === "number" ? 1 : undefined} placeholder={field.placeholder} type={field.type} />}</div>;
}

export function QuoteCatalog() {
  const [categoryId, setCategoryId] = useState("all");
  const [productSlug, setProductSlug] = useState("");
  const [values, setValues] = useState<Values>({});
  const [quantity, setQuantity] = useState("1");
  const [shippingId, setShippingId] = useState("");
  const specificationRef = useRef<HTMLElement>(null);

  const products = useMemo(() => categoryId === "all" ? orderableProducts : orderableProducts.filter((product) => product.categoryIds.includes(categoryId)), [categoryId]);
  const product = orderableProducts.find((item) => item.slug === productSlug);
  const formTypeId = productSlug ? productFormTypeBySlug[productSlug as keyof typeof productFormTypeBySlug] : undefined;
  const formType = formTypes.find((item) => item.id === formTypeId);
  const visibleFields = useMemo(() => formTypeId ? fieldsByProduct[formTypeId].filter((field) => !field.when || field.when.values.includes(values[field.when.field])) : [], [formTypeId, values]);
  const numericQuantity = Number(quantity);
  const quantityIsValid = Number.isSafeInteger(numericQuantity) && numericQuantity > 0;
  const freeTextFieldIds = visibleFields.filter((field) => field.type === "textarea").map((field) => field.id);
  const readiness = product ? evaluateQuoteReadiness(product.slug, quantityIsValid ? numericQuantity : 0, values, freeTextFieldIds) : null;
  const shipping = shippingOptions.find((option) => option.id === shippingId);
  const summary = visibleFields.filter((field) => values[field.id]);

  const chooseProduct = (slug: string) => {
    const hasEnteredData = Object.values(values).some(Boolean) || quantity !== "1";
    if (productSlug && productSlug !== slug && hasEnteredData && !window.confirm("切換產品會重設目前填寫的規格與數量，是否繼續？")) return;
    setProductSlug(slug);
    if (slug !== productSlug) { setValues({}); setQuantity("1"); }
    window.setTimeout(() => specificationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  const setValue = (id: string, value: string) => setValues((current) => ({ ...current, [id]: value }));

  return <div className="quote-catalog-shell">
    <section className="quote-intro page-container">
      <div><p className="eyebrow">PRODUCT DIRECTORY</p><h2>先選產品，再整理查價規格</h2></div>
      <p>目前先開放產品與規格流程。正式產品金額將在價目資料庫完成串接後啟用；企業、大量、客製或資料不足的需求仍由專人協助。</p>
    </section>

    <section className="quote-directory page-container" aria-labelledby="quote-products-heading">
      <div className="quote-section-heading"><div><span>01</span><h2 id="quote-products-heading">選擇一項產品</h2></div><p>一次查一項，規格會接續在同一頁展開。</p></div>
      <div className="quote-category-list" role="group" aria-label="產品分類篩選">
        <button aria-pressed={categoryId === "all"} onClick={() => setCategoryId("all")} type="button"><i aria-hidden="true">全</i><span>全部產品</span><small>{orderableProducts.length} 項</small></button>
        {activeCategories.map((category) => <button aria-pressed={categoryId === category.id} key={category.id} onClick={() => setCategoryId(category.id)} type="button"><i aria-hidden="true">{category.icon}</i><span>{category.name}</span><small>{orderableProducts.filter((item) => item.categoryIds.includes(category.id)).length} 項</small></button>)}
      </div>
      <p className="quote-result-count" aria-live="polite">目前顯示 <strong>{products.length}</strong> 項產品</p>
      <div className="quote-product-grid">
        {products.map((item) => {
          const selected = productSlug === item.slug;
          const manualOnly = item.slug === "menu-production";
          return <button aria-pressed={selected} className="quote-product-card" key={item.id} onClick={() => chooseProduct(item.slug)} type="button"><span className={`quote-product-mark ${item.tone}`} aria-hidden="true">{item.title.slice(0, 1)}</span><span className="quote-product-copy"><small>{manualOnly ? "價目待補／人工估價" : "標準規格查價入口"}</small><strong>{item.title}</strong><em>{item.description.replace("【暫存內容】", "")}</em></span><b>{selected ? "已選擇" : "選擇產品"}</b></button>;
        })}
      </div>
    </section>

    {product && !formTypeId && <section className="quote-specification page-container" id="quote-specification" ref={specificationRef} tabIndex={-1}>
      <div className="quote-section-heading"><div><span>02</span><h2>{product.title}</h2></div></div>
      <div className="quote-price-status"><small>MANUAL QUOTE</small><strong>此產品目前需人工協助</strong><p>網站尚未建立此產品的查價規格，請直接填寫需求，由專人協助確認。</p></div>
      <Link className="button button-primary quote-order-link" href={`/order?product=${product.slug}`}>前往填寫人工詢價</Link>
    </section>}

    {product && formTypeId && <section className="quote-specification page-container" id="quote-specification" ref={specificationRef} tabIndex={-1}>
      <div className="quote-section-heading"><div><span>02</span><h2>{product.title}查價規格</h2></div><p>目前沿用「{formType?.name}」選項；價目表對照將於資料庫串接前完成。</p></div>
      <div className="quote-workbench">
        <div className="quote-form-sheet">
          <div className="quote-binding-tab"><strong>{product.title}</strong><span>規格整理</span></div>
          <div className="quote-field-grid">{visibleFields.map((field) => <QuoteField field={field} key={field.id} value={values[field.id] ?? ""} onChange={(value) => setValue(field.id, value)} />)}
            <div className="quote-field"><label htmlFor="quote-quantity">製作數量<span className="quote-required">必填</span></label><input id="quote-quantity" min={1} onChange={(event) => setQuantity(event.target.value)} type="number" value={quantity} />{!quantityIsValid && <p className="quote-error" role="alert">請輸入大於 0 的整數。</p>}</div>
          </div>

          <fieldset className="quote-shipping"><legend>配送方式</legend><p>運費依每筆查價固定收取一次，不隨數量累加。</p><div>{shippingOptions.map((option) => <label key={option.id}><input checked={shippingId === option.id} name="quote-shipping" onChange={() => setShippingId(option.id)} type="radio" /><span><strong>{option.label}</strong><small>{option.fee === 0 ? "不加運費" : `未稅 NT$${option.fee}`}</small></span></label>)}</div></fieldset>
        </div>

        <aside className={`quote-summary ${readiness?.mode === "manual" ? "is-manual" : ""}`} aria-live="polite">
          <div className="quote-summary-tab">估價摘要</div>
          <p className="quote-summary-product"><span>產品</span><strong>{product.title}</strong></p>
          <dl>{summary.map((field) => <div key={field.id}><dt>{field.label}</dt><dd>{values[field.id]}</dd></div>)}<div><dt>製作數量</dt><dd>{quantityIsValid ? `${numericQuantity} ${product.slug === "certificate-folder" ? "本" : "件／本"}` : "尚未完成"}</dd></div><div><dt>配送方式</dt><dd>{shipping ? `${shipping.label}（${shipping.fee === 0 ? "不加運費" : `未稅 NT$${shipping.fee}`}）` : "尚未選擇"}</dd></div></dl>
          <div className="quote-price-status"><small>{readiness?.mode === "manual" ? "MANUAL QUOTE" : "PRICE CONNECTION PENDING"}</small><strong>{quantityIsValid ? readiness?.title : "請先確認數量"}</strong><p>{quantityIsValid ? readiness?.message : "數量必須是大於 0 的整數。"}</p></div>
          <div className="quote-tax-note"><strong>未稅提醒</strong><span>未來顯示的網站金額為未稅參考估價，不代表正式報價或訂單。</span></div>
          <Link aria-disabled={!quantityIsValid} className={`button button-primary quote-order-link${!quantityIsValid ? " is-disabled" : ""}`} href={quantityIsValid ? `/order?product=${product.slug}` : "#quote-quantity"}>{readiness?.mode === "manual" ? "前往填寫人工詢價" : "前往填寫需求"}</Link>
          <p className="quote-transfer-note">第一階段只帶入產品；完整規格與配送資料會在共用資料模型完成後啟用。</p>
        </aside>
      </div>
    </section>}
  </div>;
}

