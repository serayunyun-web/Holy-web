"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { materialSamples, sampleKindNames, type SampleKind } from "@/data/material-samples";

export function SampleBrowser() {
  const params = useSearchParams();
  const requested = params.get("select");
  const [kind, setKind] = useState<SampleKind>(requested === "corner" ? "corner" : "cover");
  const samples = materialSamples.filter((sample) => sample.kind === kind && sample.enabled);
  const selectSample = (code: string, name: string) => {
    try {
      const key = "honglai-order-draft-v1";
      const draft = JSON.parse(localStorage.getItem(key) || "{}") as { samples?: Record<string, string> };
      const field = kind === "cover" ? "coverSample" : "corner";
      localStorage.setItem(key, JSON.stringify({ ...draft, samples: { ...draft.samples, [field]: `${name}（${code}）` } }));
    } catch { /* 草稿無法解析時仍安全返回下單頁 */ }
    window.location.assign(params.get("return") || "/order");
  };
  return <section className="section page-container sample-browser"><div className="sample-tabs" role="tablist" aria-label="樣品分類">{(["cover","corner"] as const).map((id) => <button aria-selected={kind === id} key={id} onClick={() => setKind(id)} role="tab" type="button">{sampleKindNames[id]}</button>)}</div><div className="sample-note"><strong>正式樣品資料待補</strong><p>鴻萊尚未提供正式照片、參考編號及名稱，因此目前不建立虛構資料，也不開放選取。待正式資料加入後，此處的「選擇此款」會自動回填下單頁。</p></div>{samples.length > 0 && <div className="sample-grid">{samples.map((sample) => <article className="sample-card" key={sample.code}><div className="sample-image"><span>正式圖片待補</span></div><h2>{sample.name}</h2><p>{sample.code}</p><button disabled={!sample.enabled} onClick={() => selectSample(sample.code, sample.name)} type="button">選擇此款</button></article>)}</div>}<p className="sample-color-note">圖片可能因螢幕顯色產生差異，實際材質、顏色與可用狀態須由鴻萊確認。</p><Link className="button button-secondary" href={params.get("return") || "/order"}>返回下單頁（保留草稿）</Link></section>;
}
