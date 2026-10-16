"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navigation } from "@/data/site";

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
            src="/honglai-logo.png"
            style={{ height: "auto" }}
            width={964}
          />
        </Link>
        <nav className="desktop-nav" aria-label="主要導覽">
          {navigation.map((item) => (
            <Link className={`nav-link${item.emphasis ? " nav-order" : ""}${isActive(item.href) ? " active" : ""}`} href={item.href} key={item.href}>{item.label}</Link>
          ))}
        </nav>
        <button aria-expanded={isOpen} aria-label={isOpen ? "關閉選單" : "開啟選單"} className={`menu-button${isOpen ? " open" : ""}`} onClick={() => setIsOpen((current) => !current)} type="button"><span /></button>
      </div>
      <nav className={`mobile-nav${isOpen ? " open" : ""}`} aria-label="行動版導覽">
        {navigation.map((item) => (
          <Link className={`nav-link${item.emphasis ? " nav-order" : ""}${isActive(item.href) ? " active" : ""}`} href={item.href} key={item.href} onClick={() => setIsOpen(false)}>{item.label}</Link>
        ))}
      </nav>
    </header>
  );
}
