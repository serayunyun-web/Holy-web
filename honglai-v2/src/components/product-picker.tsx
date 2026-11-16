"use client";

import Image from "next/image";
import { useState } from "react";
import type { Product } from "@/data/catalog";
import { isAutoPriced } from "@/lib/pricing";

type ProductPickerProps = {
  products: readonly Product[];
  selectedSlug: string;
  onChoose: (slug: string) => void;
  /** 收合列上方仍要顯示的內容（例如分類篩選），只在展開時出現 */
  children?: React.ReactNode;
};

function Thumb({ item, sizes }: { item: Product; sizes: string }) {
  return <span className="pick-thumb" aria-hidden="true">{item.cardImage ? <Image alt="" fill sizes={sizes} src={item.cardImage} /> : item.title.slice(0, 1)}</span>;
}

function PriceTag({ slug }: { slug: string }) {
  const auto = isAutoPriced(slug);
  return <small className={`pick-tag ${auto ? "auto" : "manual"}`}>{auto ? "線上試算" : "專人報價"}</small>;
}

/** 查價與下單共用的產品選擇：小卡片網格，選定後收合成一列。 */
export function ProductPicker({ products, selectedSlug, onChoose, children }: ProductPickerProps) {
  const [expanded, setExpanded] = useState(false);
  const selected = products.find((item) => item.slug === selectedSlug);

  if (selected && !expanded) {
    return <div className="pick-selected">
      <Thumb item={selected} sizes="64px" />
      <span className="pick-selected-text"><small>已選擇</small><strong>{selected.title}</strong><PriceTag slug={selected.slug} /></span>
      <button className="pick-change" onClick={() => setExpanded(true)} type="button">更換產品</button>
    </div>;
  }

  return <div className="pick-root">
    {children}
    <div className="pick-grid">
      {products.map((item) => {
        const isSelected = item.slug === selectedSlug;
        return <button aria-pressed={isSelected} className="pick-card" key={item.id} onClick={() => { setExpanded(false); onChoose(item.slug); }} type="button">
          <Thumb item={item} sizes="(max-width: 700px) 50vw, 80px" />
          <span className="pick-text"><strong>{item.title}</strong><PriceTag slug={item.slug} /></span>
          {isSelected && <span className="pick-check" aria-hidden="true">✓</span>}
        </button>;
      })}
    </div>
  </div>;
}
