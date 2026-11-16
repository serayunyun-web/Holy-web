"use client";

import { useState } from "react";
import { contactInfo } from "@/data/contact";

const icons = {
  phone: <path d="M6.6 3.8 9 3.4l1.6 4-1.9 1.3a11 11 0 0 0 6.6 6.6l1.3-1.9 4 1.6-.4 2.4a2 2 0 0 1-2.1 1.6A16.4 16.4 0 0 1 3.4 5.9a2 2 0 0 1 1.6-2.1Z" />,
  line: <path d="M12 3.6c-5 0-9 3.2-9 7.2 0 3.6 3.2 6.6 7.5 7.1.4.1.8.3.8.9l-.2 1.3c0 .3.3.6.8.3 1-.5 5.5-3.3 7.5-5.6 1.4-1.5 2.5-2.9 2.5-4.2 0-4-4-7.2-9-7.2Z" />,
  mail: <><rect height="13" rx="2" width="17" x="3.5" y="5.5" /><path d="m4.5 7 7.5 6 7.5-6" /></>,
  pin: <><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.3" /></>,
};

function Icon({ name }: { name: keyof typeof icons }) {
  return <svg aria-hidden="true" fill="none" focusable="false" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" viewBox="0 0 24 24">{icons[name]}</svg>;
}

/** 聯絡頁最上方的四顆快速聯絡按鈕。LINE 尚無官方連結時改為複製 LINE ID。 */
export function ContactQuickActions() {
  const [copied, setCopied] = useState(false);
  const copyLineId = async () => {
    try { await navigator.clipboard.writeText(contactInfo.lineId); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch { setCopied(false); }
  };

  return <div className="contact-actions">
    <a className="contact-action" href={contactInfo.phoneHref}><Icon name="phone" /><span><strong>撥打電話</strong><small>{contactInfo.phoneDisplay}</small></span></a>
    {contactInfo.lineAddUrl
      ? <a className="contact-action" href={contactInfo.lineAddUrl} rel="noopener noreferrer" target="_blank"><Icon name="line" /><span><strong>加入 LINE</strong><small>LINE 官方帳號</small></span></a>
      : <button className="contact-action" onClick={copyLineId} type="button"><Icon name="line" /><span><strong>{copied ? "已複製 LINE ID" : "LINE 聯絡"}</strong><small>ID：{contactInfo.lineId}</small></span></button>}
    <a className="contact-action" href={`mailto:${contactInfo.email}?subject=${encodeURIComponent("【網站詢問】")}`}><Icon name="mail" /><span><strong>寄送 Email</strong><small>{contactInfo.email}</small></span></a>
    <a className="contact-action" href={contactInfo.mapDirectionsUrl} rel="noopener noreferrer" target="_blank"><Icon name="pin" /><span><strong>規劃路線</strong><small>Google 地圖</small></span></a>
  </div>;
}
