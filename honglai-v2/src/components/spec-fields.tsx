"use client";

import { ESTIMATE_DISCLAIMER, isAutoPriced, motorDistricts, shippingChoices, visiblePricingFields, type Estimate, type PricingField } from "@/lib/pricing";
import { fieldsByProduct, productFormTypeBySlug, type OrderField } from "@/data/order-options";

type Values = Record<string, string>;
const money = (value: number) => `NT$${value.toLocaleString("zh-TW")}`;

/** 選項 4 個以下用按鈕一鍵選擇，較多時才用下拉選單，減少點擊。 */
function PricingInput({ field, value, onChange, idPrefix }: { field: PricingField; value: string; onChange: (value: string) => void; idPrefix: string }) {
  const id = `${idPrefix}-${field.id}`;
  if (field.kind === "number") {
    return <div className="quote-field"><label htmlFor={id}>{field.label}<span className="quote-required">必填</span></label>{field.help && <p>{field.help}</p>}
      <div className="spec-number"><input id={id} inputMode="numeric" max={field.max} min={field.min} onChange={(event) => onChange(event.target.value.replace(/[^\d]/g, ""))} placeholder={field.placeholder} type="text" value={value} /><span>{field.unit}</span></div></div>;
  }
  if (field.options.length <= 4) {
    return <fieldset className="quote-field quote-field-wide"><legend>{field.label}<span className="quote-required">必填</span></legend>{field.help && <p>{field.help}</p>}
      <div className="quote-choice-row">{field.options.map((option) => <label className="quote-choice" key={option}><input checked={value === option} name={id} onChange={() => onChange(option)} type="radio" /><span>{option}</span></label>)}</div></fieldset>;
  }
  return <div className="quote-field"><label htmlFor={id}>{field.label}<span className="quote-required">必填</span></label>{field.help && <p>{field.help}</p>}
    <select id={id} onChange={(event) => onChange(event.target.value)} value={value}><option value="">請選擇</option>{field.options.map((option) => <option key={option}>{option}</option>)}</select></div>;
}

function OrderInput({ field, value, onChange, idPrefix }: { field: OrderField; value: string; onChange: (value: string) => void; idPrefix: string }) {
  const id = `${idPrefix}-${field.id}`;
  const required = field.required && <span className="quote-required">必填</span>;
  if (field.type === "radio" || (field.type === "select" && (field.options?.length ?? 0) <= 4)) {
    return <fieldset className="quote-field quote-field-wide"><legend>{field.label}{required}</legend>{field.help && <p>{field.help}</p>}
      <div className="quote-choice-row">{field.options?.map((option) => <label className="quote-choice" key={option}><input checked={value === option} name={id} onChange={() => onChange(option)} type="radio" /><span>{option}</span></label>)}</div></fieldset>;
  }
  const shared = { id, value, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => onChange(event.target.value) };
  return <div className={`quote-field${field.type === "textarea" ? " quote-field-wide" : ""}`}><label htmlFor={id}>{field.label}{required}</label>{field.help && <p>{field.help}</p>}
    {field.type === "select" ? <select {...shared}><option value="">請選擇</option>{field.options?.map((option) => <option key={option}>{option}</option>)}</select>
      : field.type === "textarea" ? <textarea {...shared} placeholder={field.placeholder} rows={3} />
      : <input {...shared} min={field.type === "number" ? 1 : undefined} placeholder={field.placeholder} type={field.type} />}</div>;
}

export function visibleManualFields(slug: string, values: Values) {
  const formType = productFormTypeBySlug[slug as keyof typeof productFormTypeBySlug];
  return formType ? fieldsByProduct[formType].filter((field) => !field.when || field.when.values.includes(values[field.when.field])) : [];
}

/** 產品規格欄位：自動計價產品用計價引擎的欄位，其餘用人工報價欄位。 */
export function SpecFields({ slug, values, onChange, idPrefix }: { slug: string; values: Values; onChange: (id: string, value: string) => void; idPrefix: string }) {
  if (isAutoPriced(slug)) {
    return <>{visiblePricingFields(slug, values).map((field) => <PricingInput field={field} idPrefix={idPrefix} key={field.id} onChange={(value) => onChange(field.id, value)} value={values[field.id] ?? ""} />)}</>;
  }
  return <>{visibleManualFields(slug, values).map((field) => <OrderInput field={field} idPrefix={idPrefix} key={field.id} onChange={(value) => onChange(field.id, value)} value={values[field.id] ?? ""} />)}</>;
}

