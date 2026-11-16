// 鴻萊 V2 共用計價引擎：前台即時試算與 Edge Function 後端驗證共用同一份程式與價目資料。
// 規則來源：使用者確認之「金額確認」「價格規則」「運費」工作表（2026-11-16）。
// - B2B 與 B2C 同價，一律使用價目表原價（不加 35）。
// - 一般品項 40 本以上轉人工；證書夾例外（40~99 本 9 折、100~199 本 8 折）。
// - 1~2 本打樣：價目表未另列打樣價者 +50／本；價目表已列 1~2 本價格者不再加價。
// - 價目表缺少必要資料的組合一律轉人工，不推測價格。
import { PRICE_ROWS } from "./price-table.generated.ts";

export const PRICE_VERSION = "2026-11-16";
export const ESTIMATE_DISCLAIMER = "此為系統試算金額，實際製作金額及交期以專人確認後提供的正式報價為準。";

export type Values = Record<string, string | undefined>;
type Condition = { field: string; values: readonly string[] };
type FieldBase = { id: string; label: string; help?: string; when?: Condition; unless?: Condition };
export type SelectField = FieldBase & { kind: "select"; options: readonly string[] };
export type NumberField = FieldBase & { kind: "number"; min: number; max: number; unit: string; placeholder?: string };
export type PricingField = SelectField | NumberField;
export type PriceLine = { label: string; unitPrice: number; quantity: number; unit: string; amount: number; source: string };
export type ShippingChoice = { id: string; label: string; fee: number; note: string; needsDistrict: boolean; needsAddress: boolean };

export type Estimate = {
  priceVersion: string;
  status: "priced" | "manual" | "incomplete";
  lines: PriceLine[];
  subtotal: number | null;
  shipping: { id: string; label: string; fee: number; district?: string } | null;
  total: number | null;
  notes: string[];
  reason?: string;
};

type Calc = { lines: PriceLine[]; notes?: string[] } | { manual: string };
type PricingProduct = {
  slug: string;
  title: string;
  fields: readonly PricingField[];
  /** included：價目表已含 1~2 本價格；sample50：1~2 本 +50／本 */
  smallQuantity: "included" | "sample50";
  maxAutoQuantity: number;
  calc: (values: Values, quantity: number) => Calc;
};

/* ---------- 價目表查詢 ---------- */

function price(ref: string, item: string, spec: string, condition = "") {
  const row = PRICE_ROWS.find((entry) => entry[1] === ref && entry[2] === item && entry[3] === spec && entry[4] === condition);
  if (!row) throw new Error(`price-missing:${ref}|${item}|${spec}|${condition}`);
  return { amount: row[6], unit: row[7], source: `價目表 ${ref}（金額確認第 ${row[0]} 列）` };
}

function line(label: string, found: { amount: number; source: string }, quantity: number, unit: string, unitPrice = found.amount): PriceLine {
  return { label, unitPrice, quantity, unit, amount: Math.round(unitPrice * quantity), source: found.source };
}

/* ---------- 內頁厚度換算 ---------- */

export const paperThicknessMm: Record<string, number> = {
  "80g 道林紙": 0.10,
  "100g 道林紙": 0.13,
  "100g 銅版紙／雪銅紙": 0.09,
  "150g 道林紙／蒙肯紙": 0.18,
};

const innerFields: readonly PricingField[] = [
  { id: "paper", label: "內頁紙張", kind: "select", options: Object.keys(paperThicknessMm) },
  { id: "pages", label: "內頁頁數", kind: "number", min: 1, max: 4000, unit: "頁", placeholder: "例如 120" },
  { id: "printSides", label: "內頁印刷", kind: "select", options: ["雙面印刷", "單面印刷"], help: "雙面印刷每 2 頁為 1 張；單面印刷每頁為 1 張。" },
];

export function innerSheets(values: Values) {
  const pages = Number(values.pages);
  if (!Number.isSafeInteger(pages) || pages < 1) return null;
  return values.printSides === "單面印刷" ? pages : Math.ceil(pages / 2);
}

export function innerThicknessMm(values: Values) {
  const perSheet = paperThicknessMm[values.paper ?? ""];
  const sheets = innerSheets(values);
  if (!perSheet || !sheets) return null;
  return Math.round(sheets * perSheet * 100) / 100;
}

