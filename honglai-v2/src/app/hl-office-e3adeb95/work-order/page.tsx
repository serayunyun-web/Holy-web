import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminWorkOrder } from "@/components/admin/admin-work-order";

export const metadata: Metadata = { title: "工作單｜後台", robots: { index: false, follow: false } };

export default function AdminWorkOrderPage() {
  return <AdminShell><AdminWorkOrder /></AdminShell>;
}
