"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { orderableProducts } from "@/data/catalog";
import { commonFields, productFormTypeBySlug } from "@/data/order-options";
import { validateEmail, validatePhone } from "@/lib/form-validation";
import { ATTACHMENT_ACCEPT, MAX_ATTACHMENTS, attachmentProblem, formatBytes } from "@/lib/attachments";
import { calculateEstimate, invalidPricingFields, isAutoPriced, shippingChoices } from "@/lib/pricing";
import { blankDraft, readDraft, writeDraft, DRAFT_KEY, type Draft } from "@/lib/order-draft";
import { SubmissionError, callPublicFunction, supabaseBrowser } from "@/lib/supabase-public-api";
import { ProductPicker } from "@/components/product-picker";
import { CommonInput, PriceBreakdown, ShippingPicker, SpecFields, specSummary, visibleManualFields } from "@/components/spec-fields";

type PickedFile = { file: File; status: "ready" | "uploading" | "done" | "failed"; error?: string };
type SubmitResult = { referenceNo: string; emailSent: boolean; priced: boolean };
const contactLabels: Record<string, string> = { customerType: "客戶類型", contactName: "聯絡人姓名", phone: "聯絡電話", email: "Email", organization: "公司／學校名稱", line: "LINE ID", address: "配送地址" };