function thicknessNote(values: Values) {
  const mm = innerThicknessMm(values);
  return mm === null ? [] : [`內頁約 ${innerSheets(values)} 張，換算厚度約 ${(mm / 10).toFixed(2)} 公分（不含封面，實際以成品為準）。`];
}

/* ---------- 產品計價設定 ---------- */

const bookSizes = ["A4/B5", "A4R/B5R", "B4/25x25mm", "A3/30x30mm", "A5/A5R"] as const;

function colorThicknessTier(mm: number) {
  if (mm <= 20) return null;
  if (mm <= 30) return "厚度2~3公分";
  if (mm <= 40) return "厚度3~4公分";
  return "厚度4~5公分";
}

const products: readonly PricingProduct[] = [
  {
    slug: "thesis-binding", title: "論文", smallQuantity: "sample50", maxAutoQuantity: 39,
    fields: [
      { id: "thesisInner", label: "內頁狀態", kind: "select", options: ["內頁尚未膠裝", "內頁已膠裝"] },
      { id: "thesisFoil", label: "封面燙金", kind: "select", options: ["數位燙金（免製版）", "製版燙金（全版）", "製版燙金（共版）", "已有版，只需燙金", "不需要燙金"], help: "製版費與燙金費每件收一次，不隨本數增加。" },
      { id: "schoolLogo", label: "封底燙校徽", kind: "select", options: ["不需要", "需要"] },
    ],
    calc(values, quantity) {
      if (values.schoolLogo === "需要") return { manual: "封底燙校徽的計價方式需由專人確認。" };
      const lines = [line("論文精裝", price("P3", "論文精裝", values.thesisInner === "內頁已膠裝" ? "內頁有膠" : "內頁未膠"), quantity, "本")];
      const foil = values.thesisFoil;
      if (foil === "數位燙金（免製版）") {
        lines.push(line("數位燙金（4 本內）", price("P3", "免製版數位燙金", "A4範圍", "4本以下"), 1, "件"));
        if (quantity > 4) lines.push(line("數位燙金（超過 4 本加價）", price("P3", "免製版數位燙金", "A4範圍", "超過4本，每增加1本"), quantity - 4, "本"));
      }
      const plate: Record<string, string> = { "製版燙金（全版）": "全版", "製版燙金（共版）": "共版", "已有版，只需燙金": "有版" };
      if (foil && plate[foil]) lines.push(line(foil, price("P3", "製版+燙金合併", plate[foil]), 1, "件"));
      return { lines };
    },
  },
  {
    slug: "certificate-folder", title: "證書夾", smallQuantity: "sample50", maxAutoQuantity: 199,
    fields: [
      { id: "certStyle", label: "樣式", kind: "select", options: ["普通兩片式", "泡棉兩片式", "磁扣翻蓋式", "平裝襯厚卡"] },
      { id: "certLining", label: "內貼", kind: "select", options: ["不需要", "150磅米色紙內貼（皮面三角）", "150磅米色紙內貼（緞帶三角）", "1mm炫光紙硬殼內貼（皮面三角）", "1mm炫光紙硬殼內貼（緞帶三角）"] },
      { id: "certLiningCount", label: "每本內貼張數", kind: "number", min: 1, max: 20, unit: "張", when: { field: "certLining", values: ["150磅米色紙內貼（皮面三角）", "150磅米色紙內貼（緞帶三角）", "1mm炫光紙硬殼內貼（皮面三角）", "1mm炫光紙硬殼內貼（緞帶三角）"] } },
      { id: "certCorner", label: "護角", kind: "select", options: ["不需要", "四角護角"] },
      { id: "certFoil", label: "封面燙金", kind: "select", options: ["不需要", "需要燙金"] },
    ],
    calc(values, quantity) {
      if (values.certFoil === "需要燙金" && quantity < 100) return { manual: "證書夾 100 本以下的燙金費用需由專人報價。" };
      const base = price("P12", "證書夾", values.certStyle ?? "", "A4、3~39本");
      const rate = quantity >= 100 ? 0.8 : quantity >= 40 ? 0.9 : 1;
      const label = rate === 1 ? `證書夾 ${values.certStyle}` : `證書夾 ${values.certStyle}（${quantity >= 100 ? "100~199 本 8 折" : "40~99 本 9 折"}）`;
      const lines = [line(label, base, quantity, "本", base.amount * rate)];
      const lining = values.certLining?.match(/^(.+)（(.+)）$/);
      if (lining) {
        const count = Number(values.certLiningCount);
        lines.push(line(values.certLining!, price("P12", lining[1], lining[2], "每張"), quantity * count, "張"));
      }
      if (values.certCorner === "四角護角") lines.push(line("四角護角", price("P12", "護角", "4角", "每本"), quantity, "本"));
      if (values.certFoil === "需要燙金") lines.push(line(`大量燙金（${quantity >= 200 ? "200 本以上" : "100~199 本"}）`, price("P12", "大量燙金", quantity >= 200 ? "200本以上" : "100~199本", "每本"), quantity, "本"));
      return { lines };
    },
  },
  {
    slug: "perfect-binding", title: "膠裝", smallQuantity: "sample50", maxAutoQuantity: 39,
    fields: [
      { id: "bookSize", label: "成品尺寸", kind: "select", options: bookSizes },
      { id: "staple", label: "打釘", kind: "select", options: ["不需要", "加打釘"] },
      ...innerFields,
      { id: "foldFlap", label: "封面折書口", kind: "select", options: ["不需要", "需要"] },
    ],
    calc(values, quantity) {
      const size = values.bookSize ?? "";
      const mm = innerThicknessMm(values) ?? 0;
      if (mm > 50) return { manual: "內頁厚度超過 5 公分，需由專人報價。" };
      const item = values.staple === "加打釘" ? "彩平裝+打釘" : "彩平裝";
      const lines = [line(`${item}（${size}，2 公分內）`, price("7-1", item, size, "3~39本、2公分內"), quantity, "本")];
      const tier = colorThicknessTier(mm);
      if (tier) lines.push(line(`厚度加價（${tier.replace("厚度", "")}）`, price("7-1", "彩平裝", size, tier), quantity, "本"));
      if (values.foldFlap === "需要") lines.push(line("封面加折書口", price("7-1", "彩平裝", size, "封面加折書口"), quantity, "本"));
      return { lines, notes: thicknessNote(values) };
    },
  },
  {
    slug: "hardcover", title: "精裝", smallQuantity: "sample50", maxAutoQuantity: 39,
    fields: [
      { id: "bookSize", label: "成品尺寸", kind: "select", options: bookSizes },
      { id: "staple", label: "打釘", kind: "select", options: ["不需要", "加打釘"] },
      { id: "coverMaterial", label: "封面材質", kind: "select", options: ["彩色印刷封面", "皮面", "布面"] },
      ...innerFields,
    ],
    calc(values, quantity) {
      const size = values.bookSize ?? "";
      const mm = innerThicknessMm(values) ?? 0;
      if (mm > 50) return { manual: "內頁厚度超過 5 公分，需由專人報價。" };
      const item = values.staple === "加打釘" ? "彩精裝+打釘" : "彩精裝";
      const lines = [line(`${item}（${size}，2 公分內）`, price("7-2", item, size, "3~39本、2公分內"), quantity, "本")];
      const tier = colorThicknessTier(mm);
      if (tier) lines.push(line(`厚度加價（${tier.replace("厚度", "")}）`, price("7-2", "彩精裝", size, tier), quantity, "本"));
      if (values.coverMaterial === "皮面") lines.push(line("皮面材料費", price("7-2", "皮面精裝材料費", size), quantity, "本"));
      if (values.coverMaterial === "布面") lines.push(line("布面材料費", price("7-2", "布面精裝材料費", size), quantity, "本"));
      return { lines, notes: thicknessNote(values) };
    },
  },
  {
    slug: "machine-sewn-binding", title: "車線平裝", smallQuantity: "included", maxAutoQuantity: 39,
    fields: [
      { id: "foldSize", label: "原稿 → 成品尺寸", kind: "select", options: ["A3→A4/B4→B5", "A4→A5/B5→B6"] },
      ...innerFields,
    ],
    calc(values, quantity) {
      const mm = innerThicknessMm(values) ?? 0;
      const spec = `${values.foldSize} 厚度${mm <= 2 ? "<2mm" : ">2mm"}`;
      const condition = quantity <= 2 ? "1~2本打樣" : "3~39本";
      return { lines: [line(`車線平裝（${spec}，${condition}）`, price("9-2", "車線平裝（車線騎馬裝）", spec, condition), quantity, "本")], notes: thicknessNote(values) };
    },
  },
  {
    slug: "butterfly-book", title: "蝴蝶平、精裝", smallQuantity: "sample50", maxAutoQuantity: 39,
    fields: [
      { id: "butterflySize", label: "成品尺寸", kind: "select", options: ["A4/B5", "A4R", "B4/25x25mm", "A3/30x30mm", "A5/A5R"] },
      { id: "mounting", label: "裱法", kind: "select", options: ["直裱", "厚裱"], unless: { field: "butterflySize", values: ["A4R"] } },
      { id: "butterflyBinding", label: "封面", kind: "select", options: ["平裝", "精裝"], unless: { field: "butterflySize", values: ["A4R"] } },
      { id: "thicken", label: "加厚", kind: "select", options: ["不需要", "加厚"], when: { field: "butterflySize", values: ["A4R"] } },
      { id: "sheets", label: "內頁張數", kind: "number", min: 1, max: 200, unit: "張", help: "蝶冊每一個跨頁為 1 張。" },
    ],
    calc(values, quantity) {
      const sheets = Number(values.sheets);
      if (values.butterflySize === "A4R") {
        const lines = [line("蝶冊精裝（A4R，5 張內）", price("10-x", "蝶冊精裝", "A4R", "基本價"), quantity, "本")];
        if (sheets > 5) lines.push(line(`超過 5 張加價（${sheets - 5} 張）`, price("10-x", "蝶冊精裝", "A4R", "超過5張，每增加1張"), quantity * (sheets - 5), "張"));
        if (values.thicken === "加厚") lines.push(line("加厚", price("10-x", "蝶冊", "A4R", "加厚"), quantity, "本"));
        return { lines };
      }
      const size = values.butterflySize ?? "";
      const direct = values.mounting === "直裱";
      const ref = direct ? "10-1" : "10-2";
      const included = direct ? 5 : 2;
      const item = `蝶冊${values.mounting}${values.butterflyBinding}`;
      const lines = [line(`${item}（${size}，${included} 張內）`, price(ref, item, size, `3~39本、${included}張內`), quantity, "本")];
      if (sheets > included) lines.push(line(`超過 ${included} 張加價（${sheets - included} 張）`, price(ref, `蝶冊${values.mounting}`, size, "超過基準張數每增加1張"), quantity * (sheets - included), "張"));
      return { lines };
    },
  },
  {
    slug: "construction-book", title: "工程施工本", smallQuantity: "sample50", maxAutoQuantity: 39,
    fields: [
      { id: "constructionType", label: "類型", kind: "select", options: ["工程圖冊", "工程圖裝訂"] },
      { id: "drawingCover", label: "封面", kind: "select", options: ["專用皮", "厚軟皮", "雲彩紙", "皮面精裝"], when: { field: "constructionType", values: ["工程圖冊"] } },
      { id: "drawingFold", label: "原圖 → 成品尺寸", kind: "select", options: ["A3→A4", "A2→A3", "A1→A2"], when: { field: "constructionType", values: ["工程圖冊"] } },
      { id: "drawingSheets", label: "圖面張數", kind: "number", min: 1, max: 1000, unit: "張", when: { field: "constructionType", values: ["工程圖冊"] } },
      { id: "drawingFoil", label: "封面燙金", kind: "select", options: ["不需要", "需要燙金"], when: { field: "constructionType", values: ["工程圖冊"] } },
      { id: "bindingCover", label: "封面封底", kind: "select", options: ["自備封面封底", "透明H封面西卡封底", "透明膠片封面封底", "膠皮封面封底"], when: { field: "constructionType", values: ["工程圖裝訂"] } },
      { id: "bindingSize", label: "圖面尺寸", kind: "select", options: ["A2", "A1"], when: { field: "constructionType", values: ["工程圖裝訂"] } },
      { id: "bindingThickness", label: "每本裝訂厚度", kind: "number", min: 1, max: 30, unit: "公分", when: { field: "constructionType", values: ["工程圖裝訂"] } },
    ],
    calc(values, quantity) {
      if (values.constructionType === "工程圖裝訂") {
        const size = values.bindingSize ?? "";
        const cm = Math.ceil(Number(values.bindingThickness));
        const lines = [line(`工程圖裝訂 ${values.bindingCover}（${size}，1 公分內）`, price("4-3", values.bindingCover ?? "", size, "每本厚度1公分"), quantity, "本")];
        if (cm > 1) lines.push(line(`厚度加價（超過 1 公分，共 ${cm - 1} 公分）`, price("4-3", "厚度加價", size, "每增加1公分"), quantity * (cm - 1), "公分"));
        return { lines };
      }
      if (values.drawingFoil === "需要燙金") return { manual: "工程圖冊燙金需依製版面積計價，請由專人報價。" };
      const fold = values.drawingFold ?? "";
      const sheets = Number(values.drawingSheets);
      const lines = [line(`工程圖冊 ${values.drawingCover}（${fold}，10 張內）`, price("4-2", values.drawingCover ?? "", fold, "10張內"), quantity, "本")];
      const extra = Math.ceil(Math.max(0, sheets - 10) / 10);
      if (extra) lines.push(line(`超過 10 張加價（每 10 張，共 ${extra} 組）`, price("4-2", "每增加10張", fold), quantity * extra, "組"));
      return { lines };
    },
  },
  {
    slug: "screw-contract", title: "鎖螺絲合約書", smallQuantity: "included", maxAutoQuantity: 39,
    fields: [
      { id: "screwType", label: "螺絲形式", kind: "select", options: ["外裝式螺絲", "內裝兩片式", "內裝式螺絲"], help: "基本價含 A4、1 公分內、2 孔。" },
      ...innerFields,
    ],
    calc(values, quantity) {
      const mm = innerThicknessMm(values) ?? 0;
      if (mm > 60) return { manual: "內頁厚度超過 6 公分，需由專人報價。" };
      const lines = [line(`合約書 ${values.screwType}（A4，1 公分內）`, price("11-2", "合約書", values.screwType ?? "", "1~39本、A4、1公分內2孔"), quantity, "本")];
      const extraCm = Math.ceil(Math.max(0, mm - 10) / 10);
      if (extraCm) lines.push(line(`資料厚度加價（超過 1 公分，共 ${extraCm} 公分）`, price("11-2", "A4資料厚度", "A4", "每公分"), quantity * extraCm, "公分"));
      return { lines, notes: thicknessNote(values) };
    },
  },
  {
    slug: "menu-production", title: "菜單螺絲裝", smallQuantity: "sample50", maxAutoQuantity: 39,
    fields: [
      { id: "screwType", label: "螺絲形式", kind: "select", options: ["外裝式螺絲", "內裝兩片式", "內裝式螺絲"], help: "基本價含 A4、1 公分內、2 孔。" },
      ...innerFields,
      { id: "menuCorner", label: "護角", kind: "select", options: ["不需要", "加護角"] },
      { id: "waistFold", label: "內頁腰折線", kind: "select", options: ["不需要", "需要"] },
    ],
    calc(values, quantity) {
      const mm = innerThicknessMm(values) ?? 0;
      if (mm > 60) return { manual: "內頁厚度超過 6 公分，需由專人報價。" };
      const lines = [line(`菜單 ${values.screwType}（A4，1 公分內）`, price("11-1", "菜單", values.screwType ?? "", "3~39本、A4、1公分內2孔"), quantity, "本")];
      const extraCm = Math.ceil(Math.max(0, mm - 10) / 10);
      if (extraCm) lines.push(line(`厚度加價（超過 1 公分，共 ${extraCm} 公分）`, price("11-1", "超過厚度", "A4", "每公分"), quantity * extraCm, "公分"));
      if (values.menuCorner === "加護角") lines.push(line("護角", price("11-1", "護角", "", "每本"), quantity, "本"));
      if (values.waistFold === "需要") lines.push(line("內頁腰折線", price("11-1", "內頁腰折線", "", "每張"), quantity * (innerSheets(values) ?? 0), "張"));
      return { lines, notes: thicknessNote(values) };
    },
  },
  {
    slug: "q-rod-hardcover", title: "Q桿精裝", smallQuantity: "sample50", maxAutoQuantity: 39,
    fields: [{ id: "qRodCover", label: "封面", kind: "select", options: ["A4自備封面", "A4皮面"] }],
    calc(values, quantity) {
      return { lines: [line(`Q桿精裝（${values.qRodCover}）`, price("11-1", "Q桿菜單", values.qRodCover ?? ""), quantity, "本")] };
    },
  },
];

