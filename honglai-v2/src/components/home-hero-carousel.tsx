"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const slides = [
  {
    id: "brand",
    image: "/images/banners/home-brand-desktop-hq.webp",
    alt: "鴻萊興業裝訂與印刷成品展示",
    label: "品牌形象",
    title: <>用印刷，<br /><span>裝訂</span>每一個重要時刻。</>,
    description: "從一頁紙的構想，到一本書的完成。以二十餘年的印製與裝訂經驗，細心成就每一份值得珍藏的作品。",
    primary: { label: "探索服務", href: "/services" },
    secondary: { label: "企業合作", href: "/business" },
  },
  {
    id: "custom",
    image: "/images/banners/home-b2c-desktop-hq.webp",
    alt: "少量客製與個人創作書冊展示",
    label: "少量客製",
    title: <>即使只有一本，<br />也值得<span>用心製作</span>。</>,
    description: "創作的價值，從不以數量衡量。從個人作品集、特色書冊到少量客製裝訂，讓每一份獨一無二的想法，都能擁有專屬的模樣。",
    primary: { label: "瀏覽產品", href: "/services" },
    secondary: { label: "提出製作需求", href: "/order" },
  },
  {
    id: "foil",
    image: "/images/banners/home-foil-desktop-hq.webp",
    alt: "數位燙金皮革精裝封面展示",
    label: "數位燙金",
    title: <>數位燙金，<br />讓<span>精緻</span>更輕鬆實現。</>,
    description: "無須製作傳統燙金版，也能在皮革精裝封面呈現細膩的金屬光澤。省去製版成本、縮短製作準備時間，以更經濟、靈活的方式，成就每一份作品的精緻質感。",
    primary: { label: "了解數位燙金", href: "/business#partnership-service" },
    secondary: { label: "提出客製需求", href: "/order" },
  },
] as const;

const AUTOPLAY_DELAY = 7000;
const SWIPE_THRESHOLD = 48;

type HomeHeroCarouselProps = { headingLevel?: "h1" | "h2"; className?: string };

export function HomeHeroCarousel({ headingLevel: Heading = "h1", className = "" }: HomeHeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const selectSlide = useCallback((index: number, userInitiated = false) => {
    setActiveIndex((index + slides.length) % slides.length);
    if (userInitiated) setHasInteracted(true);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(media.matches);
    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || isHovered || isFocusWithin || hasInteracted) return;
    const timer = window.setInterval(() => setActiveIndex((current) => (current + 1) % slides.length), AUTOPLAY_DELAY);
    return () => window.clearInterval(timer);
  }, [hasInteracted, isFocusWithin, isHovered, prefersReducedMotion]);

  const finishSwipe = (clientX: number) => {
    if (touchStartX.current === null) return;
    const distance = clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(distance) < SWIPE_THRESHOLD) return;
    selectSlide(activeIndex + (distance < 0 ? 1 : -1), true);
  };

  return (
    <section
      aria-label="首頁精選內容"
      aria-roledescription="輪播"
      className={`home-hero-carousel ${className}`.trim()}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsFocusWithin(false);
      }}
      onFocus={() => setIsFocusWithin(true)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchEnd={(event) => finishSwipe(event.changedTouches[0]?.clientX ?? 0)}
      onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; }}
    >
      <div className="home-hero-stage">
        {slides.map((slide, index) => (
          <article
            aria-hidden={activeIndex !== index}
            aria-label={`${index + 1}／${slides.length}：${slide.label}`}
            className={`home-hero-slide${activeIndex === index ? " is-active" : ""}`}
            inert={activeIndex !== index}
            key={slide.id}
          >
            <Image
              alt={slide.alt}
              className="home-hero-image"
              fill
              loading={index === 0 ? "eager" : "lazy"}
              priority={index === 0}
              sizes="100vw"
              src={slide.image}
            />
            <div className="home-hero-shade" aria-hidden="true" />
            <div className="page-container home-hero-content">
              <div className="home-hero-copy">
                <Heading>{slide.title}</Heading>
                <p className="hero-lead">{slide.description}</p>
                <div className="hero-actions">
                  <Link className="button button-primary" href={slide.primary.href}>{slide.primary.label} <span aria-hidden="true">→</span></Link>
                  <Link className="button button-secondary" href={slide.secondary.href}>{slide.secondary.label} <span aria-hidden="true">→</span></Link>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <button className="carousel-arrow carousel-arrow-previous" onClick={() => selectSlide(activeIndex - 1, true)} type="button">
        <span aria-hidden="true">←</span><span className="sr-only">上一張 Banner</span>
      </button>
      <button className="carousel-arrow carousel-arrow-next" onClick={() => selectSlide(activeIndex + 1, true)} type="button">
        <span aria-hidden="true">→</span><span className="sr-only">下一張 Banner</span>
      </button>

      <div aria-label="選擇 Banner" className="carousel-dots" role="group">
        {slides.map((slide, index) => (
          <button
            aria-current={activeIndex === index ? "true" : undefined}
            aria-label={`顯示第 ${index + 1} 張：${slide.label}`}
            className={activeIndex === index ? "is-active" : ""}
            key={slide.id}
            onClick={() => selectSlide(index, true)}
            type="button"
          />
        ))}
      </div>
      <p aria-live="polite" className="sr-only">目前顯示第 {activeIndex + 1} 張，共 {slides.length} 張</p>
    </section>
  );
}
