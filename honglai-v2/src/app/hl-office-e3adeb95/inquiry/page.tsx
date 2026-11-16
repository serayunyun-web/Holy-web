import type { Metadata } from "next";
import { AdminInquiry } from "@/components/admin/admin-inquiry";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = { title: "需求詳細｜後台", robots: { index: false, follow: false } };

export default function AdminInquiryPage() {
  return <AdminShell><AdminInquiry /></AdminShell>;
}
