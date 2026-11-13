"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { orderableProducts } from "@/data/catalog";
import { commonFields, fieldsByProduct, formTypes, productFormTypeBySlug, type FormType, type OrderField } from "@/data/order-options";
import { validateEmail, validatePhone } from "@/lib/form-validation";
import { SubmissionError, submitPublicForm } from "@/lib/supabase-public-api";

const DRAFT_KEY = "honglai-order-draft-v2";
type Draft = { productSlug: string; formType: FormType | ""; values: Record<string, string>; contact: Record<string, string>; samples: Record<string, string>; privacyConsent: boolean; idempotencyKey: string };
const blankDraft = (): Draft => ({ productSlug: "", formType: "", values: {}, contact: {}, samples: {}, privacyConsent: false, idempotencyKey: "" });

function formTypeForSlug(slug: string): FormType | undefined {
  return productFormTypeBySlug[slug as keyof typeof productFormTypeBySlug];
}

function Field({ field, value, onChange }: { field: OrderField; value: string; onChange: (value: string) => void }) {
  const id = `order-${field.id}`;
  const help = field.help && <details className="field-help"><summary aria-label={`查看${field.label}說明`}>i</summary><p>{field.help}</p></details>;
  if (field.type === "radio") return <fieldset className="order-field order-field-wide"><div className="field-label-line"><legend>{field.label}</legend>{help}</div><div className="choice-row">{field.options?.map((option) => <label className="choice-pill" key={option}><input checked={value === option} name={id} onChange={() => onChange(option)} type="radio" /><span>{option}</span></label>)}</div></fieldset>;
  const number = Number(value || 0);
  return <div className={`order-field${field.type === "textarea" ? " order-field-wide" : ""}`}><div className="field-label-line"><label htmlFor={id}>{field.label}{field.required && <span className="required-mark" aria-hidden="true">必填</span>}</label>{help}</div>{field.type === "select" ? <select id={id} required={field.required} value={value} onChange={(event) => onChange(event.target.value)}><option value="">請選擇</option>{field.options?.map((option) => <option key={option}>{option}</option>)}</select> : field.type === "textarea" ? <textarea id={id} rows={3} value={value} placeholder={field.placeholder} onChange={(event) => onChange(event.target.value)} /> : field.type === "number" ? <div className="quantity-control"><button aria-label={`減少${field.label}`} disabled={number <= 1} onClick={() => onChange(String(Math.max(1, number - 1)))} type="button">−</button><input id={id} min={1} required={field.required} type="number" value={value} placeholder={field.placeholder} onChange={(event) => onChange(event.target.value)} /><button aria-label={`增加${field.label}`} onClick={() => onChange(String(Math.max(0, number) + 1))} type="button">＋</button></div> : <input id={id} required={field.required} type={field.type} value={value} placeholder={field.placeholder} onChange={(event) => onChange(event.target.value)} />}</div>;
}

