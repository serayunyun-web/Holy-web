"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductImage } from "@/data/catalog";

type ProductGalleryProps = { images: readonly ProductImage[]; productName: string };

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedId, setSelectedId] = useState(images[0]?.id);
  const selected = images.find((image) => image.id === selectedId) ?? images[0];

  if (!selected) return null;

  return (
    <div className="product-gallery">
      <div className={`product-gallery-main ${selected.tone}`} role="img" aria-label={selected.alt}>
        {selected.src ? <Image alt={selected.alt} className="product-gallery-image" fill priority sizes="(max-width: 1040px) 100vw, 55vw" src={selected.src} /> : <>
          <div className="gallery-object gallery-object-back" aria-hidden="true" />
          <div className="gallery-object gallery-object-front" aria-hidden="true" />
          <span className="gallery-status">示意佔位圖</span>
          <strong>{selected.label}</strong>
          <small>後續替換為鴻萊正式產品照片</small>
        </>}
      </div>
      <div className="product-thumbnails" aria-label={`${productName}圖片選擇`}>
        {images.map((image, index) => <button aria-label={`查看${image.label}`} aria-pressed={selected.id === image.id} className={`product-thumbnail ${image.tone}`} key={image.id} onClick={() => setSelectedId(image.id)} type="button"><span>{String(index + 1).padStart(2, "0")}</span><small>{image.label}</small></button>)}
      </div>
    </div>
  );
}
