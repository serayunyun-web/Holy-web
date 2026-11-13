"use client";

import { useEffect, useRef, useState } from "react";

export const PAW_CURSOR_CONFIG = {
  furColor: "#AC856B",
  padColor: "#D99999",
  padPrintColor: "#C5A29A",
  size: 40,
  maxPrintLifeTime: 1500,
  laserColor: "#E57373",
  maxPrints: 12,
  followEase: 0.18,
} as const;

const STORAGE_KEY = "honglai-lend-a-paw-enabled";

type PawPrint = { bornAt: number; rotation: number; x: number; y: number };

function isDisabledTarget(element: Element | null) {
  if (!element) return false;
  const control = element.closest("button, input, select, textarea, [aria-disabled='true']") as HTMLButtonElement | HTMLInputElement | null;
  return Boolean(control && (control.disabled || control.getAttribute("aria-disabled") === "true"));
}

function isInteractiveTarget(element: Element | null) {
  if (!element || isDisabledTarget(element)) return false;
  return Boolean(element.closest("a[href], button, [role='button'], summary, label, input[type='checkbox'], input[type='radio']"));
}

function drawPawPrint(context: CanvasRenderingContext2D, item: PawPrint, now: number) {
  const life = Math.min(1, (now - item.bornAt) / PAW_CURSOR_CONFIG.maxPrintLifeTime);
  const fade = life < 0.68 ? 1 : 1 - (life - 0.68) / 0.32;
  const scale = 0.72 + Math.min(life * 4, 1) * 0.28;
  context.save();
  context.translate(item.x, item.y);
  context.rotate(item.rotation);
  context.scale(scale, scale);
  context.globalAlpha = Math.max(0, fade) * 0.62;
  context.fillStyle = PAW_CURSOR_CONFIG.padPrintColor;
  context.beginPath();
  context.ellipse(0, 4, 8, 7, 0, 0, Math.PI * 2);
  context.fill();
  [[-9, -5], [-3, -10], [4, -10], [10, -5]].forEach(([x, y], index) => {
    context.beginPath();
    context.ellipse(x, y, index === 0 || index === 3 ? 3.2 : 3.5, 4.5, x * 0.025, 0, Math.PI * 2);
    context.fill();
  });
  context.restore();
}

function drawPaw(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  pressing: boolean,
  reaching: boolean,
) {
  const size = PAW_CURSOR_CONFIG.size;
  const pressScale = pressing ? 0.88 : 1;
  context.save();
  context.translate(x, y + (pressing ? 3 : 0));
  context.rotate(angle);
  context.scale(pressScale, pressScale);

  context.shadowColor = "rgb(55 37 28 / 24%)";
  context.shadowBlur = 9;
  context.shadowOffsetY = 5;
  const fur = context.createLinearGradient(-size * 0.4, -size * 0.6, size * 0.45, size * 0.55);
  fur.addColorStop(0, "#D1B29B");
  fur.addColorStop(0.4, PAW_CURSOR_CONFIG.furColor);
  fur.addColorStop(1, "#815F4C");
  context.fillStyle = fur;
  context.beginPath();
  context.roundRect(-size * 0.36, -size * 0.62, size * 0.72, size * 1.02, size * 0.3);
  context.fill();

  const toeLift = reaching ? -2 : 0;
  const toes = [[-13, -13], [-5, -18], [5, -18], [13, -13]];
  toes.forEach(([toeX, toeY], index) => {
    context.fillStyle = index === 0 ? "#9B735C" : PAW_CURSOR_CONFIG.furColor;
    context.beginPath();
    context.ellipse(toeX, toeY + toeLift, 7.2, reaching ? 10.5 : 9, toeX * 0.018, 0, Math.PI * 2);
    context.fill();
  });

  context.shadowColor = "transparent";
  context.fillStyle = PAW_CURSOR_CONFIG.padColor;
  context.beginPath();
  context.ellipse(0, 3, 9.5, 8.2, 0, 0, Math.PI * 2);
  context.fill();
  [[-11, -10], [-4, -14], [4, -14], [11, -10]].forEach(([padX, padY], index) => {
    context.beginPath();
    context.ellipse(padX, padY + toeLift, index === 0 || index === 3 ? 3.4 : 3.7, 4.7, padX * 0.02, 0, Math.PI * 2);
    context.fill();
  });

  context.strokeStyle = "rgb(255 247 239 / 48%)";
  context.lineWidth = 1.35;
  context.beginPath();
  context.arc(-4, -3, 12, Math.PI * 1.12, Math.PI * 1.72);
  context.stroke();
  context.restore();
}

