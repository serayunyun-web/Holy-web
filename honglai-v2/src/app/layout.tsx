import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "鴻萊興業｜專業裝訂與印製服務", template: "%s｜鴻萊興業" },
  description: "鴻萊興業提供論文裝訂、證書夾、施工本、菜單與客製裝訂服務。網站價格僅供初步參考，正式價格與訂單須經人工確認。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html data-scroll-behavior="smooth" lang="zh-Hant">
      <body>
        <a className="skip-link" href="#main-content">跳至主要內容</a>
        <Header />
        <div id="main-content">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
