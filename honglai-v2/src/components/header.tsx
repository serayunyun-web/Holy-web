"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SocialLinks } from "@/components/social-links";
import { navigation } from "@/data/site";
import { withBase } from "@/lib/base-path";

export function Header() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const isActive = (href: string) => href === "/" ? pathname === href : pathname.startsWith(href);

  return (
    <header className="site-header">
      <div className="page-container header-inner">
        <Link className="brand" href="/" onClick={() => setIsOpen(false)}>
          <Image
            alt="鴻萊興業有限公司｜數位印刷後加工專業廠"
            className="brand-logo"
            height={250}
            loading="eager"
            priority
            src={withBase("/honglai-logo.png")}
            style={{ height: "auto" }}
            width={964}
          />
        </Link>
        <nav className="desktop-nav" aria-label="主要導覽">
          <SlidingNav isActive={isActive} pathname={pathname} />
          {navigation.filter((item) => item.emphasis).map((item) => (
            <Link className={`nav-link nav-order${isActive(item.href) ? " active" : ""}`} href={item.href} key={item.href}>{item.label}</Link>
          ))}
          <SocialLinks className="header-social" />
        </nav>
        <button aria-expanded={isOpen} aria-label={isOpen ? "關閉選單" : "開啟選單"} className={`menu-button${isOpen ? " open" : ""}`} onClick={() => setIsOpen((current) => !current)} type="button"><span /></button>
      </div>
      <nav className={`mobile-nav${isOpen ? " open" : ""}`} aria-label="行動版導覽">
        {navigation.map((item) => (
          <Link className={`nav-link${item.emphasis ? " nav-order" : ""}${isActive(item.href) ? " active" : ""}`} href={item.href} key={item.href} onClick={() => setIsOpen(false)}>{item.label}</Link>
        ))}
        <SocialLinks className="mobile-social" />
      </nav>
    </header>
  );
}

type SliderBox = { x: number; width: number; visible: boolean };

/** 桌面版導覽：膠囊滑塊跟著滑鼠移動，離開選單後回到目前頁面（「線上下單」不在其中）。 */
function SlidingNav({ isActive, pathname }: { isActive: (href: string) => boolean; pathname: string }) {
  const items = navigation.filter((item) => !item.emphasis);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [hovered, setHovered] = useState<number | null>(null);
  const [box, setBox] = useState<SliderBox>({ x: 0, width: 0, visible: false });
  const [animate, setAnimate] = useState(false);
  const activeIndex = items.findIndex((item) => isActive(item.href));
  const target = hovered ?? (activeIndex >= 0 ? activeIndex : null);

  useLayoutEffect(() => {
    const measure = () => {
      const link = target === null ? null : linkRefs.current[target];
      setBox((current) => link ? { x: link.offsetLeft, width: link.offsetWidth, visible: true } : { ...current, visible: false });
    };
    measure();
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure);
    return () => window.removeEventListener("resize", measure);
  }, [target, pathname]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className={`nav-track${animate ? " is-animated" : ""}`} onPointerLeave={() => setHovered(null)}>
      <span aria-hidden="true" className={`nav-slider${box.visible ? " visible" : ""}`} style={{ transform: `translateX(${box.x}px)`, width: box.width }} />
      {items.map((item, index) => (
        <Link
          className={`nav-link${isActive(item.href) ? " active" : ""}${index === target ? " on-slider" : ""}`}
          href={item.href}
          key={item.href}
          onBlur={() => setHovered(null)}
          onFocus={() => setHovered(index)}
          onPointerEnter={() => setHovered(index)}
          ref={(node) => { linkRefs.current[index] = node; }}
        >{item.label}</Link>
      ))}
    </div>
  );
}