export function LendAPawCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const pointerRef = useRef({ x: -100, y: -100, pawX: -100, pawY: -100, velocityX: 0, visible: false });
  const printsRef = useRef<PawPrint[]>([]);
  const pressingRef = useRef(false);
  const reachingRef = useRef(false);
  const [finePointer, setFinePointer] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [preferenceReady, setPreferenceReady] = useState(false);

  useEffect(() => {
    const pointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMedia = () => {
      setFinePointer(pointerQuery.matches);
      setReducedMotion(motionQuery.matches);
    };
    const initializeFrame = window.requestAnimationFrame(() => {
      syncMedia();
      const stored = window.localStorage.getItem(STORAGE_KEY);
      setEnabled(stored === null ? !motionQuery.matches : stored === "true");
      setPreferenceReady(true);
    });
    pointerQuery.addEventListener("change", syncMedia);
    motionQuery.addEventListener("change", syncMedia);
    return () => {
      window.cancelAnimationFrame(initializeFrame);
      pointerQuery.removeEventListener("change", syncMedia);
      motionQuery.removeEventListener("change", syncMedia);
    };
  }, []);

  const active = preferenceReady && finePointer && enabled && !reducedMotion;

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    document.documentElement.classList.add("paw-cursor-active");
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * ratio);
      canvas.height = Math.round(window.innerHeight * ratio);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const updateTarget = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== "mouse" && event.pointerType !== "pen") return;
      const pointer = pointerRef.current;
      pointer.velocityX = event.clientX - pointer.x;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      const target = document.elementFromPoint(event.clientX, event.clientY);
      reachingRef.current = isInteractiveTarget(target);
      if (!pointer.visible) {
        pointer.pawX = event.clientX + 24;
        pointer.pawY = event.clientY + 22;
      }
      pointer.visible = true;
    };
    const press = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== "mouse" && event.pointerType !== "pen") return;
      pressingRef.current = true;
      printsRef.current = [
        ...printsRef.current.slice(-(PAW_CURSOR_CONFIG.maxPrints - 1)),
        { bornAt: performance.now(), rotation: (Math.random() - 0.5) * 0.42, x: event.clientX, y: event.clientY },
      ];
    };
    const release = () => { pressingRef.current = false; };
    const leave = () => { pointerRef.current.visible = false; };
    const render = (now: number) => {
      const pointer = pointerRef.current;
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      printsRef.current = printsRef.current.filter((item) => now - item.bornAt < PAW_CURSOR_CONFIG.maxPrintLifeTime);
      printsRef.current.forEach((item) => drawPawPrint(context, item, now));
      if (pointer.visible) {
        const targetX = pointer.x + 23;
        const targetY = pointer.y + 21;
        pointer.pawX += (targetX - pointer.pawX) * PAW_CURSOR_CONFIG.followEase;
        pointer.pawY += (targetY - pointer.pawY) * PAW_CURSOR_CONFIG.followEase;
        pointer.velocityX *= 0.88;
        const angle = Math.max(-0.22, Math.min(0.22, pointer.velocityX * 0.008));
        context.save();
        context.shadowColor = PAW_CURSOR_CONFIG.laserColor;
        context.shadowBlur = 5;
        context.fillStyle = PAW_CURSOR_CONFIG.laserColor;
        context.beginPath();
        context.arc(pointer.x, pointer.y, 2.6, 0, Math.PI * 2);
        context.fill();
        context.restore();
        drawPaw(context, pointer.pawX, pointer.pawY, angle, pressingRef.current, reachingRef.current);
      }
      animationFrameRef.current = window.requestAnimationFrame(render);
    };
    const onVisibility = () => {
      if (document.hidden && animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      } else if (!document.hidden && animationFrameRef.current === null) {
        animationFrameRef.current = window.requestAnimationFrame(render);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", updateTarget, { passive: true });
    window.addEventListener("pointerdown", press, { passive: true });
    window.addEventListener("pointerup", release, { passive: true });
    window.addEventListener("pointercancel", release, { passive: true });
    window.addEventListener("blur", leave);
    document.documentElement.addEventListener("mouseleave", leave);
    document.addEventListener("visibilitychange", onVisibility);
    animationFrameRef.current = window.requestAnimationFrame(render);
    return () => {
      if (animationFrameRef.current !== null) window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      document.documentElement.classList.remove("paw-cursor-active");
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", updateTarget);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("blur", leave);
      document.documentElement.removeEventListener("mouseleave", leave);
      document.removeEventListener("visibilitychange", onVisibility);
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      printsRef.current = [];
    };
  }, [active]);

  if (!preferenceReady || !finePointer) return null;

  const toggle = () => {
    if (reducedMotion) return;
    setEnabled((current) => {
      const next = !current;
      window.localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  return (
    <>
      <canvas aria-hidden="true" className="paw-cursor-canvas" ref={canvasRef} />
      <button
        aria-label={reducedMotion ? "系統已啟用減少動態效果，貓手游標停用" : active ? "關閉貓手游標" : "開啟貓手游標"}
        aria-pressed={active}
        className="paw-cursor-toggle"
        data-native-cursor
        disabled={reducedMotion}
        onClick={toggle}
        type="button"
      >
        <span aria-hidden="true" className="paw-toggle-icon" />
        <span>{reducedMotion ? "動態已減少" : active ? "貓手開啟" : "貓手關閉"}</span>
      </button>
    </>
  );
}