const bySlug = new Map(products.map((product) => [product.slug, product]));

export function isAutoPriced(slug: string) { return bySlug.has(slug); }
export function pricingFields(slug: string) { return bySlug.get(slug)?.fields ?? []; }

function matches(condition: Condition | undefined, values: Values) {
  return !condition || condition.values.includes(values[condition.field] ?? "");
}

export function visiblePricingFields(slug: string, values: Values) {
  return pricingFields(slug).filter((field) => matches(field.when, values) && !(field.unless && matches(field.unless, values)));
}

/** 回傳缺少或不合法的欄位 id；空陣列代表規格完整。 */
export function invalidPricingFields(slug: string, values: Values) {
  return visiblePricingFields(slug, values).filter((field) => {
    const value = values[field.id];
    if (field.kind === "select") return !value || !field.options.includes(value);
    const number = Number(value);
    return !value || !Number.isSafeInteger(number) || number < field.min || number > field.max;
  }).map((field) => field.id);
}

/* ---------- 運費（運費工作表） ---------- */

export const motorDistricts = ["台中市區", "屯區", "太平", "大里", "烏日", "豐原", "潭子", "神岡", "大雅", "龍井"] as const;

export const shippingChoices: readonly ShippingChoice[] = [
  { id: "pickup", label: "自取", fee: 0, note: "不加運費", needsDistrict: false, needsAddress: false },
  { id: "hct", label: "新竹貨運（隔日配）", fee: 130, note: "全省，離島除外；同地址每多一件 +50，件數由專人確認", needsDistrict: false, needsAddress: true },
  { id: "moto-next", label: "全球愛鄉機車配送（隔日配）", fee: 90, note: "限台中指定區域", needsDistrict: true, needsAddress: true },
  { id: "moto-same", label: "全球愛鄉機車配送（當日配）", fee: 90, note: "限台中指定區域，上午 11 點前能夠寄出者", needsDistrict: true, needsAddress: true },
];

