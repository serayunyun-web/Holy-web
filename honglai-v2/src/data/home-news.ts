export type HomeNewsItem = {
  id: string;
  date: string;
  title: string;
  href: string;
};

// 開發階段靜態資料；未來可由 Supabase 查詢結果替換同一資料形狀。
export const homeNews: readonly HomeNewsItem[] = [
  { id: "dev-services", date: "2026.10.14", title: "【開發測試】服務與產品頁導覽示意", href: "/services" },
  { id: "dev-quote", date: "2026.10.14", title: "【開發測試】快速查價流程入口示意", href: "/quote" },
  { id: "dev-order", date: "2026.10.14", title: "【開發測試】線上下單需求填寫入口示意", href: "/order" },
] as const;