export function CommonInput(props: { field: OrderField; value: string; onChange: (value: string) => void; idPrefix: string }) {
  return <OrderInput {...props} />;
}

/** 規格摘要：回傳 [欄位名稱, 值]，供摘要、Email 與工作單使用。 */
export function specSummary(slug: string, values: Values): [string, string][] {
  const fields: { id: string; label: string }[] = isAutoPriced(slug) ? visiblePricingFields(slug, values) : visibleManualFields(slug, values);
  return fields.filter((field) => values[field.id]).map((field) => {
    const unit = "unit" in field ? (field as { unit: string }).unit : "";
    return [field.label, `${values[field.id]}${unit && /^\d+$/.test(values[field.id]) ? ` ${unit}` : ""}`];
  });
}

export function ShippingPicker({ shippingId, district, onChange, idPrefix }: { shippingId: string; district: string; onChange: (next: { shippingId?: string; district?: string }) => void; idPrefix: string }) {
  const selected = shippingChoices.find((choice) => choice.id === shippingId);
  return <fieldset className="quote-shipping"><legend>配送方式<span className="quote-required">必填</span></legend>
    <div>{shippingChoices.map((option) => <label key={option.id}><input checked={shippingId === option.id} name={`${idPrefix}-shipping`} onChange={() => onChange({ shippingId: option.id })} type="radio" /><span><strong>{option.label}</strong><small>{option.fee === 0 ? "不加運費" : `${money(option.fee)}／件`}・{option.note}</small></span></label>)}</div>
    {selected?.needsDistrict && <div className="quote-field spec-district"><label htmlFor={`${idPrefix}-district`}>配送區域<span className="quote-required">必填</span></label>
      <select id={`${idPrefix}-district`} onChange={(event) => onChange({ district: event.target.value })} value={district}><option value="">請選擇配送區域</option>{motorDistricts.map((item) => <option key={item}>{item}</option>)}</select>
      <p>不在以上區域請改選新竹貨運。</p></div>}
  </fieldset>;
}

export function PriceBreakdown({ estimate, compact = false }: { estimate: Estimate | null; compact?: boolean }) {
  if (!estimate) return null;
  if (estimate.status !== "priced") {
    return <div className={`quote-price-status${estimate.status === "manual" ? " is-manual" : ""}`}><small>{estimate.status === "manual" ? "MANUAL QUOTE" : "ESTIMATE"}</small>
      <strong>{estimate.status === "manual" ? "需要專人報價" : "尚未完成規格"}</strong><p>{estimate.reason}</p>
      {estimate.status === "manual" && <p>仍可直接送出需求，專人確認後會以 Email 寄出正式報價。</p>}</div>;
  }
  return <div className="price-breakdown">
    <table><thead><tr><th>項目</th><th>單價</th><th>數量</th><th>小計</th></tr></thead>
      <tbody>{estimate.lines.map((item, index) => <tr key={index}><td>{item.label}{!compact && <small>{item.source}</small>}</td><td>{money(item.unitPrice)}</td><td>{item.quantity} {item.unit}</td><td>{money(item.amount)}</td></tr>)}</tbody>
      <tfoot>
        <tr><th colSpan={3}>商品小計</th><td>{money(estimate.subtotal ?? 0)}</td></tr>
        <tr><th colSpan={3}>運費{estimate.shipping ? `（${estimate.shipping.label}${estimate.shipping.district ? `・${estimate.shipping.district}` : ""}）` : ""}</th><td>{estimate.shipping ? money(estimate.shipping.fee) : "尚未選擇"}</td></tr>
        <tr className="price-total"><th colSpan={3}>試算合計（未稅）</th><td>{estimate.total === null ? "—" : money(estimate.total)}</td></tr>
      </tfoot></table>
    {estimate.notes.map((note) => <p className="price-note" key={note}>{note}</p>)}
    <p className="price-disclaimer">{ESTIMATE_DISCLAIMER}</p>
  </div>;
}
