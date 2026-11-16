import type { Metadata } from "next";
import { QuoteConfirmation } from "@/components/quote-confirmation";

export const metadata: Metadata = { title: "確認正式報價", robots: { index: false, follow: false } };

export default function QuoteConfirmPage() {
  return <main><QuoteConfirmation /></main>;
}
