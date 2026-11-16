import type { Metadata } from "next";
import { AdminHome } from "@/components/admin/admin-home";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = { title: "後台", robots: { index: false, follow: false } };

export default function AdminPage() {
  return <AdminShell><AdminHome /></AdminShell>;
}
