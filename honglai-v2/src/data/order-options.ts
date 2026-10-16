export type ProductId = "book-binding" | "menu" | "certificate-folder" | "construction-book" | "unsure";
export type FieldType = "text" | "number" | "select" | "textarea" | "radio";
export type OrderField = { id: string; label: string; type: FieldType; options?: readonly string[]; placeholder?: string; required?: boolean; help?: string; when?: { field: string; values: readonly string[] } };

export const safe = ["不需要", "尚未決定，請專人建議"] as const;
export const products = [
  { id: "book-binding", icon: "冊", name: "書籍裝訂", note: "論文、作品集、工程合約書與一般書冊" },
  { id: "menu", icon: "單", name: "菜單", note: "單張、摺頁、護貝與裝訂式菜單" },
  { id: "certificate-folder", icon: "證", name: "證書夾", note: "兩片式、三角與磁扣翻蓋式" },
  { id: "construction-book", icon: "工", name: "施工本", note: "工程圖冊、工程圖裝訂與施工資料本" },
  { id: "unsure", icon: "？", name: "其他／不確定需求", note: "先描述需求，再由專人協助判斷" },
] as const;

const size = ["A3", "A4", "A4R 橫式", "B5", "A5", "自訂尺寸", "不確定"];
const book: OrderField[] = [
  { id: "purpose", label: "用途", type: "select", required: true, options: ["論文", "作品集", "工程合約書", "一般書冊", "其他書籍"] },
  { id: "binding", label: "裝訂方式", type: "select", required: true, options: ["精裝", "彩色精裝", "平裝／膠裝", "騎馬釘", "縫線裝", "車線裝", "蝶冊", "螺絲裝", "雙線圈", "環裝", "不確定，請專人建議"] },
  { id: "size", label: "成品尺寸", type: "select", options: size }, { id: "orientation", label: "成品方向", type: "radio", options: ["直式", "橫式", "正方形", "不確定"] },
  { id: "pages", label: "內頁頁數或張數", type: "number", placeholder: "可先填約略數量" }, { id: "thickness", label: "書本厚度", type: "text", placeholder: "例如：約 20 mm／不確定" },
  { id: "insidePrint", label: "內頁印刷", type: "select", options: ["黑白", "彩色", "混合", "已印好只需裝訂", "不確定"] }, { id: "printSides", label: "印刷面", type: "select", options: ["單面", "雙面", "混合", "不確定"] },
  { id: "cover", label: "封面材質", type: "select", options: ["精裝硬殼", "彩色印刷封面", "皮面或膠皮", "客戶自行提供布面", "透明膠片", "自備封面", "不確定"] },
  { id: "coverSample", label: "皮面／膠皮", type: "select", options: ["不需要", "選擇樣品編號", "尚未決定，請專人建議", "客戶自行提供布面"], when: { field: "cover", values: ["皮面或膠皮"] } },
  { id: "turning", label: "翻閱方向", type: "radio", options: ["左翻", "右翻", "不確定"] }, { id: "coverFinish", label: "封面加工", type: "select", options: ["燙金", "數位燙金", "校徽或 Logo", "折書口", "鬆緊帶", "不需要", "不確定"] },
  { id: "thesisBound", label: "內頁是否已完成膠裝", type: "select", options: ["是", "否", "不確定"], when: { field: "purpose", values: ["論文"] } },
  { id: "foilText", label: "燙金內容", type: "textarea", placeholder: "請描述文字、Logo 或校徽需求", when: { field: "purpose", values: ["論文", "工程合約書"] } },
  { id: "mounting", label: "蝶冊裱法", type: "radio", options: ["直裱", "厚裱", "不確定"], when: { field: "binding", values: ["蝶冊"] } },
  { id: "screw", label: "螺絲形式與孔數", type: "text", placeholder: "不確定可留白", when: { field: "binding", values: ["螺絲裝"] } },
  { id: "corner", label: "護角", type: "select", options: ["不需要", "選擇護角編號", "尚未決定，請專人建議"], when: { field: "binding", values: ["螺絲裝"] } },
  { id: "coverFilm", label: "封面膠片", type: "select", options: ["需要", "不需要", "不確定"], when: { field: "binding", values: ["雙線圈", "環裝"] } },
  { id: "saddleCover", label: "是否包含封面", type: "select", options: ["包含", "不包含", "不確定"], when: { field: "binding", values: ["騎馬釘"] } },
];
const menu: OrderField[] = [
  { id: "menuType", label: "菜單類型", type: "select", required: true, options: ["單張菜單", "對摺／多摺菜單", "雙面護貝菜單", "螺絲裝菜單", "Q 桿菜單", "書冊式菜單", "不確定"] },
  { id: "size", label: "成品尺寸", type: "select", options: ["A3", "A4", "A5", "自訂尺寸", "不確定"] }, { id: "openSize", label: "展開尺寸", type: "text", when: { field: "menuType", values: ["對摺／多摺菜單"] } },
  { id: "print", label: "印刷方式", type: "select", options: ["單面彩色", "雙面彩色", "黑白", "不確定"] }, { id: "pages", label: "頁數或張數", type: "number" },
  { id: "material", label: "材質", type: "select", options: ["一般紙材", "厚卡紙", "防水材質", "皮面或膠皮", "自備材料", "不確定"] },
  { id: "coverSample", label: "皮面／膠皮", type: "select", options: ["不需要", "選擇樣品編號", "尚未決定，請專人建議", "客戶自行提供布面"], when: { field: "material", values: ["皮面或膠皮"] } },
  { id: "accessory", label: "裝訂與配件", type: "select", options: ["螺絲", "Q 桿", "護角", "腰折線", "封面內貼", "不需要", "不確定"] },
  { id: "corner", label: "護角", type: "select", options: ["不需要", "選擇護角編號", "尚未決定，請專人建議"], when: { field: "accessory", values: ["護角"] } },
  { id: "lamination", label: "是否需要護貝", type: "radio", options: ["需要", "不需要", "不確定"] }, { id: "design", label: "設計狀態", type: "select", options: ["設計已完成", "只有文字與照片", "尚未設計", "不確定"] },
];
const certificate: OrderField[] = [
  { id: "style", label: "樣式", type: "select", required: true, options: ["普通兩片式", "泡棉兩片式", "皮面三角", "緞帶三角", "磁扣翻蓋式", "不確定"] }, { id: "size", label: "證書尺寸", type: "select", options: ["A4", "自訂尺寸", "不確定"] },
  { id: "opening", label: "開啟方向", type: "radio", options: ["左右翻", "上下翻", "不確定"] }, { id: "material", label: "外層材質", type: "select", options: ["紙面", "皮面或膠皮", "客戶自行提供布面", "其他", "不確定"] },
  { id: "coverSample", label: "皮面／膠皮", type: "select", options: ["不需要", "選擇樣品編號", "尚未決定，請專人建議", "客戶自行提供布面"], when: { field: "material", values: ["皮面或膠皮"] } },
  { id: "fixing", label: "內頁固定方式", type: "select", options: ["四角固定", "緞帶固定", "內袋", "其他", "不確定"] }, { id: "lining", label: "內貼", type: "select", options: ["米色紙內貼", "硬殼內貼", "不需要", "不確定"] },
  { id: "finish", label: "封面加工", type: "select", options: ["燙金文字", "燙金 Logo 或校徽", "彩色印刷", "不需要", "不確定"] }, { id: "corner", label: "護角", type: "select", options: ["不需要", "選擇護角編號", "尚未決定，請專人建議"] },
];
const construction: OrderField[] = [
  { id: "constructionType", label: "類型", type: "select", required: true, options: ["工程圖冊", "工程圖裝訂", "一般施工資料本", "不確定"] }, { id: "sourceSize", label: "原始圖面尺寸", type: "select", options: ["A1", "A2", "A3", "其他", "不確定"] },
  { id: "finishSize", label: "裝訂後尺寸", type: "select", options: ["A1 到 A2", "A2 到 A3", "A3 到 A4", "自訂尺寸", "不確定"] }, { id: "sheets", label: "圖面張數", type: "number" }, { id: "thickness", label: "完成厚度", type: "text" },
  { id: "constructionCover", label: "封面方式", type: "select", help: "施工本專用皮／厚軟皮不屬於編號樣品。", options: ["施工本專用皮", "厚軟皮", "透明膠片", "自備封面", "不確定"] },
  { id: "binding", label: "裝訂方式", type: "select", options: ["膠裝", "螺絲裝", "打孔裝冊", "其他", "不確定"] }, { id: "folding", label: "是否需要摺圖", type: "radio", options: ["需要", "不需要", "不確定"] }, { id: "finish", label: "封面加工", type: "select", options: ["燙金", "彩色印刷", "不需要", "不確定"] },
];
const unsure: OrderField[] = [
  { id: "item", label: "想製作的物品", type: "text", required: true }, { id: "occasion", label: "使用場合或用途", type: "text" }, { id: "approxSize", label: "大約尺寸", type: "text" }, { id: "reference", label: "是否有參考成品", type: "select", options: ["有", "沒有", "不確定"] }, { id: "appearance", label: "希望的材質或外觀", type: "textarea" }, { id: "help", label: "希望專人協助判斷的問題", type: "textarea" },
];
export const fieldsByProduct: Record<ProductId, readonly OrderField[]> = { "book-binding": book, menu, "certificate-folder": certificate, "construction-book": construction, unsure };
export const commonFields: readonly OrderField[] = [
  { id: "projectName", label: "製作名稱", type: "text", required: true }, { id: "quantity", label: "製作數量", type: "number", required: true }, { id: "wantedDate", label: "希望完成日期", type: "text", placeholder: "例如：2026/11/30", help: "此日期為希望時間，實際交期須由專人確認。" },
  { id: "budget", label: "製作預算（選填）", type: "text", help: "僅供需求了解，不作為估價依據。" }, { id: "fileStatus", label: "檔案準備狀態", type: "select", options: ["已有完整檔案", "有部分檔案", "尚未準備", "不確定需要哪些檔案"] }, { id: "special", label: "加工或特殊需求", type: "textarea" }, { id: "notes", label: "製作備註", type: "textarea" },
];
