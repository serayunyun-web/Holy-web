type NavigationItem = {
  label: string;
  href: string;
  emphasis?: boolean;
};

export const navigation: readonly NavigationItem[] = [
  { label: "首頁", href: "/" },
  { label: "服務與產品", href: "/services" },
  { label: "企業合作", href: "/business" },
  { label: "快速查價", href: "/quote" },
  { label: "常見問題", href: "/faq" },
  { label: "聯絡我們", href: "/contact" },
  { label: "線上下單", href: "/order", emphasis: true },
] as const;

export { activeProducts as featuredProducts } from "@/data/catalog";
