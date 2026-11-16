// 人工報價產品的需求欄位。已依使用者要求移除「不確定／尚未決定／請專人建議／自訂尺寸／其他」等選項；
// 可自動計價的產品改用 src/lib/pricing（supabase/functions/_shared/pricing.ts）定義的規格欄位。
export type FormType = "book-binding" | "menu" | "certificate-folder" | "construction-book";
export type FieldType = "text" | "number" | "date" | "select" | "textarea" | "radio";
export type OrderField = { id: string; label: string; type: FieldType; options?: readonly string[]; placeholder?: string; required?: boolean; help?: string; when?: { field: string; values: readonly string[] } };

export const formTypes = [
  { id: "book-binding", icon: "冊", name: "書籍裝訂", note: "論文、作品集、工程合約書與一般書冊" },
  { id: "menu", icon: "單", name: "菜單", note: "螺絲裝菜單" },
  { id: "certificate-folder", icon: "證", name: "證書夾", note: "兩片式與磁扣翻蓋式" },
  { id: "construction-book", icon: "工", name: "施工本", note: "工程圖冊與工程圖裝訂" },
] as const;

const book: OrderField[] = [
  { id: "purpose", label: "用途", type: "select", required: true, options: ["論文", "作品集", "工程合約書", "一般書冊"] },
  { id: "size", label: "成品尺寸", type: "select", required: true, options: ["A3", "A4", "A4R 橫式", "B5", "A5"] },
  { id: "orientation", label: "成品方向", type: "radio", options: ["直式", "橫式", "正方形"] },
  { id: "pages", label: "內頁頁數", type: "number", placeholder: "例如 120" },
  { id: "insidePrint", label: "內頁印刷", type: "select", options: ["黑白", "彩色", "黑白彩色混合", "已印好只需裝訂"] },
  { id: "printSides", label: "印刷面", type: "select", options: ["單面", "雙面"] },
  { id: "cover", label: "封面材質", type: "select", options: ["精裝硬殼", "彩色印刷封面", "皮面或膠皮", "客戶自行提供布面", "透明膠片", "自備封面"] },
  { id: "coverSample", label: "皮面／膠皮", type: "select", options: ["選擇樣品編號", "客戶自行提供布面"], when: { field: "cover", values: ["皮面或膠皮"] } },
  { id: "turning", label: "翻閱方向", type: "radio", options: ["左翻", "右翻"] },
  { id: "coverFinish", label: "封面加工", type: "select", options: ["不需要", "燙金", "數位燙金", "校徽或 Logo", "折書口", "鬆緊帶"] },
  { id: "coverFilm", label: "封面膠片", type: "select", options: ["需要", "不需要"], when: { field: "cover", values: ["透明膠片"] } },
];

export const productFormTypeBySlug = {
  "thesis-binding": "book-binding",
  "certificate-folder": "certificate-folder",
  "construction-book": "construction-book",
  "engineering-contract": "book-binding",
  "perfect-binding": "book-binding",
  "hardcover": "book-binding",
  "sewn-softcover": "book-binding",
  "sewn-hardcover": "book-binding",
  "exposed-spine-sewn": "book-binding",
  "machine-sewn-binding": "book-binding",
  "saddle-stitch": "book-binding",
  "ring-binding": "book-binding",
  "butterfly-book": "book-binding",
  "menu-production": "menu",
  "q-rod-hardcover": "book-binding",
  "screw-contract": "book-binding",
} as const satisfies Record<string, FormType>;

/** 只有人工報價產品會用到這組欄位；自動計價產品的 menu／證書夾／施工本規格由計價引擎提供。 */
export const fieldsByProduct: Record<FormType, readonly OrderField[]> = { "book-binding": book, menu: book, "certificate-folder": book, "construction-book": book };

export const commonFields: readonly OrderField[] = [
  { id: "quantity", label: "製作數量", type: "number", required: true },
  { id: "coverColor", label: "封面顏色／樣品編號", type: "text", placeholder: "例如：深藍皮面、樣品 L-03" },
  { id: "foilContent", label: "燙金內容", type: "textarea", placeholder: "需要燙金時，請填寫文字、Logo 或校徽說明" },
  { id: "wantedDate", label: "希望完成日期", type: "date", help: "此日期為希望時間，實際交期須由專人確認。" },
  { id: "projectName", label: "製作名稱（選填）", type: "text", placeholder: "例如：碩士論文、公司年報" },
  { id: "notes", label: "製作備註", type: "textarea" },
];
