"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { commonFields, fieldsByProduct, products, type OrderField, type ProductId } from "@/data/order-options";

const DRAFT_KEY = "honglai-order-draft-v1";
type Draft = { product: ProductId | ""; values: Record<string, string>; contact: Record<string, string>; samples: Record<string, string> };
const empty: Draft = { product: "", values: {}, contact: {}, samples: {} };

function Field({ field, value, onChange }: { field: OrderField; value: string; onChange: (value: string) => void }) {
  const id = `order-${field.id}`;
  const help = field.help && <details className="field-help"><summary aria-label={`查看${field.label}說明`}>i</summary><p>{field.help}</p></details>;
  if (field.type === "radio") return <fieldset className="order-field order-field-wide"><div className="field-label-line"><legend>{field.label}</legend>{help}</div><div className="choice-row">{field.options?.map((option) => <label className="choice-pill" key={option}><input checked={value === option} name={id} onChange={() => onChange(option)} type="radio" /><span>{option}</span></label>)}</div></fieldset>;
  const number = Number(value || 0);
  return <div className={`order-field${field.type === "textarea" ? " order-field-wide" : ""}`}><div className="field-label-line"><label htmlFor={id}>{field.label}{field.required && <span className="required-mark" aria-hidden="true">必填</span>}</label>{help}</div>{field.type === "select" ? <select id={id} required={field.required} value={value} onChange={(e) => onChange(e.target.value)}><option value="">請選擇</option>{field.options?.map((option) => <option key={option}>{option}</option>)}</select> : field.type === "textarea" ? <textarea id={id} rows={3} value={value} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} /> : field.type === "number" ? <div className="quantity-control"><button aria-label={`減少${field.label}`} disabled={number <= 1} onClick={() => onChange(String(Math.max(1, number - 1)))} type="button">−</button><input id={id} min={1} required={field.required} type="number" value={value} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} /><button aria-label={`增加${field.label}`} onClick={() => onChange(String(Math.max(0, number) + 1))} type="button">＋</button></div> : <input id={id} required={field.required} type={field.type} value={value} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />}</div>;
}

