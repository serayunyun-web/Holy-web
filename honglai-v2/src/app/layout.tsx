import type { Metadata } from "next";
import { Noto_Sans_TC, Outfit } from "next/font/google";
import { AiFaqAssistant } from "@/components/ai-faq-assistant";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { LendAPawCursor } from "@/components/lend-a-paw-cursor";
import "./globals.css";

const notoSansTC = Noto_Sans_TC({ weight: "variable", display: "swap", preload: false, variable: "--font-noto-sans-tc" });
const outfit = Outfit({ weight: "variable", subsets: ["latin"], display: "swap", variable: "--font-outfit" });

export const metadata: Metadata = {
  title: { default: "鴻萊興業｜專業裝訂與印製服務", template: "%s｜鴻萊興業" },
  description: "鴻萊興業提供論文裝訂、證書夾、施工本、菜單與客製裝訂服務。網站價格僅供初步參考，正式價格與訂單須經人工確認。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html className={`${notoSansTC.variable} ${outfit.variable}`} data-scroll-behavior="smooth" lang="zh-Hant">
      <body>
        <a className="skip-link" href="#main-content">跳至主要內容</a>
        <Header />
        <div id="main-content">{children}</div>
        <AiFaqAssistant />
        <LendAPawCursor />
        <Footer />
      </body>
    </html>
  );
}
