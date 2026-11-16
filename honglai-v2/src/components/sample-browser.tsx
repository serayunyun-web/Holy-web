"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { leatherSeries, materialSamples, sampleKindNames, type LeatherSeriesId, type MaterialSample, type SampleKind } from "@/data/material-samples";

type FoilFilter = "all" | "digital" | "traditional";

const ORDER_DRAFT_KEY = "honglai-order-draft-v2";
const foilFilters: readonly { id: FoilFilter; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "digital", label: "可數位燙金" },
  { id: "traditional", label: "僅傳統燙金" },
];

const matchesFoil = (sample: MaterialSample, foil: FoilFilter) => foil === "all" || (foil === "digital" ? sample.digitalFoil : !sample.digitalFoil);

function FoilBadge({ digital }: { digital?: boolean }) {
  return digital ? <span className="foil-badge foil-badge-digital">數位燙金</span> : <span className="foil-badge">傳統燙金</span>;
}

export function SampleBrowser() {
  const params = useSearchParams();
  const returnTo = params.get("return");
  const selectMode = Boolean(returnTo);
  const [kind, setKind] = useState<SampleKind>(params.get("select") === "corner" ? "corner" : "cover");
  const [foil, setFoil] = useState<FoilFilter>("all");
  const [series, setSeries] = useState<LeatherSeriesId | "all">("all");
  const [active, setActive] = useState<MaterialSample | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const covers = useMemo(() => materialSamples.filter((sample) => sample.kind === "cover" && sample.enabled), []);
  const corners = materialSamples.filter((sample) => sample.kind === "corner" && sample.enabled);
  const visible = covers.filter((sample) => matchesFoil(sample, foil) && (series === "all" || sample.series === series));
  const groups = leatherSeries.map((item) => ({ ...item, samples: visible.filter((sample) => sample.series === item.id) })).filter((group) => group.samples.length > 0);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (active && !dialog.open) dialog.showModal();
    if (!active && dialog.open) dialog.close();
  }, [active]);

  const selectSample = (sample: MaterialSample) => {
    try {
      const draft = JSON.parse(localStorage.getItem(ORDER_DRAFT_KEY) || "{}") as { samples?: Record<string, string> };
      const field = sample.kind === "cover" ? "coverSample" : "corner";
      localStorage.setItem(ORDER_DRAFT_KEY, JSON.stringify({ ...draft, samples: { ...draft.samples, [field]: `${sample.name}（${sample.code}）` } }));
    } catch { /* 草稿無法解析時仍安全返回下單頁 */ }
    window.location.assign(returnTo || "/order");
  };

  return (
    <section className="section page-container sample-browser">
      <div className="sample-tabs" role="tablist" aria-label="樣品分類">
        {(["cover", "corner"] as const).map((id) => <button aria-selected={kind === id} key={id} onClick={() => setKind(id)} role="tab" type="button">{sampleKindNames[id]}</button>)}
      </div>

      {kind === "cover" ? <>
        <div className="foil-guide">
          <article className="foil-guide-card foil-guide-digital">
            <FoilBadge digital />
            <h2>可數位燙金（也可傳統燙金）</h2>
            <p>皮紋系列（C／D 開頭）都可以。數位燙金對材質有一定要求，紋路較淺、表面平整的皮革，燙金圖文才能完整附著、呈現清晰細緻的效果。</p>
          </article>
          <article className="foil-guide-card">
            <FoilBadge />
            <h2>僅傳統燙金</h2>
            <p>翡翠、珠光、絲光、雲龍與單色系列，表面紋理或光澤較明顯，適合傳統燙金。不同金箔在亮度、附著力與耐磨度上各有差異，特殊需求建議先打樣測試。</p>
          </article>
        </div>

        <div className="sample-filters">
          <div className="sample-filter-row" role="group" aria-label="依燙金方式篩選">
            {foilFilters.map((item) => <button aria-pressed={foil === item.id} key={item.id} onClick={() => setFoil(item.id)} type="button">{item.label}<small>{covers.filter((sample) => matchesFoil(sample, item.id)).length}</small></button>)}
          </div>
          <div className="sample-filter-row" role="group" aria-label="依系列篩選">
            <button aria-pressed={series === "all"} onClick={() => setSeries("all")} type="button">全部系列</button>
            {leatherSeries.map((item) => <button aria-pressed={series === item.id} key={item.id} onClick={() => setSeries(item.id)} type="button">{item.name}<small>{item.prefix}</small></button>)}
          </div>
        </div>

        <p className="sample-result-count" aria-live="polite">共 {visible.length} 款</p>

        {groups.length === 0 ? <p className="sample-empty">這個條件沒有符合的皮革，請換一個篩選。</p> : groups.map((group) => (
          <section className="sample-series" key={group.id} aria-labelledby={`series-${group.id}`}>
            <div className="sample-series-heading">
              <h2 id={`series-${group.id}`}>{group.name}<span>{group.prefix}</span></h2>
              <p>{group.description}</p>
            </div>
            <div className="swatch-grid">
              {group.samples.map((sample) => (
                <button aria-label={`查看 ${sample.code}`} className="swatch" key={sample.code} onClick={() => setActive(sample)} type="button">
                  <span className="swatch-image"><Image alt="" fill sizes="(max-width: 720px) 30vw, 160px" src={sample.image} /></span>
                  <span className="swatch-meta"><strong>{sample.code}</strong><FoilBadge digital={sample.digitalFoil} /></span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </> : corners.length === 0 && <div className="sample-note"><strong>護角樣品請洽專人提供</strong></div>}

      <div className="sample-footer">
        <p>圖片可能因螢幕顯色產生差異，實際顏色與紋理以實體樣本為準。若有特殊材質、顏色或設計需求，建議先進行測試。</p>
        {selectMode ? <Link className="button button-secondary" href={returnTo || "/order"}>返回下單頁（保留草稿）</Link> : <Link className="button button-primary" href="/contact">索取實體樣本</Link>}
      </div>

      <dialog aria-labelledby="swatch-dialog-title" className="swatch-dialog" onClose={() => setActive(null)} onClick={(event) => { if (event.target === event.currentTarget) setActive(null); }} ref={dialogRef}>
        {active && <div className="swatch-dialog-body">
          <div className="swatch-dialog-image"><Image alt={`${active.code} 皮革紋理`} fill sizes="(max-width: 720px) 90vw, 420px" src={active.image} /></div>
          <div className="swatch-dialog-info">
            <p className="eyebrow">{active.name}</p>
            <h2 id="swatch-dialog-title">{active.code}</h2>
            <div className="swatch-dialog-badges">{active.digitalFoil ? <><FoilBadge digital /><span className="foil-badge">傳統燙金</span></> : <FoilBadge />}</div>
            <dl>
              <div><dt>適用</dt><dd>{active.appliesTo.join("、")}</dd></div>
              {(active.description || leatherSeries.find((item) => item.id === active.series)?.description) && <div><dt>特色</dt><dd>{active.description || leatherSeries.find((item) => item.id === active.series)?.description}</dd></div>}
            </dl>
            <div className="swatch-dialog-actions">
              {selectMode ? <button className="button button-primary" onClick={() => selectSample(active)} type="button">選擇此款</button> : <Link className="button button-primary" href="/contact">詢問這款皮革</Link>}
              <button className="button button-secondary" onClick={() => setActive(null)} type="button">關閉</button>
            </div>
          </div>
        </div>}
      </dialog>
    </section>
  );
}