export function shippingFor(id: string | undefined, district: string | undefined) {
  const choice = shippingChoices.find((item) => item.id === id);
  if (!choice) return null;
  if (choice.needsDistrict && !motorDistricts.includes(district as typeof motorDistricts[number])) return null;
  return { id: choice.id, label: choice.label, fee: choice.fee, ...(choice.needsDistrict ? { district } : {}) };
}

/* ---------- 試算 ---------- */

export function calculateEstimate(input: { productSlug: string; quantity: number; values: Values; shippingId?: string; district?: string }): Estimate {
  const shipping = shippingFor(input.shippingId, input.district);
  const base = { priceVersion: PRICE_VERSION, lines: [] as PriceLine[], subtotal: null, shipping, total: null, notes: [] as string[] };
  const product = bySlug.get(input.productSlug);
  if (!product) return { ...base, status: "manual", reason: "此產品需由專人依需求報價。" };
  const quantity = input.quantity;
  if (!Number.isSafeInteger(quantity) || quantity < 1) return { ...base, status: "incomplete", reason: "請輸入製作數量。" };
  if (invalidPricingFields(product.slug, input.values).length) return { ...base, status: "incomplete", reason: "請完成所有規格選項。" };
  if (quantity > product.maxAutoQuantity) {
    return { ...base, status: "manual", reason: product.slug === "certificate-folder" ? "證書夾 200 本以上需由專人報價。" : "40 本以上的數量由專人計價。" };
  }
  const result = product.calc(input.values, quantity);
  if ("manual" in result) return { ...base, status: "manual", reason: result.manual };
  const lines = [...result.lines];
  if (product.smallQuantity === "sample50" && quantity <= 2) {
    lines.push({ label: "1~2 本打樣加價", unitPrice: 50, quantity, unit: "本", amount: 50 * quantity, source: "價格規則：其他打樣 +50／本" });
  }
  const subtotal = lines.reduce((sum, item) => sum + item.amount, 0);
  return {
    ...base, status: "priced", lines, subtotal,
    total: shipping ? subtotal + shipping.fee : null,
    notes: [...(result.notes ?? []), ...(shipping ? [] : ["選擇配送方式後會加上運費。"])],
  };
}
