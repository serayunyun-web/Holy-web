"use client";

import { useEffect, useRef, useState } from "react";
import { cooperationTypes, taiwanCities } from "@/data/business";
import { focusFirstError, required, validateEmail, validatePhone, type FormErrors } from "@/lib/form-validation";
import { SubmissionError, submitPublicForm } from "@/lib/supabase-public-api";

function ErrorText({ id, errors }: { id: string; errors: FormErrors }) { return errors[id] ? <small className="business-field-error" id={`${id}-error`}>{errors[id]}</small> : null; }

export function BusinessInquiryForm() {
  const [cooperation, setCooperation] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const idempotencyKey = useRef(crypto.randomUUID());
  useEffect(() => { const timer = window.setTimeout(() => { const value = new URLSearchParams(window.location.search).get("cooperation"); if (value && cooperationTypes.includes(value as typeof cooperationTypes[number])) setCooperation(value); }, 0); return () => window.clearTimeout(timer); }, []);

  async function check(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); const next: FormErrors = {};
    for (const [id, label] of [["companyName", "請填寫公司／店家名稱"], ["contactName", "請填寫聯絡人"], ["phone", "請填寫聯絡電話"], ["email", "請填寫 Email"], ["city", "請選擇所在縣市"], ["cooperationType", "請選擇合作類型"], ["description", "請填寫需求說明"]] as const) if (!required(data.get(id))) next[id] = label;
    const email = String(data.get("email") ?? ""); const phone = String(data.get("phone") ?? ""); const quantity = String(data.get("quantity") ?? "");
    if (email && !validateEmail(email)) next.email = "Email 格式不正確";
    if (phone && !validatePhone(phone)) next.phone = "請輸入有效的電話號碼";
    if (quantity && (!/^\d+$/.test(quantity) || Number(quantity) < 1)) next.quantity = "數量必須是大於零的整數";
    if (data.get("privacyConsent") !== "on") next.privacyConsent = "請先閱讀並同意個資告知。";
    setErrors(next);
    if (Object.keys(next).length) { setMessage("請修正標示的欄位。"); window.setTimeout(() => focusFirstError(next), 0); return; }

    setSubmitting(true); setMessage("正在安全送出，請勿關閉頁面。");
    try {
      const referenceNo = await submitPublicForm("submit-business-inquiry", {
        idempotencyKey: idempotencyKey.current,
        companyName: data.get("companyName"), contactName: data.get("contactName"), phone: data.get("phone"), email: data.get("email"),
        lineId: data.get("lineId"), city: data.get("city"), cooperationType: data.get("cooperationType"), productInterest: data.get("productInterest"),
        quantity: data.get("quantity"), specifications: data.get("specifications"), materialRequirements: data.get("materialRequirements"),
        expectedDate: data.get("expectedDate"), description: data.get("description"), privacyConsent: true,
      });
      setMessage(`鴻萊已收到資料，申請編號：${referenceNo}。送出申請不代表合作已核准。`);
      form.reset(); setCooperation(""); idempotencyKey.current = crypto.randomUUID();
    } catch (error) {
      const code = error instanceof SubmissionError ? error.code : "submission_failed";
      setMessage(code === "not_configured" ? "正式提交尚未完成 Supabase 設定，資料沒有送出。" : code === "rate_limited" ? "短時間內送出次數過多，資料未重複建立，請稍後再試。" : "送出失敗，鴻萊尚未收到資料。請保留內容並稍後重試。");
    } finally { setSubmitting(false); }
  }

  const fieldProps = (id: string) => ({ id, name: id, "aria-invalid": Boolean(errors[id]), "aria-describedby": errors[id] ? `${id}-error` : undefined });
  return <form className="business-form" noValidate onSubmit={check}>
    <div className="business-form-status"><strong>企業合作申請</strong><span>送出後會建立申請紀錄，但不代表合作資格已核准。</span></div>
    <div className="business-form-grid">
      <label>公司／店家名稱 <b>必填</b><input {...fieldProps("companyName")} type="text" /><ErrorText id="companyName" errors={errors} /></label>
      <label>聯絡人 <b>必填</b><input {...fieldProps("contactName")} type="text" /><ErrorText id="contactName" errors={errors} /></label>
      <label>聯絡電話 <b>必填</b><input {...fieldProps("phone")} inputMode="tel" type="tel" /><ErrorText id="phone" errors={errors} /></label>
      <label>Email <b>必填</b><input {...fieldProps("email")} type="email" /><ErrorText id="email" errors={errors} /></label>
      <label>LINE ID<input {...fieldProps("lineId")} type="text" /></label>
      <label>所在縣市 <b>必填</b><select {...fieldProps("city")} defaultValue=""><option value="">請選擇</option>{taiwanCities.map((city) => <option key={city}>{city}</option>)}</select><ErrorText id="city" errors={errors} /></label>
      <label>合作類型 <b>必填</b><select {...fieldProps("cooperationType")} value={cooperation} onChange={(event) => setCooperation(event.target.value)}><option value="">請選擇</option>{cooperationTypes.map((type) => <option key={type}>{type}</option>)}</select><ErrorText id="cooperationType" errors={errors} /></label>
      <label>需求產品<input {...fieldProps("productInterest")} type="text" placeholder="例如：皮革封面、書冊裝訂" /></label>
      <label>預估數量<input {...fieldProps("quantity")} min="1" type="number" /><ErrorText id="quantity" errors={errors} /></label>
      <label>尺寸規格<input {...fieldProps("specifications")} type="text" /></label>
      <label>材質需求<input {...fieldProps("materialRequirements")} type="text" /></label>
      <label>希望交期<input {...fieldProps("expectedDate")} type="date" /></label>
      <label className="business-field-wide">需求說明 <b>必填</b><textarea {...fieldProps("description")} rows={5} /><ErrorText id="description" errors={errors} /></label>
      <div className="business-field-wide business-upload-disabled" aria-disabled="true"><span aria-hidden="true">↥</span><div><strong>參考檔案上傳尚未開放</strong><small>檔案類型、大小與數量限制將在 Supabase Storage 串接前確認。</small></div></div>
    </div>
    <label className="privacy-preview"><input aria-describedby={errors.privacyConsent ? "privacyConsent-error" : undefined} aria-invalid={Boolean(errors.privacyConsent)} name="privacyConsent" type="checkbox" /> 我同意鴻萊為回覆本次申請而蒐集及使用上述資料。<ErrorText id="privacyConsent" errors={errors} /></label>
    <div className="business-form-actions"><button className="button button-primary" disabled={submitting} type="submit">{submitting ? "送出中…" : "送出企業合作申請"}</button><span aria-live="polite">{message}</span></div>
  </form>;
}
