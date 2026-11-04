"use client";

import { useRef, useState } from "react";
import { taiwanCities } from "@/data/business";
import { focusFirstError, required, validateEmail, validatePhone, type FormErrors } from "@/lib/form-validation";
import { SubmissionError, submitPublicForm } from "@/lib/supabase-public-api";

export function SampleRequestForm() {
  const [errors, setErrors] = useState<FormErrors>({}); const [message, setMessage] = useState(""); const [submitting, setSubmitting] = useState(false); const idempotencyKey = useRef(crypto.randomUUID());
  async function check(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); const next: FormErrors = {};
    for (const [id, label] of [["sampleCompany", "請填寫公司／店家名稱"], ["sampleContact", "請填寫聯絡人"], ["samplePhone", "請填寫電話"], ["sampleEmail", "請填寫 Email"], ["sampleCity", "請選擇所在縣市"], ["sampleInterest", "請填寫有興趣的項目"], ["samplePurpose", "請填寫申請用途"]] as const) if (!required(data.get(id))) next[id] = label;
    const email=String(data.get("sampleEmail")??""); const phone=String(data.get("samplePhone")??""); if(email&&!validateEmail(email))next.sampleEmail="Email 格式不正確"; if(phone&&!validatePhone(phone))next.samplePhone="請輸入有效的電話號碼";
    if(data.get("privacyConsent")!=="on")next.privacyConsent="請先閱讀並同意個資告知。";
    setErrors(next); if(Object.keys(next).length){setMessage("請修正標示的欄位。");window.setTimeout(()=>focusFirstError(next),0);return;}
    setSubmitting(true);setMessage("正在安全送出，請勿關閉頁面。");
    try{const referenceNo=await submitPublicForm("submit-sample-request",{idempotencyKey:idempotencyKey.current,companyName:data.get("sampleCompany"),contactName:data.get("sampleContact"),phone:data.get("samplePhone"),email:data.get("sampleEmail"),city:data.get("sampleCity"),interest:data.get("sampleInterest"),purpose:data.get("samplePurpose"),note:data.get("sampleNote"),privacyConsent:true});setMessage(`鴻萊已收到資料，申請編號：${referenceNo}。樣品內容、費用及寄送方式仍須人工確認。`);form.reset();idempotencyKey.current=crypto.randomUUID();}
    catch(error){const code=error instanceof SubmissionError?error.code:"submission_failed";setMessage(code==="not_configured"?"正式提交尚未完成 Supabase 設定，資料沒有送出。":code==="rate_limited"?"短時間內送出次數過多，資料未重複建立，請稍後再試。":"送出失敗，鴻萊尚未收到資料。請保留內容並稍後重試。");}
    finally{setSubmitting(false);}
  }
  const props=(id:string)=>({id,name:id,"aria-invalid":Boolean(errors[id]),"aria-describedby":errors[id]?`${id}-error`:undefined});
  const field=(id:string)=>errors[id]?<small className="business-field-error" id={`${id}-error`}>{errors[id]}</small>:null;
  return <form className="business-form" noValidate onSubmit={check}><div className="business-form-status"><strong>材質樣品冊申請</strong><span>送出後會建立申請紀錄；申請不會自動核准，也不會在此收集完整寄送地址。</span></div><div className="business-form-grid">
    <label>公司／店家名稱 <b>必填</b><input {...props("sampleCompany")} />{field("sampleCompany")}</label><label>聯絡人 <b>必填</b><input {...props("sampleContact")} />{field("sampleContact")}</label>
    <label>電話 <b>必填</b><input {...props("samplePhone")} type="tel" />{field("samplePhone")}</label><label>Email <b>必填</b><input {...props("sampleEmail")} type="email" />{field("sampleEmail")}</label>
    <label>所在縣市 <b>必填</b><select {...props("sampleCity")} defaultValue=""><option value="">請選擇</option>{taiwanCities.map(city=><option key={city}>{city}</option>)}</select>{field("sampleCity")}</label>
    <label>有興趣的材質或加工項目 <b>必填</b><input {...props("sampleInterest")} />{field("sampleInterest")}</label>
    <label className="business-field-wide">申請用途 <b>必填</b><textarea {...props("samplePurpose")} rows={4} />{field("samplePurpose")}</label><label className="business-field-wide">備註<textarea {...props("sampleNote")} rows={3} /></label>
  </div><p className="privacy-preview">樣品內容、申請資格、費用、運費及寄送方式皆須由專人確認；本頁不承諾免費或寄送。</p><label className="privacy-preview"><input aria-describedby={errors.privacyConsent?"privacyConsent-error":undefined} aria-invalid={Boolean(errors.privacyConsent)} name="privacyConsent" type="checkbox"/> 我同意鴻萊為回覆本次申請而蒐集及使用上述資料。{field("privacyConsent")}</label><div className="business-form-actions"><button className="button button-primary" disabled={submitting} type="submit">{submitting?"送出中…":"送出樣品冊申請"}</button><span aria-live="polite">{message}</span></div></form>;
}
