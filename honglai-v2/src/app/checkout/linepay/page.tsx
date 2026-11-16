import type { Metadata } from "next";
import { MockLinePayCheckout } from "@/components/mock-linepay-checkout";

export const metadata: Metadata = { title: "結帳（LINE Pay 示範）", robots: { index: false, follow: false } };

export default function MockLinePayPage() {
  return <main><MockLinePayCheckout /></main>;
}