export function OrderRequestForm() {
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [ready, setReady] = useState(false);
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const contactRef = useRef<HTMLElement>(null);
  const specRef = useRef<HTMLElement>(null);
  const [jumpToContact, setJumpToContact] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      let restored = readDraft();
      const params = new URLSearchParams(window.location.search);
      const requested = params.get("product") ?? "";
      if (requested && requested !== restored.productSlug && productFormTypeBySlug[requested as keyof typeof productFormTypeBySlug]) restored = { ...restored, productSlug: requested, values: { quantity: "1" }, samples: {} };
      if (!orderableProducts.some((item) => item.slug === restored.productSlug)) restored = { ...restored, productSlug: "", values: { quantity: "1" } };
      if (!restored.idempotencyKey) restored.idempotencyKey = crypto.randomUUID();
      restored.contact = { shippingId: "pickup", ...restored.contact };
      setDraft(restored); setReady(true);
      if (params.get("from") === "quote" && restored.productSlug) setJumpToContact(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { if (ready && !result) writeDraft(draft); }, [draft, ready, result]);
  useEffect(() => {
    if (!jumpToContact) return;
    // 等頁面完成初次捲動與圖片排版後再跳到聯絡資料，避免被重設回頂端。
    const timer = window.setTimeout(() => { contactRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); setJumpToContact(false); }, 350);
    return () => window.clearTimeout(timer);
  }, [jumpToContact, ready]);

  const product = orderableProducts.find((item) => item.slug === draft.productSlug);
  const quantity = Number(draft.values.quantity);
  const estimate = product ? calculateEstimate({ productSlug: product.slug, quantity, values: draft.values, shippingId: draft.contact.shippingId, district: draft.contact.district }) : null;
  const shipping = shippingChoices.find((choice) => choice.id === draft.contact.shippingId);
  const summary = product ? specSummary(product.slug, draft.values) : [];
  const setValue = (id: string, value: string) => setDraft((current) => ({ ...current, values: { ...current.values, [id]: value } }));
  const setContact = (id: string, value: string) => setDraft((current) => ({ ...current, contact: { ...current.contact, [id]: value } }));

  const chooseProduct = (slug: string) => {
    if (slug === draft.productSlug) return;
    setDraft((current) => ({ ...current, productSlug: slug, values: { quantity: current.values.quantity || "1" }, samples: {}, idempotencyKey: crypto.randomUUID() }));
    setMessage("");
    window.setTimeout(() => specRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const picked = [...files];
    const problems: string[] = [];
    for (const file of Array.from(list)) {
      if (picked.length >= MAX_ATTACHMENTS) { problems.push(`最多只能上傳 ${MAX_ATTACHMENTS} 個檔案。`); break; }
      const problem = attachmentProblem(file);
      if (problem) problems.push(`${file.name}：${problem}`); else picked.push({ file, status: "ready" });
    }
    setFiles(picked);
    setMessage(problems.join(" "));
  };

  const validate = () => {
    if (!product) return { id: "product-options", error: "請先選擇製作項目。" };
    if (isAutoPriced(product.slug)) {
      const missing = invalidPricingFields(product.slug, draft.values)[0];
      if (missing) return { id: `order-${missing}`, error: "請完成所有規格選項。" };
    } else {
      const missing = visibleManualFields(product.slug, draft.values).find((field) => field.required && !draft.values[field.id]?.trim());
      if (missing) return { id: `order-${missing.id}`, error: `請填寫「${missing.label}」。` };
    }
    if (!Number.isSafeInteger(quantity) || quantity < 1) return { id: "order-quantity", error: "製作數量必須是大於 0 的整數。" };
    for (const id of ["customerType", "contactName", "phone", "email"]) if (!draft.contact[id]?.trim()) return { id: `contact-${id}`, error: `請填寫「${contactLabels[id]}」。` };
    if (!validatePhone(draft.contact.phone)) return { id: "contact-phone", error: "請輸入有效的聯絡電話。" };
    if (!validateEmail(draft.contact.email)) return { id: "contact-email", error: "請輸入有效的 Email，報價單會寄到這個信箱。" };
    if (draft.contact.customerType !== "個人" && !draft.contact.organization?.trim()) return { id: "contact-organization", error: "公司或學校客戶請填寫名稱。" };
    if (!shipping) return { id: "order-shipping", error: "請選擇配送方式。" };
    if (shipping.needsDistrict && !draft.contact.district) return { id: "order-district", error: "請選擇機車配送區域。" };
    if (shipping.needsAddress && !draft.contact.address?.trim()) return { id: "contact-address", error: "請填寫配送地址。" };
    if (!draft.privacyConsent) return { id: "order-privacy", error: "請先同意個人資料僅供本次製作聯繫使用。" };
    return null;
  };

  const submit = async () => {
    if (submitting || result) return;
    const problem = validate();
    if (problem) { setMessage(problem.error); document.getElementById(problem.id)?.focus(); document.getElementById(problem.id)?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    setSubmitting(true); setMessage("正在送出，請勿關閉頁面……");
    try {
      let attachments: { path: string; name: string; size: number; type: string }[] = [];
      if (files.length) {
        const prepared = await callPublicFunction<{ uploads: { path: string; token: string }[] }>("submit-manual-inquiry", {
          action: "prepare-uploads", idempotencyKey: draft.idempotencyKey, email: draft.contact.email,
          files: files.map(({ file }) => ({ name: file.name, size: file.size, type: file.type })),
        });
        const storage = supabaseBrowser().storage.from("inquiry-files");
        const uploaded = await Promise.all(files.map(async (item, index) => {
          if (item.status === "done") return true;
          setFiles((current) => current.map((entry, i) => i === index ? { ...entry, status: "uploading" } : entry));
          const { error } = await storage.uploadToSignedUrl(prepared.uploads[index].path, prepared.uploads[index].token, item.file, { contentType: item.file.type || "application/octet-stream" });
          setFiles((current) => current.map((entry, i) => i === index ? { ...entry, status: error ? "failed" : "done", error: error ? "上傳失敗" : undefined } : entry));
          return !error;
        }));
        if (uploaded.includes(false)) throw new SubmissionError("upload_failed");
        attachments = files.map(({ file }, index) => ({ path: prepared.uploads[index].path, name: file.name, size: file.size, type: file.type }));
      }
      const { wantedDate, notes } = draft.values;
      const specifications = Object.fromEntries(Object.entries(draft.values).filter(([key, value]) => value && !["quantity", "wantedDate", "notes"].includes(key)));
      const response = await callPublicFunction<{ referenceNo: string; emailSent: boolean; estimate: { status: string } }>("submit-manual-inquiry", {
        idempotencyKey: draft.idempotencyKey, productSlug: draft.productSlug, quantity,
        specifications: { ...specifications, ...(draft.samples.coverSample ? { coverSampleChoice: draft.samples.coverSample } : {}) },
        customerType: draft.contact.customerType, contactName: draft.contact.contactName, phone: draft.contact.phone, email: draft.contact.email,
        organization: draft.contact.organization, lineId: draft.contact.line, preferredContact: "Email",
        shippingId: draft.contact.shippingId, shippingDistrict: draft.contact.district, deliveryAddress: draft.contact.address,
        expectedDate: wantedDate, customerNotes: notes, privacyConsent: draft.privacyConsent, attachments,
      });
      setResult({ referenceNo: response.referenceNo, emailSent: response.emailSent, priced: response.estimate?.status === "priced" });
      localStorage.removeItem(DRAFT_KEY);
      setMessage("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      const code = error instanceof SubmissionError ? error.code : "submission_failed";
      setMessage(code === "not_configured" ? "網站尚未完成系統設定，資料沒有送出。" : code === "rate_limited" ? "短時間內送出次數過多，請稍後再試。" : code === "upload_failed" ? "有檔案上傳失敗，需求尚未送出。請確認網路後再按一次送出。" : code.startsWith("invalid:") ? "資料未通過檢查，需求尚未送出。請檢查欄位後再試。" : "送出失敗，需求尚未送出。內容仍保留在這台裝置，請稍後再試。");
    } finally { setSubmitting(false); }
  };

  const startOver = () => { const next = { ...blankDraft(), contact: draft.contact, idempotencyKey: crypto.randomUUID() }; setDraft({ ...next, contact: { ...next.contact } }); setFiles([]); setResult(null); setMessage(""); };

  if (result) {
    return <div className="order-shell"><section className="order-panel summary-panel order-success" aria-live="polite">
      <div className="summary-banner"><span aria-hidden="true">✓</span><div><strong>需求已送出</strong><small>需求編號：{result.referenceNo}</small></div></div>
      <p>{result.emailSent ? `${result.priced ? "系統試算報價單" : "需求確認信"}已寄到 ${draft.contact.email}。` : "我們已收到你的需求。"}專人確認規格、金額與交期後，會以 Email 寄出正式報價與確認連結，報價有效期限為 3 天。</p>
      <p className="order-disclaimer"><strong>提醒</strong><span>送出需求不代表訂單成立，也不代表已確認交期；請以正式報價為準。</span></p>
      <div className="order-actions"><button className="button button-primary" onClick={startOver} type="button">再填一筆需求</button><Link className="button button-secondary" href="/">回首頁</Link></div>
    </section></div>;
  }

  return <div className="order-shell">
    <section className="order-panel product-panel" id="product-options" tabIndex={-1}>
      <div className="order-heading"><p>STEP 01 ／ PRODUCT</p><h2>選擇製作項目</h2></div>
      <ProductPicker onChoose={chooseProduct} products={orderableProducts} selectedSlug={draft.productSlug} />
    </section>

    {product && <>
      <section className="order-panel" id="specifications" ref={specRef}>
        <div className="order-heading"><p>STEP 02 ／ SPECIFICATION</p><h2>{product.title}製作規格</h2><span>{product.description.replace("【暫存內容】", "")}</span></div>
        <div className="form-sheet"><div className="quote-field-grid">
          <SpecFields idPrefix="order" onChange={setValue} slug={product.slug} values={draft.values} />
          {commonFields.map((field) => <CommonInput field={field} idPrefix="order" key={field.id} onChange={(value) => setValue(field.id, field.id === "quantity" ? value.replace(/[^\d]/g, "") : value)} value={draft.values[field.id] ?? ""} />)}
          <div className="sample-picker"><strong>皮面／膠皮樣品</strong><span>{draft.samples.coverSample || "尚未選擇"}</span><Link className="button button-secondary" href={`/services/samples?select=cover&return=/order?product=${product.slug}`} onClick={() => writeDraft(draft)}>看樣品冊</Link></div>
          <div className="quote-field quote-field-wide file-picker"><label htmlFor="order-files">製作檔案（選填）</label>
            <p>PDF、JPG、PNG、AI、ZIP，每個 50MB 以內，最多 {MAX_ATTACHMENTS} 個。檔案只會提供給鴻萊專人查看。</p>
            <input accept={ATTACHMENT_ACCEPT} disabled={submitting} id="order-files" multiple onChange={(event) => { addFiles(event.target.files); event.target.value = ""; }} type="file" />
            {files.length > 0 && <ul>{files.map((item, index) => <li key={`${item.file.name}-${index}`}><span>{item.file.name}</span><small>{formatBytes(item.file.size)}・{{ ready: "待送出", uploading: "上傳中…", done: "已上傳", failed: "上傳失敗" }[item.status]}</small>{!submitting && item.status !== "done" && <button className="text-button" onClick={() => setFiles((current) => current.filter((_, i) => i !== index))} type="button">移除</button>}</li>)}</ul>}
          </div>
        </div></div>
      </section>

      <section className="order-panel" id="contact-details" ref={contactRef}>
        <div className="order-heading"><p>STEP 03 ／ CONTACT</p><h2>聯絡與配送</h2><span>報價單會寄到你填寫的 Email。</span></div>
        <div className="form-sheet"><div className="quote-field-grid">
          <fieldset className="quote-field quote-field-wide"><legend>客戶類型<span className="quote-required">必填</span></legend><div className="quote-choice-row">{["個人", "公司行號", "學校或行政單位"].map((option) => <label className="quote-choice" key={option}><input checked={draft.contact.customerType === option} id={option === "個人" ? "contact-customerType" : undefined} name="contact-customerType" onChange={() => setContact("customerType", option)} type="radio" /><span>{option}</span></label>)}</div></fieldset>
          {[["contactName", "聯絡人姓名", "text", "name"], ["phone", "手機或聯絡電話", "tel", "tel"], ["email", "Email", "email", "email"]].map(([id, label, type, auto]) => <div className="quote-field" key={id}><label htmlFor={`contact-${id}`}>{label}<span className="quote-required">必填</span></label><input autoComplete={auto} id={`contact-${id}`} onChange={(event) => setContact(id, event.target.value)} type={type} value={draft.contact[id] ?? ""} /></div>)}
          {draft.contact.customerType && draft.contact.customerType !== "個人" && <div className="quote-field"><label htmlFor="contact-organization">公司／學校名稱<span className="quote-required">必填</span></label><input autoComplete="organization" id="contact-organization" onChange={(event) => setContact("organization", event.target.value)} value={draft.contact.organization ?? ""} /></div>}
          <div className="quote-field"><label htmlFor="contact-line">LINE ID（選填）</label><input id="contact-line" onChange={(event) => setContact("line", event.target.value)} value={draft.contact.line ?? ""} /></div>
        </div>
        <div id="order-shipping" tabIndex={-1}><ShippingPicker district={draft.contact.district ?? ""} idPrefix="order" onChange={(next) => setDraft((current) => ({ ...current, contact: { ...current.contact, ...(next.shippingId !== undefined ? { shippingId: next.shippingId } : {}), ...(next.district !== undefined ? { district: next.district } : {}) } }))} shippingId={draft.contact.shippingId ?? ""} /></div>
        {shipping?.needsAddress && <div className="quote-field-grid"><div className="quote-field quote-field-wide"><label htmlFor="contact-address">配送地址<span className="quote-required">必填</span></label><input autoComplete="street-address" id="contact-address" onChange={(event) => setContact("address", event.target.value)} value={draft.contact.address ?? ""} /></div></div>}
        </div>
      </section>

      <section className="order-panel summary-panel" id="order-summary">
        <div className="order-heading"><p>STEP 04 ／ SUBMIT</p><h2>確認並送出</h2><span>送出後會先寄出試算報價單；正式報價由專人確認後寄出。</span></div>
        <dl className="order-summary"><div><dt>產品</dt><dd>{product.title}</dd></div><div><dt>數量</dt><dd>{draft.values.quantity || "—"} 本</dd></div>{summary.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}{files.length > 0 && <div><dt>附件</dt><dd>{files.length} 個檔案</dd></div>}</dl>
        <div className="order-estimate"><PriceBreakdown compact estimate={estimate} /></div>
        <label className="choice-pill order-consent" htmlFor="order-privacy"><input checked={draft.privacyConsent} id="order-privacy" onChange={(event) => setDraft({ ...draft, privacyConsent: event.target.checked })} type="checkbox" /><span>我同意以上個人資料僅供鴻萊處理本次製作與聯繫使用。</span></label>
        <div className="order-actions"><button className="button button-primary" disabled={submitting} onClick={submit} type="button">{submitting ? "正在送出……" : "送出需求"}</button></div>
        <p aria-live="polite" className="form-message">{message}</p>
      </section>
    </>}
  </div>;
}
