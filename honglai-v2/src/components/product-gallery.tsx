"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductImage } from "@/data/catalog";

type ProductGalleryProps = { images: readonly ProductImage[]; productName: string };

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [index, setIndex] = useState(0);
  const selected = images[index] ?? images[0];

  if (!selected) return null;

  const count = images.length;
  const go = (step: number) => setIndex((current) => (current + step + count) % count);

  return (
    <div className="product-gallery">
      <div className={`product-gallery-main ${selected.tone}`} role="group" aria-roledescription="圖片輪播" aria-label={`${productName}圖片 ${index + 1}／${count}`}>
        {selected.src ? <Image alt={selected.alt} className="product-gallery-image" fill priority sizes="(max-width: 1240px) 100vw, 1200px" src={selected.src} /> : <div className="gallery-placeholder" role="img" aria-label={selected.alt}>
          <div className="gallery-object gallery-object-back" aria-hidden="true" />
          <div className="gallery-object gallery-object-front" aria-hidden="true" />
          <span className="gallery-status">示意佔位圖</span>
          <strong>{String(index + 1).padStart(2, "0")}｜{selected.label}</strong>
          <small>後續替換為鴻萊正式產品照片</small>
        </div>}
        {count > 1 && <>
          <button aria-label="上一張" className="gallery-arrow gallery-arrow-prev" onClick={() => go(-1)} type="button"><span aria-hidden="true" /></button>
          <button aria-label="下一張" className="gallery-arrow gallery-arrow-next" onClick={() => go(1)} type="button"><span aria-hidden="true" /></button>
        </>}
      </div>
      {count > 1 && <div className="product-thumbnails" style={{ "--thumb-count": count } as React.CSSProperties} aria-label={`${productName}圖片選擇`}>
        {images.map((image, i) => <button aria-label={`查看${image.label}`} aria-pressed={i === index} className={`product-thumbnail ${image.tone}`} key={image.id} onClick={() => setIndex(i)} type="button">
          {image.src ? <Image alt="" fill sizes="(max-width: 720px) 25vw, 300px" src={image.src} /> : <><span>{String(i + 1).padStart(2, "0")}</span><small>{image.label}</small></>}
        </button>)}
      </div>}
    </div>
  );
}