export function OrderRequestForm() {
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const summaryRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      let restored = blankDraft();
      try { const saved = localStorage.getItem(DRAFT_KEY); if (saved) restored = { ...restored, ...JSON.parse(saved) } as Draft; }
      catch { localStorage.removeItem(DRAFT_KEY); }
      const requestedSlug = new URLSearchParams(window.location.search).get("product") ?? "";
      const requestedType = formTypeForSlug(requestedSlug);
      if (requestedType && requestedSlug !== restored.productSlug) restored = { ...restored, productSlug: requestedSlug, formType: requestedType, values: {}, samples: {} };
      if (!formTypeForSlug(restored.productSlug)) restored = { ...restored, productSlug: "", formType: "", values: {}, samples: {} };
      if (!restored.idempotencyKey) restored.idempotencyKey = crypto.randomUUID();
      setDraft(restored); setActiveStep(restored.productSlug ? 2 : 1); setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); }, [draft, ready]);

  const product = orderableProducts.find((item) => item.slug === draft.productSlug);
  const formType = formTypes.find((item) => item.id === draft.formType);
  const visibleFields = useMemo(() => draft.formType ? fieldsByProduct[draft.formType].filter((field) => !field.when || field.when.values.includes(draft.values[field.when.field])) : [], [draft.formType, draft.values]);
  const summary = [...visibleFields, ...commonFields].filter((field) => draft.values[field.id]);
  const setValue = (id: string, value: string) => setDraft((current) => ({ ...current, values: { ...current.values, [id]: value } }));
  const chooseProduct = (slug: string) => {
    const nextType = formTypeForSlug(slug);
    if (!nextType) return;
    if (draft.productSlug && draft.productSlug !== slug && Object.values(draft.values).some(Boolean) && !window.confirm("切換產品會重設目前的產品規格，是否繼續？")) return;
    setDraft((current) => ({ ...current, productSlug: slug, formType: nextType, values: current.productSlug === slug ? current.values : {}, samples: current.productSlug === slug ? current.samples : {}, idempotencyKey: crypto.randomUUID() }));
    setReferenceNo(""); setActiveStep(2); setMessage("");
  };

  const validate = () => {
    const requiredField = [...commonFields, ...visibleFields].find((field) => field.required && !draft.values[field.id]?.trim());
    const missingContact = ["customerType", "contactName", "phone", "email"].find((id) => !draft.contact[id]?.trim());
    let id = !product ? "product-options" : requiredField ? `order-${requiredField.id}` : missingContact ? `contact-${missingContact}` : "";
    let error = id ? "請先完成標示為必填的欄位。" : "";
    if (!error && (!Number.isSafeInteger(Number(draft.values.quantity)) || Number(draft.values.quantity) < 1)) { id = "order-quantity"; error = "製作數量必須是大於 0 的整數。"; }
    if (!error && !validatePhone(draft.contact.phone)) { id = "contact-phone"; error = "請輸入有效的聯絡電話。"; }
    if (!error && !validateEmail(draft.contact.email)) { id = "contact-email"; error = "請輸入有效的 Email。"; }
    if (!error && draft.contact.customerType !== "個人" && !draft.contact.organization?.trim()) { id = "contact-organization"; error = "公司或學校客戶請填寫組織名稱。"; }
    if (!error && draft.contact.delivery === "需要配送" && !draft.contact.address?.trim()) { id = "contact-address"; error = "需要配送時請填寫配送地址。"; }
    if (!error && draft.values.wantedDate && !/^\d{4}-\d{2}-\d{2}$/.test(draft.values.wantedDate)) { id = "order-wantedDate"; error = "希望完成日期格式不正確。"; }
    if (!error && !draft.privacyConsent) { id = "order-privacy"; error = "請先同意個人資料僅供本次詢價聯繫使用。"; }
    if (error) { setMessage(error); document.getElementById(id)?.focus(); return false; }
    return true;
  };

  const preview = () => { if (validate()) { setActiveStep(4); setMessage("已完成需求預覽；尚未正式送出，請確認後點選「正式送出人工詢價」。"); summaryRef.current?.scrollIntoView({ behavior: "smooth" }); } };
  const submit = async () => {
    if (!validate() || !product || !draft.formType) return;
    setSubmitting(true); setMessage("正在安全送出詢價，請勿關閉頁面……");
    const excluded = new Set(["quantity", "wantedDate", "fileStatus", "special", "notes"]);
    const specifications = Object.fromEntries(summary.filter((field) => !excluded.has(field.id)).map((field) => [field.id, draft.values[field.id]]));
    try {
      const number = await submitPublicForm("submit-manual-inquiry", {
        idempotencyKey: draft.idempotencyKey, productSlug: product.slug, quantity: Number(draft.values.quantity), specifications,
        customerType: draft.contact.customerType, contactName: draft.contact.contactName, phone: draft.contact.phone, email: draft.contact.email,
        organization: draft.contact.organization, preferredContact: draft.contact.preferred, lineId: draft.contact.line,
        deliveryMethod: draft.contact.delivery, deliveryAddress: draft.contact.address, expectedDate: draft.values.wantedDate,
        fileStatus: draft.values.fileStatus, specialRequirements: draft.values.special, customerNotes: draft.values.notes,
        contactNotes: draft.contact.note, privacyConsent: draft.privacyConsent,
      });
      setReferenceNo(number); setMessage(`鴻萊已收到人工詢價，詢價編號：${number}。價格、規格與交期仍須人工確認。`);
      setDraft((current) => ({ ...current, idempotencyKey: crypto.randomUUID() }));
    } catch (error) {
      const code = error instanceof SubmissionError ? error.code : "submission_failed";
      setMessage(code === "not_configured" ? "尚未完成 staging 設定，資料沒有送出。" : code === "rate_limited" ? "短時間內送出次數過多，資料未重複建立，請稍後再試。" : code.startsWith("invalid:") ? "資料格式未通過伺服器驗證，鴻萊尚未收到資料。請檢查欄位後再試。" : "送出失敗，鴻萊尚未收到資料。草稿仍保留在這台裝置，請稍後再試。");
    } finally { setSubmitting(false); }
  };
  const clear = () => { if (window.confirm("確定清除目前內容？此動作無法復原。")) { const next = { ...blankDraft(), idempotencyKey: crypto.randomUUID() }; localStorage.removeItem(DRAFT_KEY); setDraft(next); setReferenceNo(""); setActiveStep(1); setMessage("已清除目前內容。"); } };
  const preserveDraft = () => localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  const goToStep = (step: number, id: string) => { setActiveStep(step); document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const stepClass = (step: number) => step < activeStep ? "is-complete" : step === activeStep ? "is-current" : "is-upcoming";

  return <div className="order-shell">
    <nav className="order-steps" aria-label="需求填寫步驟">{[[1,"選擇產品","product-options"],[2,"製作規格","specifications"],[3,"聯絡資料","contact-details"],[4,"確認送出","order-summary"]].map(([step,label,id]) => <button aria-current={activeStep === step ? "step" : undefined} className={stepClass(Number(step))} disabled={Number(step) > 1 && !product} key={id} onClick={() => goToStep(Number(step), String(id))} type="button"><b>{Number(step) < activeStep ? "✓" : step}</b><span><small>STEP {step}</small>{label}</span></button>)}</nav>
    <section className="order-panel product-panel" id="product-options" tabIndex={-1}><div className="order-heading"><p>STEP 01 ／ PRODUCT</p><h2>選擇製作項目</h2><span>15 項產品各自保留唯一產品 ID，並顯示適用的需求欄位。</span></div><div className="product-option-grid">{orderableProducts.map((item) => <button aria-pressed={draft.productSlug === item.slug} className="product-option" key={item.id} onClick={() => chooseProduct(item.slug)} type="button"><i aria-hidden="true">{item.title.slice(0, 1)}</i><strong>{item.title}</strong><small>{formTypes.find((type) => type.id === formTypeForSlug(item.slug))?.name}表單</small><em>{draft.productSlug === item.slug ? "已選擇" : "選擇此產品"}</em></button>)}</div>{product && <div className="step-actions step-actions-end"><button className="button button-primary" onClick={() => goToStep(2,"specifications")} type="button">下一步：填寫規格</button></div>}</section>
    {product && <>
      <section className="order-panel" id="specifications"><div className="order-heading"><p>STEP 02 ／ SPECIFICATION</p><h2>{product.title}製作規格</h2><span>使用「{formType?.name}」欄位；不確定的項目可以留白或選擇請專人建議。</span></div><div className="form-sheet"><div className="sheet-label">產品專屬規格</div><div className="order-field-grid">{visibleFields.map((field) => <Field field={field} key={field.id} value={draft.values[field.id] ?? ""} onChange={(value) => setValue(field.id, value)} />)}{["coverSample", "corner"].map((id) => draft.values[id]?.includes("選擇") && <div className="sample-picker" key={id}><strong>{id === "coverSample" ? "皮面／膠皮樣品" : "護角樣品"}</strong><span>{draft.samples[id] || "尚未選擇；正式資料待補"}</span><Link className="button button-secondary" href={`/services/samples?select=${id === "coverSample" ? "cover" : "corner"}&return=/order?product=${product.slug}`} onClick={preserveDraft}>查看樣品</Link></div>)}</div></div>
      <div className="order-subsection"><div className="sheet-label">共用製作資訊</div><div className="order-field-grid">{commonFields.map((field) => <Field field={field} key={field.id} value={draft.values[field.id] ?? ""} onChange={(value) => setValue(field.id, value)} />)}<div className="order-field order-field-wide prototype-file"><div className="field-label-line"><span>檔案準備</span></div><div className="mock-upload" aria-disabled="true"><span aria-hidden="true">↥</span><strong>本階段不開放上傳</strong><small>請先在「檔案準備狀態」說明；不會選取或傳送檔案。</small></div></div></div></div><div className="step-actions"><button className="button button-secondary" onClick={() => goToStep(1,"product-options")} type="button">上一步</button><button className="button button-primary" onClick={() => goToStep(3,"contact-details")} type="button">下一步：聯絡資料</button></div></section>
      <section className="order-panel" id="contact-details"><div className="order-heading"><p>STEP 03 ／ CONTACT</p><h2>聯絡與配送資料</h2><span>正式送出前仍只是這台裝置上的瀏覽器草稿。</span></div><div className="form-sheet"><div className="sheet-label">聯絡人與配送方式</div><div className="order-field-grid">
        <div className="order-field"><label htmlFor="contact-customerType">客戶類型 *</label><select id="contact-customerType" value={draft.contact.customerType ?? ""} onChange={(event) => setDraft({ ...draft, contact: { ...draft.contact, customerType: event.target.value } })}><option value="">請選擇</option><option value="個人">個人／創作者（B2C）</option><option value="公司行號">公司行號（B2B）</option><option value="學校或行政單位">學校或行政單位（B2B）</option></select></div>
        {[["contactName","聯絡人姓名","text"],["phone","手機或聯絡電話","tel"],["email","Email","email"]].map(([id,label,type]) => <div className="order-field" key={id}><label htmlFor={`contact-${id}`}>{label} *</label><input id={`contact-${id}`} type={type} value={draft.contact[id] ?? ""} onChange={(event) => setDraft({ ...draft, contact: { ...draft.contact, [id]: event.target.value } })} /></div>)}
        {draft.contact.customerType && draft.contact.customerType !== "個人" && <div className="order-field"><label htmlFor="contact-organization">公司／學校名稱 *</label><input id="contact-organization" value={draft.contact.organization ?? ""} onChange={(event) => setDraft({ ...draft, contact: { ...draft.contact, organization: event.target.value } })} /></div>}
        <div className="order-field"><label htmlFor="contact-preferred">偏好聯絡方式</label><select id="contact-preferred" value={draft.contact.preferred ?? ""} onChange={(event) => setDraft({ ...draft, contact: { ...draft.contact, preferred: event.target.value } })}><option value="">請選擇</option><option>電話</option><option>Email</option><option>LINE</option></select></div><div className="order-field"><label htmlFor="contact-line">LINE ID（選填）</label><input id="contact-line" value={draft.contact.line ?? ""} onChange={(event) => setDraft({ ...draft, contact: { ...draft.contact, line: event.target.value } })} /></div>
        <div className="order-field"><label htmlFor="contact-delivery">配送需求</label><select id="contact-delivery" value={draft.contact.delivery ?? ""} onChange={(event) => setDraft({ ...draft, contact: { ...draft.contact, delivery: event.target.value } })}><option value="">請選擇</option><option>自取</option><option>需要配送</option><option>尚未確定</option></select></div>{draft.contact.delivery === "需要配送" && <div className="order-field order-field-wide"><label htmlFor="contact-address">配送地址 *</label><input id="contact-address" value={draft.contact.address ?? ""} onChange={(event) => setDraft({ ...draft, contact: { ...draft.contact, address: event.target.value } })} /></div>}
        <div className="order-field order-field-wide"><label htmlFor="contact-note">聯絡備註</label><textarea id="contact-note" rows={3} value={draft.contact.note ?? ""} onChange={(event) => setDraft({ ...draft, contact: { ...draft.contact, note: event.target.value } })} /></div>
        <label className="choice-pill order-field-wide" htmlFor="order-privacy"><input checked={draft.privacyConsent} id="order-privacy" onChange={(event) => setDraft({ ...draft, privacyConsent: event.target.checked })} type="checkbox" /><span>我同意以上個人資料僅供鴻萊處理本次詢價與聯繫使用。*</span></label>
      </div></div><div className="step-actions"><button className="button button-secondary" onClick={() => goToStep(2,"specifications")} type="button">上一步</button><button className="button button-primary" onClick={preview} type="button">查看確認摘要</button></div></section>
      <section className="order-panel summary-panel" id="order-summary" ref={summaryRef}><div className="order-heading"><p>STEP 04 ／ REVIEW</p><h2>確認並送出人工詢價</h2><span>未確認價格不會成為正式報價、訂單或工作單。</span></div><div className="summary-banner"><span aria-hidden="true">✓</span><div><strong>{referenceNo ? "詢價已安全送達" : "目前仍是瀏覽器草稿"}</strong><small>{referenceNo ? `詢價編號：${referenceNo}` : "確認內容後，必須點選正式送出才會寫入 staging。"}</small></div></div><dl className="order-summary"><div><dt>實際產品</dt><dd>{product.title}（{product.id}）</dd></div><div><dt>規格表單</dt><dd>{formType?.name}</dd></div>{summary.map((field) => <div key={field.id}><dt>{field.label}</dt><dd>{draft.values[field.id]}</dd></div>)}{Object.entries(draft.contact).filter(([,value]) => value).map(([key,value]) => <div key={key}><dt>{{customerType:"客戶類型",contactName:"聯絡人姓名",phone:"聯絡電話",email:"Email",organization:"公司／學校名稱",preferred:"偏好聯絡方式",line:"LINE ID",delivery:"配送需求",address:"配送地址",note:"聯絡備註"}[key] ?? key}</dt><dd>{value}</dd></div>)}</dl><p className="order-disclaimer"><strong>人工詢價提醒</strong><span>送出僅建立待審核詢價；正式價格、規格與交期仍須由鴻萊人工確認。</span></p><div className="order-actions"><button className="button button-secondary" disabled={submitting} onClick={() => goToStep(3,"contact-details")} type="button">上一步</button><button className="button button-primary" disabled={submitting || Boolean(referenceNo)} onClick={submit} type="button">{submitting ? "正在送出……" : referenceNo ? "已送出" : "正式送出人工詢價"}</button><button className="text-button" disabled={submitting} onClick={clear} type="button">清除並建立另一筆</button></div><p aria-live="polite" className="form-message">{message}</p></section>
    </>}
  </div>;
}
