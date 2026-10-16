import type { Metadata } from "next";
import { FaqBrowser } from "@/components/faq-browser";

export const metadata: Metadata = {
  title: "常見問題",
  description: "瀏覽鴻萊興業印刷估價、稿件檔案、色彩品質、數位印刷、後加工、配送與聯絡服務等常見問題。",
};

export default function FaqPage() {
  return <FaqBrowser />;
}