export function OrderRequestForm() {
  const [draft, setDraft] = useState<Draft>(empty);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [activeStep, setActiveStep] = useState(1);
  const summaryRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { const saved = localStorage.getItem(DRAFT_KEY); if (saved) setDraft(JSON.parse(saved)); }
      catch { localStorage.removeItem(DRAFT_KEY); }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); }, [draft, ready]);
  const product = products.find((item) => item.id === draft.product);
  const visibleFields = useMemo(() => draft.product ? fieldsByProduct[draft.product].filter((field) => !field.when || field.when.values.includes(draft.values[field.when.field])) : [], [draft.product, draft.values]);
  const setValue = (id: string, value: string) => setDraft((current) => ({ ...current, values: { ...current.values, [id]: value } }));
  const chooseProduct = (id: ProductId) => { if (draft.product && draft.product !== id && Object.values(draft.values).some(Boolean) && !window.confirm("切換產品會重設目前的產品規格，是否繼續？")) return; setDraft((current) => ({ ...current, product: id, values: draft.product === id ? current.values : {} })); setActiveStep(2); setMessage(""); };
  const preview = () => {
    const required = [...commonFields, ...visibleFields].find((field) => field.required && !draft.values[field.id]);
    const missingContact = ["customerType", "contactName", "phone", "email"].find((id) => !draft.contact[id]);
    if (!draft.product || required || missingContact) { const id = !draft.product ? "product-options" : required ? `order-${required.id}` : `contact-${missingContact}`; setMessage("請先完成標示為必填的欄位。"); document.getElementById(id)?.focus(); return; }
    setActiveStep(4); setMessage("已完成需求預覽；資料未送出，也不代表正式訂單成立。"); summaryRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const clear = () => { if (!window.confirm("確定清除目前內容？此動作無法復原。")) return; localStorage.removeItem(DRAFT_KEY); setDraft(empty); setMessage("已清除目前內容。"); };
  const summary = [...visibleFields, ...commonFields].filter((field) => draft.values[field.id]);
  const preserveDraft = () => localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  const goToStep = (step: number, id: string) => { setActiveStep(step); document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const stepClass = (step: number) => step < activeStep ? "is-complete" : step === activeStep ? "is-current" : "is-upcoming";

  return <div className="order-shell">
    <nav className="order-steps" aria-label="需求填寫步驟">{[[1,"選擇產品","product-options"],[2,"製作規格","specifications"],[3,"聯絡資料","contact-details"],[4,"確認摘要","order-summary"]].map(([step,label,id]) => <button aria-current={activeStep === step ? "step" : undefined} className={stepClass(Number(step))} disabled={Number(step) > 1 && !product} key={id} onClick={() => goToStep(Number(step), String(id))} type="button"><b>{Number(step) < activeStep ? "✓" : step}</b><span><small>STEP {step}</small>{label}</span></button>)}</nav>
    <section className="order-panel product-panel" id="product-options" tabIndex={-1}><div className="order-heading"><p>STEP 01 ／ PRODUCT</p><h2>選擇製作項目</h2><span>先選最接近的類型，後續規格會依產品自動調整。</span></div><div className="product-option-grid">{products.map((item) => <button aria-pressed={draft.product === item.id} className="product-option" key={item.id} onClick={() => chooseProduct(item.id)} type="button"><i aria-hidden="true">{item.icon}</i><strong>{item.name}</strong><small>{item.note}</small><em>{draft.product === item.id ? "已選擇" : "選擇此類"}</em></button>)}</div>{product && <div className="step-actions step-actions-end"><button className="button button-primary" onClick={() => goToStep(2,"specifications")} type="button">下一步：填寫規格</button></div>}</section>
    {product && <>
      <section className="order-panel" id="specifications"><div className="order-heading"><p>STEP 02 ／ SPECIFICATION</p><h2>{product.name}製作規格</h2><span>不確定的項目可以直接選「不確定」，不用猜測專業規格。</span></div><div className="form-sheet"><div className="sheet-label">產品專屬規格</div><div className="order-field-grid">{visibleFields.map((field) => <Field field={field} key={field.id} value={draft.values[field.id] ?? ""} onChange={(value) => setValue(field.id, value)} />)}{["coverSample", "corner"].map((id) => draft.values[id]?.includes("選擇") && <div className="sample-picker" key={id}><strong>{id === "coverSample" ? "皮面／膠皮樣品" : "護角樣品"}</strong><span>{draft.samples[id] || "尚未選擇；正式資料待補"}</span><Link className="button button-secondary" href={`/services/samples?select=${id === "coverSample" ? "cover" : "corner"}&return=/order`} onClick={preserveDraft}>查看樣品</Link></div>)}</div></div>
      <div className="order-subsection"><div className="sheet-label">共用製作資訊</div><div className="order-field-grid">{commonFields.map((field) => <Field field={field} key={field.id} value={draft.values[field.id] ?? ""} onChange={(value) => setValue(field.id, value)} />)}<div className="order-field order-field-wide prototype-file"><div className="field-label-line"><span>檔案準備</span><details className="field-help"><summary aria-label="查看檔案格式說明">i</summary><p>未來預計接受 PDF、AI、PSD、JPG 等製作檔；正式格式與容量仍須由鴻萊確認。</p></details></div><div className="mock-upload" aria-disabled="true"><span aria-hidden="true">↥</span><strong>第一階段不開放上傳</strong><small>目前按鈕停用，不會選取或傳送任何檔案。</small></div></div></div></div><div className="step-actions"><button className="button button-secondary" onClick={() => goToStep(1,"product-options")} type="button">上一步</button><button className="button button-primary" onClick={() => goToStep(3,"contact-details")} type="button">下一步：聯絡資料</button></div></section>
      <section className="order-panel" id="contact-details"><div className="order-heading"><p>STEP 03 ／ CONTACT</p><h2>聯絡資料</h2><span>資料只保留在目前瀏覽器，這個原型不會送至伺服器。</span></div><div className="form-sheet"><div className="sheet-label">聯絡人與配送方式</div><div className="order-field-grid">
        <div className="order-field"><label htmlFor="contact-customerType">客戶類型 *</label><select id="contact-customerType" value={draft.contact.customerType ?? ""} onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, customerType: e.target.value } })}><option value="">請選擇</option><option>個人</option><option>公司行號</option><option>學校或行政單位</option></select></div>
        {[['contactName','聯絡人姓名','text'],['phone','手機或聯絡電話','tel'],['email','Email','email']].map(([id,label,type]) => <div className="order-field" key={id}><label htmlFor={`contact-${id}`}>{label} *</label><input id={`contact-${id}`} type={type} value={draft.contact[id] ?? ""} onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, [id]: e.target.value } })} /></div>)}
        {draft.contact.customerType && draft.contact.customerType !== "個人" && <div className="order-field"><label htmlFor="contact-organization">公司／學校名稱</label><input id="contact-organization" value={draft.contact.organization ?? ""} onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, organization: e.target.value } })} /></div>}
        <div className="order-field"><label htmlFor="contact-preferred">偏好聯絡方式</label><select id="contact-preferred" value={draft.contact.preferred ?? ""} onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, preferred: e.target.value } })}><option value="">請選擇</option><option>電話</option><option>Email</option><option>LINE</option></select></div><div className="order-field"><label htmlFor="contact-line">LINE ID（選填）</label><input id="contact-line" value={draft.contact.line ?? ""} onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, line: e.target.value } })} /></div>
        <div className="order-field"><label htmlFor="contact-delivery">配送需求</label><select id="contact-delivery" value={draft.contact.delivery ?? ""} onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, delivery: e.target.value } })}><option value="">請選擇</option><option>自取</option><option>需要配送</option><option>尚未確定</option></select></div>{draft.contact.delivery === "需要配送" && <div className="order-field order-field-wide"><label htmlFor="contact-address">配送地址</label><input id="contact-address" value={draft.contact.address ?? ""} onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, address: e.target.value } })} /></div>}
        <div className="order-field order-field-wide"><label htmlFor="contact-note">聯絡備註</label><textarea id="contact-note" rows={3} value={draft.contact.note ?? ""} onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, note: e.target.value } })} /></div>
      </div></div><div className="step-actions"><button className="button button-secondary" onClick={() => goToStep(2,"specifications")} type="button">上一步</button><button className="button button-primary" onClick={() => goToStep(4,"order-summary")} type="button">查看確認摘要</button></div></section>
      <section className="order-panel summary-panel" id="order-summary" ref={summaryRef}><div className="order-heading"><p>STEP 04 ／ REVIEW</p><h2>確認需求摘要</h2><span>空白欄位已自動略過，請確認已填寫的內容。</span></div><div className="summary-banner"><span aria-hidden="true">✓</span><div><strong>這是一份需求預覽</strong><small>沒有價格，不會送出資料，也不會建立正式訂單。</small></div></div><dl className="order-summary"><div><dt>產品分類</dt><dd>{product.name}</dd></div>{summary.map((field) => <div key={field.id}><dt>{field.label}</dt><dd>{draft.values[field.id]}</dd></div>)}{Object.entries(draft.contact).filter(([,value]) => value).map(([key,value]) => <div key={key}><dt>{{customerType:"客戶類型",contactName:"聯絡人姓名",phone:"聯絡電話",email:"Email",organization:"公司／學校名稱",preferred:"偏好聯絡方式",line:"LINE ID",delivery:"配送需求",address:"配送地址",note:"聯絡備註"}[key] ?? key}</dt><dd>{value}</dd></div>)}</dl>{draft.product === "unsure" && <p className="summary-special">此需求需要專人協助確認產品類型、規格、價格與交期。</p>}<p className="order-disclaimer"><strong>需求成立前提醒</strong><span>提交需求不代表正式訂單成立。正式價格、規格與交期須由鴻萊人工確認。</span></p><div className="order-actions"><button className="button button-secondary" onClick={() => goToStep(3,"contact-details")} type="button">上一步</button><button className="button button-primary" onClick={preview} type="button">完成需求預覽</button><button className="text-button" onClick={clear} type="button">清除目前內容</button></div><p aria-live="polite" className="form-message">{message}</p></section>
    </>}
  </div>;
}
