"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type ModelViewerTexture = unknown;
type ModelViewerMaterial = {
  name: string;
  pbrMetallicRoughness: {
    baseColorTexture: { texture: ModelViewerTexture | null; setTexture: (texture: ModelViewerTexture | null) => void };
  };
};
type ModelViewerElement = HTMLElement & {
  model?: { materials: ModelViewerMaterial[] };
  createTexture: (url: string) => Promise<ModelViewerTexture>;
};

const MODEL_SRC = "/models/book.glb";
const LEATHER_SRC = "/models/leather-base.webp";
const LEATHER_MATERIAL = "MAT_Tan_Leather";
const COLOR_NOTICE = "顏色僅供參考，實際商品可能因螢幕顯示與光線而有色差。";

const swatches = [
  { id: "original", label: "黃色", hex: "#d8823a" },
  { id: "black", label: "黑色", hex: "#2c2e33" },
  { id: "red", label: "紅色", hex: "#60131b" },
  { id: "blue", label: "藍色", hex: "#1d274f" },
  { id: "green", label: "綠色", hex: "#003300" },
] as const;

type SwatchId = (typeof swatches)[number]["id"];
type LeatherPixels = { data: ImageData; median: number };

async function readLeatherPixels(): Promise<LeatherPixels> {
  const image = new Image();
  image.src = LEATHER_SRC;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("無法讀取皮革貼圖");
  context.drawImage(image, 0, 0);
  const data = context.getImageData(0, 0, canvas.width, canvas.height);
  const histogram = new Uint32Array(256);
  let count = 0;
  for (let i = 0; i < data.data.length; i += 16) {
    if (data.data[i + 3] === 0) continue;
    histogram[Math.round(0.2126 * data.data[i] + 0.7152 * data.data[i + 1] + 0.0722 * data.data[i + 2])]++;
    count++;
  }
  let accumulated = 0;
  let median = 1;
  for (let i = 0; i < histogram.length; i++) {
    accumulated += histogram[i];
    if (accumulated >= count / 2) { median = Math.max(1, i); break; }
  }
  return { data, median };
}

async function tintLeather(viewer: ModelViewerElement, source: LeatherPixels, hex: string) {
  const target = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16));
  const { data, median } = source;
  const canvas = document.createElement("canvas");
  canvas.width = data.width;
  canvas.height = data.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("無法產生皮革顏色");
  const tinted = context.createImageData(data.width, data.height);
  for (let i = 0; i < data.data.length; i += 4) {
    const ratio = (0.2126 * data.data[i] + 0.7152 * data.data[i + 1] + 0.0722 * data.data[i + 2]) / median;
    for (let channel = 0; channel < 3; channel++) tinted.data[i + channel] = Math.min(255, Math.round(target[channel] * ratio));
    tinted.data[i + 3] = data.data[i + 3];
  }
  context.putImageData(tinted, 0, 0);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => (result ? resolve(result) : reject(new Error("無法產生皮革顏色"))), "image/webp", 0.9);
  });
  const url = URL.createObjectURL(blob);
  try {
    return await viewer.createTexture(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function HomeHero3D() {
  const viewerRef = useRef<ModelViewerElement | null>(null);
  const leatherRef = useRef<ModelViewerMaterial | null>(null);
  const originalTextureRef = useRef<ModelViewerTexture | null>(null);
  const pixelsRef = useRef<Promise<LeatherPixels> | null>(null);
  const cacheRef = useRef(new Map<string, Promise<ModelViewerTexture>>());
  const requestRef = useRef(0);
  const [isReady, setIsReady] = useState(false);
  const [selected, setSelected] = useState<SwatchId>("original");
  const [status, setStatus] = useState("3D 書本載入中…");

  useEffect(() => {
    let cancelled = false;
    import("@google/model-viewer").then(() => {
      if (cancelled) return;
      const viewer = viewerRef.current;
      if (!viewer) return;
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) viewer.setAttribute("auto-rotate", "");
      const onLoad = () => {
        const leather = viewer.model?.materials.find((material) => material.name === LEATHER_MATERIAL);
        if (!leather?.pbrMetallicRoughness.baseColorTexture.texture) {
          setStatus("無法切換封面顏色：模型缺少皮革貼圖。");
          return;
        }
        leatherRef.current = leather;
        originalTextureRef.current = leather.pbrMetallicRoughness.baseColorTexture.texture;
        setIsReady(true);
        setStatus(COLOR_NOTICE);
      };
      const onError = () => setStatus("書本模型載入失敗，請重新整理頁面。");
      viewer.addEventListener("load", onLoad);
      viewer.addEventListener("error", onError);
      if (viewer.model) onLoad();
    }).catch(() => setStatus("書本模型載入失敗，請重新整理頁面。"));

    return () => { cancelled = true; };
  }, []);

  const chooseColor = async (id: SwatchId, hex: string) => {
    const viewer = viewerRef.current;
    const leather = leatherRef.current;
    if (!viewer || !leather) return;
    const request = ++requestRef.current;
    const slot = leather.pbrMetallicRoughness.baseColorTexture;
    if (id === "original") {
      slot.setTexture(originalTextureRef.current);
      setSelected(id);
      setStatus(COLOR_NOTICE);
      return;
    }
    setStatus("正在套用顏色…");
    try {
      pixelsRef.current ??= readLeatherPixels().catch((error) => { pixelsRef.current = null; throw error; });
      let texture = cacheRef.current.get(hex);
      if (!texture) {
        texture = pixelsRef.current.then((pixels) => tintLeather(viewer, pixels, hex));
        cacheRef.current.set(hex, texture);
        texture.catch(() => cacheRef.current.delete(hex));
      }
      const resolved = await texture;
      if (request !== requestRef.current) return;
      slot.setTexture(resolved);
      setSelected(id);
      setStatus(COLOR_NOTICE);
    } catch {
      if (request !== requestRef.current) return;
      setStatus("顏色套用失敗，請再選一次。");
    }
  };

  return (
    <section aria-labelledby="home-hero-title" className="home-hero-3d">
      <div className="home-hero-stage">
        <div className="page-container home-hero-content home-hero-3d-layout">
          <div className="home-hero-copy">
            <h1 id="home-hero-title">印刷之後的事，<br /><span>交給專業</span>。</h1>
            <p className="hero-lead">鴻萊興業專注印刷後加工與裝訂，論文、證書夾、施工本、菜單到各式客製加工皆可承作。個人少量或企業大量，都有專人確認每一項細節。</p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/services">了解服務項目 <span aria-hidden="true">→</span></Link>
            </div>
          </div>

          <div className="home-hero-3d-stage">
            <div className="home-hero-3d-viewer">
              <model-viewer
                ref={viewerRef}
                alt="可拖曳旋轉的皮革精裝書 3D 模型，封面顏色可切換"
                auto-rotate-delay="2500"
                camera-controls=""
                camera-orbit="35deg 60deg auto"
                disable-zoom=""
                disable-pan=""
                interaction-prompt="none"
                max-camera-orbit="auto 100deg auto"
                min-camera-orbit="auto 25deg auto"
                rotation-per-second="18deg"
                shadow-intensity="0.75"
                src={MODEL_SRC}
                touch-action="pan-y"
              />
              {!isReady && <p className="home-hero-3d-loading" aria-hidden="true">3D 書本載入中…</p>}
            </div>

            <div className="home-hero-3d-panel">
              <p className="home-hero-3d-panel-title">封面皮革顏色<small>可拖曳書本查看不同角度</small></p>
              <div aria-label="選擇封面皮革顏色" className="home-hero-3d-swatches" role="group">
                {swatches.map((swatch) => (
                  <button
                    aria-pressed={selected === swatch.id}
                    className="home-hero-3d-swatch"
                    disabled={!isReady}
                    key={swatch.id}
                    onClick={() => chooseColor(swatch.id, swatch.hex)}
                    type="button"
                  >
                    <span aria-hidden="true" style={{ background: swatch.hex }} />
                    {swatch.label}
                  </button>
                ))}
              </div>
              <p aria-live="polite" className="home-hero-3d-status" role="status">{status}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
