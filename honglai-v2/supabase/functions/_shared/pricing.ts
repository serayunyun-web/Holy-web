// 鴻萊 V2 共用計價引擎：前台即時試算與 Edge Function 後端驗證共用同一份程式與價目資料。
// 規則來源：使用者確認之「金額確認」「價格規則」「運費」工作表，與 2026-11-16 設計師模式規劃
// （docs/superpowers/specs/2026-11-16-designer-mode-and-mock-linepay-design.md）。
// - B2B 與 B2C 同價，一律使用價目表原價（不加 35）。
// - 所有產品都自動計價：價目表沒有的項目使用使用者確認過的「估計價」，明細來源欄會標示。
// - 40~99 本 9 折、100 本以上 8 折（證書夾依原規則，其餘品項比照，固定每件費用不打折）。
// - 1~2 本打樣：價目表未另列打樣價者 +50／本；價目表已列 1~2 本價格者不再加價。
// - 內頁印刷費（已含紙張費，所有紙種同價）：每一行小計算完再四捨五入。
import { PRICE_ROWS } from "./price-table.generated.ts";

export const PRICE_VERSION = "2026-11-16-designer";
export const ESTIMATE_DISCLAIMER = "此為系統試算金額，實際製作金額及交期以專人確認後提供的正式報價為準。";

/** 規格中的填寫模式欄位（values.mode）。 */
export const MODE_SIMPLE = "一般客戶";
export const MODE_DESIGNER = "設計師";
export const isDesigner = (values: Values) => values.mode === MODE_DESIGNER;

export type Values = Record<string, string | undefined>;
type Condition = { field: string; values: readonly string[] };
type FieldBase = { id: string; label: string; help?: string; when?: Condition; unless?: Condition; only?: "simple" | "designer" };
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

type Calc = { lines: PriceLine[]; notes?: string[] } | { invalid: string };
type PricingProduct = {
  slug: string;
  title: string;
  fields: readonly PricingField[];
  /** included：價目表已含 1~2 本價格；sample50：1~2 本 +50／本 */
  smallQuantity: "included" | "sample50";
  /** own：產品自己處理數量折扣（證書夾）；standard：40 本以上 9 折／8 折 */
  bulk: "own" | "standard";
  calc: (values: Values, quantity: number) => Calc;
};

/* ---------- 價目表查詢 ---------- */

type Found = { amount: number; source: string };

function price(ref: string, item: string, spec: string, condition = ""): Found {
  const row = PRICE_ROWS.find((entry) => entry[1] === ref && entry[2] === item && entry[3] === spec && entry[4] === condition);
  if (!row) throw new Error(`price-missing:${ref}|${item}|${spec}|${condition}`);
  return { amount: row[6], source: `價目表 ${ref}（金額確認第 ${row[0]} 列）` };
}

/** 價目表沒有的項目：使用者 2026-11-16 確認的估計價。 */
function estimated(amount: number, what: string): Found {
  return { amount, source: `估計價：${what}（2026-11-16 確認）` };
}

function line(label: string, found: Found, quantity: number, unit: string, unitPrice = found.amount): PriceLine {
  return { label, unitPrice, quantity, unit, amount: Math.round(unitPrice * quantity), source: found.source };
}

/* ---------- 紙張與內頁 ---------- */

/** 單張厚度（mm）。所有紙種同價，紙種只影響厚度換算。 */
export const paperThicknessMm: Record<string, number> = {
  "80g 道林紙": 0.10,
  "100g 道林紙": 0.13,
  "100g 銅版紙／雪銅紙": 0.09,
  "150g 道林紙／蒙肯紙": 0.18,
  "70g 道林紙": 0.09,
  "120g 道林紙": 0.15,
  "128g 銅版紙": 0.11,
  "157g 銅版紙": 0.14,
  "80g 模造紙": 0.10,
  "100g 象牙紙": 0.13,
  "銅西卡 250g": 0.28,
  "古樓防水相紙 190g": 0.20,
  "萊妮紙 250g": 0.30,
  "細紋紙 220g": 0.26,
  "道林紙 186g": 0.22,
};
export const DEFAULT_PAPER = "80g 道林紙";
const paperNames = Object.keys(paperThicknessMm);

export const NO_PRINT = "不需要印刷（自備已印好內頁）";
const MIXED = "黑白彩色混合";

const innerFields: readonly PricingField[] = [
  { id: "paper", label: "內頁紙張", kind: "select", options: paperNames, only: "designer", help: "所有紙種同價，紙種只影響書背厚度。" },
  { id: "countUnit", label: "內頁數量算法", kind: "select", options: ["張數", "頁數"], only: "designer" },
  { id: "innerSheetCount", label: "內頁張數", kind: "number", min: 1, max: 4000, unit: "張", placeholder: "例如 60", only: "designer", when: { field: "countUnit", values: ["張數"] } },
  { id: "pages", label: "內頁頁數", kind: "number", min: 1, max: 4000, unit: "頁", placeholder: "例如 120", unless: { field: "countUnit", values: ["張數"] } },
  { id: "printSides", label: "單面／雙面", kind: "select", options: ["雙面印刷", "單面印刷"], help: "雙面印刷每 2 頁為 1 張；單面印刷每頁為 1 張。" },
  { id: "printColor", label: "內頁印刷", kind: "select", options: ["黑白", "彩色", NO_PRINT], only: "simple" },
  { id: "printColor", label: "內頁印刷", kind: "select", options: ["黑白", "彩色", MIXED, NO_PRINT], only: "designer" },
  { id: "colorSheets", label: "其中彩色張數", kind: "number", min: 1, max: 4000, unit: "張", only: "designer", when: { field: "printColor", values: [MIXED] }, help: "其餘張數以黑白計價。" },
  { id: "coverPaper", label: "封面紙張", kind: "select", options: ["不指定", ...paperNames], only: "designer" },
];

/** 內頁印刷張數。設計師可直接填張數；否則以頁數與單雙面換算。 */
export function innerSheets(values: Values) {
  if (isDesigner(values) && values.countUnit === "張數") {
    const sheets = Number(values.innerSheetCount);
    return Number.isSafeInteger(sheets) && sheets >= 1 ? sheets : null;
  }
  const pages = Number(values.pages);
  if (!Number.isSafeInteger(pages) || pages < 1) return null;
  return values.printSides === "單面印刷" ? pages : Math.ceil(pages / 2);
}

/** 內頁頁數（用於台數、騎馬釘上限）。 */
export function innerPages(values: Values) {
  const sheets = innerSheets(values);
  if (sheets === null) return null;
  if (!(isDesigner(values) && values.countUnit === "張數")) return Number(values.pages);
  return values.printSides === "單面印刷" ? sheets : sheets * 2;
}

function paperOf(values: Values) {
  return isDesigner(values) ? values.paper ?? "" : DEFAULT_PAPER;
}

export function innerThicknessMm(values: Values) {
  const perSheet = paperThicknessMm[paperOf(values)];
  const sheets = innerSheets(values);
  if (!perSheet || !sheets) return null;
  return Math.round(sheets * perSheet * 100) / 100;
}

function thicknessNote(values: Values) {
  const mm = innerThicknessMm(values);
  return mm === null ? [] : [`內頁約 ${innerSheets(values)} 張，換算厚度約 ${(mm / 10).toFixed(2)} 公分（不含封面，實際以成品為準）。`];
}

/* ---------- 內頁印刷費 ---------- */

type PrintSize = "A4" | "A3";
/** 元／張（雙面＝一張正反合計），已含紙張費。 */
const printRates: Record<"黑白" | "彩色", Record<PrintSize, { single: number; double: number }>> = {
  黑白: { A4: { single: 0.6, double: 1 }, A3: { single: 0.8, double: 1.2 } },
  彩色: { A4: { single: 3, double: 6 }, A3: { single: 5, double: 8 } },
};

/** 成品尺寸 → 印刷計價尺寸：B5、A5 照 A4；B4、25×25 照 A3；橫式同直式。 */
export function printSizeOf(size: string): PrintSize {
  return /A3|B4|25x25|30x30/.test(size) ? "A3" : "A4";
}

function printLines(values: Values, quantity: number, size: PrintSize): Calc {
  const color = values.printColor;
  const sheets = innerSheets(values);
  if (!sheets || !color || color === NO_PRINT) return { lines: [] };
  const sides = values.printSides === "單面印刷" ? "single" : "double";
  const sideLabel = sides === "single" ? "單面" : "雙面";
  const entry = (tone: "黑白" | "彩色", count: number) => {
    const rate = printRates[tone][size][sides];
    return line(`內頁${tone}印刷（${size} ${sideLabel}，${count} 張／本）`, { amount: rate, source: "內頁印刷價目（2026-11-16 確認，含紙張）" }, count * quantity, "張");
  };
  if (color !== MIXED) return { lines: [entry(color as "黑白" | "彩色", sheets)] };
  const colorSheets = Number(values.colorSheets);
  if (colorSheets > sheets) return { invalid: `彩色張數（${colorSheets} 張）不能超過內頁總張數（${sheets} 張）。` };
  const lines = [entry("彩色", colorSheets)];
  if (sheets > colorSheets) lines.push(entry("黑白", sheets - colorSheets));
  return { lines };
}

/** 合併裝訂費與印刷費。 */
function withPrint(binding: Calc, values: Values, quantity: number, size: PrintSize): Calc {
  if ("invalid" in binding) return binding;
  const print = printLines(values, quantity, size);
  if ("invalid" in print) return print;
  return { lines: [...binding.lines, ...print.lines], notes: [...(binding.notes ?? []), ...thicknessNote(values)] };
}

/* ---------- 共用加價 ---------- */

const bookSizes = ["A4/B5", "A4R/B5R", "B4/25x25mm", "A3/30x30mm", "A5/A5R"] as const;

function colorThicknessTier(mm: number) {
  if (mm <= 20) return null;
  if (mm <= 30) return "厚度2~3公分";
  if (mm <= 40) return "厚度3~4公分";
  return "厚度4~5公分";
}

/** 超過 5 公分：比照 5-1 一般平裝「6 公分以上每增加 1 公分」。 */
function overFiveCm(mm: number, size: string, quantity: number) {
  if (mm <= 50) return [];
  const key = size.startsWith("A4R") ? "A4R/B5R" : size.startsWith("B4") ? "B4/B4R" : size.startsWith("A3") ? "A3/A3R" : "A4/B5";
  const cm = Math.ceil((mm - 50) / 10);
  return [line(`超過 5 公分厚度加價（${cm} 公分）`, price("5-1", "一般平裝", key, "6公分以上，每增加1公分"), quantity * cm, "公分")];
}

/** 台數：1 台 = 16 頁。超過 3 台每台加價。 */
function extraSignatures(values: Values) {
  const pages = innerPages(values) ?? 0;
  return Math.max(0, Math.ceil(pages / 16) - 3);
}

const sewnSizes = ["A4/B5", "A4R/B5R", "A5", "A5R/A6"] as const;

/* ---------- 線圈規格 ---------- */

// [價目表規格名稱, 可裝訂最大內徑 mm]
const ringSpecs: Record<string, readonly [string, number][]> = {
  環裝代工: [["規格 6/8", 8], ["規格 10/12", 12], ["規格 14/15", 15], ["規格 18/20", 20], ["規格 22/25", 25], ["規格 28", 28], ["規格 32", 32], ["規格 38", 38], ["規格 45", 45], ["規格 51", 51]],
  雙線圈代工: [["規格 6/8", 8], ["規格 9/11", 11], ["規格 12", 12], ["規格 14", 14], ["規格 16", 16], ["規格 19", 19], ["規格 22", 22], ["規格 25", 25], ["規格 28", 28], ["規格 31", 31]],
};

/** 線圈內徑需比內頁厚度大約 3 mm；超過最大規格時回傳最大規格與超出公分數。 */
export function pickRing(kind: "環裝代工" | "雙線圈代工", mm: number) {
  const specs = ringSpecs[kind];
  const need = mm + 3;
  const fit = specs.find(([, size]) => size >= need);
  if (fit) return { spec: fit[0], overCm: 0 };
  const [spec, size] = specs[specs.length - 1];
  return { spec, overCm: Math.ceil((need - size) / 10) };
}

/* ---------- 產品計價設定 ---------- */

const products: readonly PricingProduct[] = [
  {
    slug: "thesis-binding", title: "論文", smallQuantity: "sample50", bulk: "standard",
    fields: [
      { id: "thesisInner", label: "內頁狀態", kind: "select", options: ["內頁尚未膠裝", "內頁已膠裝"] },
      { id: "thesisFoil", label: "封面燙金", kind: "select", options: ["數位燙金（免製版）", "製版燙金（全版）", "製版燙金（共版・限台中市大學）", "已有版，只需燙金", "不需要燙金"], help: "製版費與燙金費每件收一次，不隨本數增加。" },
      { id: "schoolLogo", label: "封底燙校徽", kind: "select", options: ["不需要", "需要"] },
      ...innerFields,
    ],
    calc(values, quantity) {
      const lines = [line("論文精裝", price("P3", "論文精裝", values.thesisInner === "內頁已膠裝" ? "內頁有膠" : "內頁未膠"), quantity, "本")];
      const foil = values.thesisFoil;
      if (foil === "數位燙金（免製版）") {
        lines.push(line("數位燙金（4 本內）", price("P3", "免製版數位燙金", "A4範圍", "4本以下"), 1, "件"));
        if (quantity > 4) lines.push(line("數位燙金（超過 4 本加價）", price("P3", "免製版數位燙金", "A4範圍", "超過4本，每增加1本"), quantity - 4, "本"));
      }
      const plate: Record<string, string> = { "製版燙金（全版）": "全版", "製版燙金（共版・限台中市大學）": "共版", "已有版，只需燙金": "有版" };
      if (foil && plate[foil]) lines.push(line(foil, price("P3", "製版+燙金合併", plate[foil]), 1, "件"));
      if (values.schoolLogo === "需要") lines.push(line("封底燙校徽", price("P3", "封底燙校徽", ""), 1, "件"));
      return withPrint({ lines }, values, quantity, "A4");
    },
  },
  {
    slug: "certificate-folder", title: "證書夾", smallQuantity: "sample50", bulk: "own",
    fields: [
      { id: "certStyle", label: "樣式", kind: "select", options: ["普通兩片式", "泡棉兩片式", "磁扣翻蓋式", "平裝襯厚卡"] },
      { id: "certLining", label: "內貼", kind: "select", options: ["不需要", "150磅米色紙內貼（皮面三角）", "150磅米色紙內貼（緞帶三角）", "1mm炫光紙硬殼內貼（皮面三角）", "1mm炫光紙硬殼內貼（緞帶三角）"] },
      { id: "certLiningCount", label: "每本內貼張數", kind: "number", min: 1, max: 20, unit: "張", when: { field: "certLining", values: ["150磅米色紙內貼（皮面三角）", "150磅米色紙內貼（緞帶三角）", "1mm炫光紙硬殼內貼（皮面三角）", "1mm炫光紙硬殼內貼（緞帶三角）"] } },
      { id: "certCorner", label: "護角", kind: "select", options: ["不需要", "四角護角"] },
      { id: "certFoil", label: "封面燙金", kind: "select", options: ["不需要", "需要燙金"] },
    ],
    calc(values, quantity) {
      const base = price("P12", "證書夾", values.certStyle ?? "", "A4、3~39本");
      const rate = quantity >= 100 ? 0.8 : quantity >= 40 ? 0.9 : 1;
      const label = rate === 1 ? `證書夾 ${values.certStyle}` : `證書夾 ${values.certStyle}（${quantity >= 100 ? "100 本以上 8 折" : "40~99 本 9 折"}）`;
      const lines = [line(label, base, quantity, "本", base.amount * rate)];
      const lining = values.certLining?.match(/^(.+)（(.+)）$/);
      if (lining) {
        const count = Number(values.certLiningCount);
        lines.push(line(values.certLining!, price("P12", lining[1], lining[2], "每張"), quantity * count, "張"));
      }
      if (values.certCorner === "四角護角") lines.push(line("四角護角", price("P12", "護角", "4角", "每本"), quantity, "本"));
      if (values.certFoil === "需要燙金") {
        if (quantity >= 100) {
          lines.push(line(`大量燙金（${quantity >= 200 ? "200 本以上" : "100~199 本"}）`, price("P12", "大量燙金", quantity >= 200 ? "200本以上" : "100~199本", "每本"), quantity, "本"));
        } else {
          lines.push(line("燙金製版費", price("5-2", "製版燙金", "製版費"), 1, "件"));
          lines.push(line("燙金費", price("5-2", "製版燙金", "燙金費"), 1, "件"));
        }
      }
      return { lines };
    },
  },
  {
    slug: "perfect-binding", title: "膠裝", smallQuantity: "sample50", bulk: "standard",
    fields: [
      { id: "bookSize", label: "成品尺寸", kind: "select", options: bookSizes },
      { id: "staple", label: "打釘", kind: "select", options: ["不需要", "加打釘"] },
      ...innerFields,
      { id: "foldFlap", label: "封面折書口", kind: "select", options: ["不需要", "需要"] },
    ],
    calc(values, quantity) {
      const size = values.bookSize ?? "";
      const mm = innerThicknessMm(values) ?? 0;
      const item = values.staple === "加打釘" ? "彩平裝+打釘" : "彩平裝";
      const lines = [line(`${item}（${size}，2 公分內）`, price("7-1", item, size, "3~39本、2公分內"), quantity, "本")];
      const tier = colorThicknessTier(Math.min(mm, 50));
      if (tier) lines.push(line(`厚度加價（${tier.replace("厚度", "")}）`, price("7-1", "彩平裝", size, tier), quantity, "本"));
      lines.push(...overFiveCm(mm, size, quantity));
      if (values.foldFlap === "需要") lines.push(line("封面加折書口", price("7-1", "彩平裝", size, "封面加折書口"), quantity, "本"));
      return withPrint({ lines }, values, quantity, printSizeOf(size));
    },
  },
  {
    slug: "hardcover", title: "精裝", smallQuantity: "sample50", bulk: "standard",
    fields: [
      { id: "bookSize", label: "成品尺寸", kind: "select", options: bookSizes },
      { id: "staple", label: "打釘", kind: "select", options: ["不需要", "加打釘"] },
      { id: "coverMaterial", label: "封面材質", kind: "select", options: ["彩色印刷封面", "皮面", "布面"] },
      ...innerFields,
    ],
    calc(values, quantity) {
      const size = values.bookSize ?? "";
      const mm = innerThicknessMm(values) ?? 0;
      const item = values.staple === "加打釘" ? "彩精裝+打釘" : "彩精裝";
      const lines = [line(`${item}（${size}，2 公分內）`, price("7-2", item, size, "3~39本、2公分內"), quantity, "本")];
      const tier = colorThicknessTier(Math.min(mm, 50));
      if (tier) lines.push(line(`厚度加價（${tier.replace("厚度", "")}）`, price("7-2", "彩精裝", size, tier), quantity, "本"));
      lines.push(...overFiveCm(mm, size, quantity));
      if (values.coverMaterial === "皮面") lines.push(line("皮面材料費", price("7-2", "皮面精裝材料費", size), quantity, "本"));
      if (values.coverMaterial === "布面") lines.push(line("布面材料費", price("7-2", "布面精裝材料費", size), quantity, "本"));
      return withPrint({ lines }, values, quantity, printSizeOf(size));
    },
  },
  {
    slug: "engineering-contract", title: "工程合約書", smallQuantity: "sample50", bulk: "standard",
    fields: [
      { id: "contractCover", label: "封面", kind: "select", options: ["自備封面平裝", "自備封面精裝", "皮面精裝"], help: "基本價含 A4、1 公分內。" },
      ...innerFields,
      { id: "foldDrawings", label: "夾附摺疊圖面", kind: "select", options: ["不需要", "A3→A4", "A2→A4", "A1→A4", "A0→A4"] },
      { id: "foldSheets", label: "摺疊圖面張數", kind: "number", min: 1, max: 500, unit: "張", unless: { field: "foldDrawings", values: ["不需要"] } },
      { id: "contractFoil", label: "封面燙金", kind: "select", options: ["不需要", "數位燙金", "製版燙金"] },
    ],
    calc(values, quantity) {
      const cover = values.contractCover ?? "";
      const lines = [line(`${cover}（A4，1 公分內）`, price("5-2", cover, "A4", "基本式"), quantity, "本")];
      const extraCm = Math.ceil(Math.max(0, (innerThicknessMm(values) ?? 0) - 10) / 10);
      if (extraCm) lines.push(line(`A4 資料厚度加價（${extraCm} 公分）`, price("5-2", cover, "A4", "A4資料每公分"), quantity * extraCm, "公分"));
      const fold = values.foldDrawings;
      if (fold && fold !== "不需要") {
        const foldCm: Record<string, string> = { "A3→A4": "0.03", "A2→A4": "0.07", "A1→A4": "0.1", "A0→A4": "0.13" };
        const sheets = Number(values.foldSheets);
        lines.push(line(`折紙費（${fold}）`, price("5-2", "折紙費", fold, `參考折完厚度 ${foldCm[fold]}cm`), quantity * sheets, "張"));
        const cm = Math.ceil(sheets * Number(foldCm[fold]));
        lines.push(line(`摺疊圖面厚度加價（${cm} 公分）`, price("5-2", cover, "A3~A1折完最大厚度", "每公分"), quantity * cm, "公分"));
      }
      if (values.contractFoil === "數位燙金") {
        lines.push(line("數位燙金（4 本內）", price("5-2", "數位燙金", "4本內"), 1, "件"));
        if (quantity > 4) lines.push(line("數位燙金（超過 4 本加價）", price("5-2", "數位燙金", "每增加1本"), quantity - 4, "本"));
      }
      if (values.contractFoil === "製版燙金") {
        lines.push(line("燙金製版費", price("5-2", "製版燙金", "製版費"), 1, "件"));
        lines.push(line("燙金費", price("5-2", "製版燙金", "燙金費"), 1, "件"));
      }
      return withPrint({ lines }, values, quantity, "A4");
    },
  },
  {
    slug: "sewn-softcover", title: "線平裝", smallQuantity: "sample50", bulk: "standard",
    fields: [
      { id: "sewnSize", label: "成品尺寸", kind: "select", options: sewnSizes },
      { id: "foldFlap", label: "封面折書口", kind: "select", options: ["不需要", "需要"] },
      ...innerFields,
    ],
    calc(values, quantity) {
      const size = values.sewnSize ?? "";
      const item = values.foldFlap === "需要" ? "縫線彩平裝+折書口" : "縫線彩平裝";
      const lines = [line(`${item}（${size}，3 台內）`, price("8-1", item, size, "3~39本、3台內"), quantity, "本")];
      const extra = extraSignatures(values);
      if (extra) lines.push(line(`超過 3 台加價（${extra} 台，1 台＝16 頁）`, price("8-1", "超過3台", size, "每1台"), quantity * extra, "台"));
      return withPrint({ lines }, values, quantity, "A4");
    },
  },
  {
    slug: "sewn-hardcover", title: "線精裝", smallQuantity: "sample50", bulk: "standard",
    fields: [
      { id: "sewnSize", label: "成品尺寸", kind: "select", options: sewnSizes },
      { id: "spineStyle", label: "書背形式", kind: "select", options: ["方背", "圓背"] },
      { id: "coverMaterial", label: "封面材質", kind: "select", options: ["彩色印刷封面", "皮面", "布面"] },
      { id: "elastic", label: "鬆緊帶", kind: "select", options: ["不需要", "需要"] },
      ...innerFields,
    ],
    calc(values, quantity) {
      const size = values.sewnSize ?? "";
      const item = values.spineStyle === "圓背" ? "圓背線精裝" : "方背線彩精裝";
      const lines = [line(`${item}（${size}，3 台內）`, price("9-1", item, size, "3~39本、3台內"), quantity, "本")];
      const extra = extraSignatures(values);
      if (extra) lines.push(line(`超過 3 台加價（${extra} 台，1 台＝16 頁）`, price("9-1", "超過3台", size, "每1台"), quantity * extra, "台"));
      if (values.coverMaterial === "皮面") lines.push(line("皮面材料費", price("9-1", "皮面精裝材料費", size), quantity, "本"));
      if (values.coverMaterial === "布面") lines.push(line("布面材料費", price("9-1", "布面精裝材料費", size), quantity, "本"));
      if (values.elastic === "需要") lines.push(line("鬆緊帶", price("9-1", "鬆緊帶", ""), quantity, "本"));
      return withPrint({ lines }, values, quantity, "A4");
    },
  },
  {
    slug: "exposed-spine-sewn", title: "裸背線裝", smallQuantity: "sample50", bulk: "standard",
    fields: [
      { id: "sewnSize", label: "成品尺寸", kind: "select", options: sewnSizes },
      { id: "exposedStyle", label: "款式", kind: "select", options: ["裸背線裝", "縫線厚平裝"] },
      ...innerFields,
    ],
    calc(values, quantity) {
      const size = values.sewnSize ?? "";
      const item = values.exposedStyle ?? "";
      const lines = [line(`${item}（${size}，3 台內）`, price("8-2", item, size, "3~39本、3台內"), quantity, "本")];
      const extra = extraSignatures(values);
      if (extra) lines.push(line(`超過 3 台加價（${extra} 台，1 台＝16 頁）`, price("8-2", "超過3台", size, "每1台"), quantity * extra, "台"));
      return withPrint({ lines }, values, quantity, "A4");
    },
  },
  {
    slug: "machine-sewn-binding", title: "車線平裝", smallQuantity: "included", bulk: "standard",
    fields: [
      { id: "foldSize", label: "原稿 → 成品尺寸", kind: "select", options: ["A3→A4/B4→B5", "A4→A5/B5→B6"] },
      ...innerFields,
    ],
    calc(values, quantity) {
      const mm = innerThicknessMm(values) ?? 0;
      const spec = `${values.foldSize} 厚度${mm <= 2 ? "<2mm" : ">2mm"}`;
      const condition = quantity <= 2 ? "1~2本打樣" : "3~39本";
      const lines = [line(`車線平裝（${spec}）`, price("9-2", "車線平裝（車線騎馬裝）", spec, condition), quantity, "本")];
      return withPrint({ lines }, values, quantity, values.foldSize?.startsWith("A3") ? "A3" : "A4");
    },
  },
  {
    slug: "saddle-stitch", title: "騎馬釘", smallQuantity: "sample50", bulk: "standard",
    fields: [
      { id: "saddleSize", label: "成品尺寸", kind: "select", options: ["A5", "A4/B5", "A4R/B5R", "B4/A3"], help: "騎馬釘內頁最多 100 頁（25 張對摺）。" },
      ...innerFields,
    ],
    calc(values, quantity) {
      const pages = innerPages(values) ?? 0;
      if (pages > 100) return { invalid: "騎馬釘內頁最多 100 頁，超過請改選膠裝。" };
      const size = values.saddleSize ?? "";
      const base: Record<string, number> = { A5: 15, "A4/B5": 20, "A4R/B5R": 25, "B4/A3": 35 };
      const lines = [line(`騎馬釘（${size}）`, estimated(base[size], "騎馬釘"), quantity, "本")];
      return withPrint({ lines }, values, quantity, printSizeOf(size));
    },
  },
  {
    slug: "ring-binding", title: "線圈環裝", smallQuantity: "sample50", bulk: "standard",
    fields: [
      { id: "ringSize", label: "成品尺寸", kind: "select", options: ["A4（含 B5、A5）", "A3R（含 A3、B4）"] },
      { id: "ringType", label: "線圈種類", kind: "select", options: ["環裝", "雙線圈"] },
      { id: "clearCover", label: "透明膠片封面封底", kind: "select", options: ["不需要", "需要"] },
      ...innerFields,
    ],
    calc(values, quantity) {
      const size = values.ringSize?.startsWith("A3") ? "A3R" : "A4";
      const kind = values.ringType === "雙線圈" ? "雙線圈代工" : "環裝代工";
      const mm = innerThicknessMm(values) ?? 0;
      const ring = pickRing(kind, mm);
      const lines = [line(`${values.ringType}（${size}，${ring.spec}）`, price("P13", kind, size, ring.spec), quantity, "本")];
      if (ring.overCm) lines.push(line(`超過最大線圈規格加價（${ring.overCm} 公分）`, estimated(20, "線圈超過最大規格每公分"), quantity * ring.overCm, "公分"));
      if (values.clearCover === "需要") lines.push(line("透明膠片（封面＋封底）", price("P13", "膠片", size === "A3R" ? "A3" : "A4", "每張"), quantity * 2, "張"));
      return withPrint({ lines, notes: [`依內頁厚度自動選用 ${ring.spec} 線圈。`] }, values, quantity, size === "A3R" ? "A3" : "A4");
    },
  },
  {
    slug: "traditional-thread-binding", title: "古書裝訂", smallQuantity: "sample50", bulk: "standard",
    fields: [
      { id: "threadStyle", label: "裝訂形式", kind: "select", options: ["四眼線裝", "六眼線裝", "經摺裝"] },
      { id: "threadSize", label: "成品尺寸", kind: "select", options: ["A5", "A4/B5"] },
      ...innerFields,
    ],
    calc(values, quantity) {
      const style = values.threadStyle ?? "";
      const size = values.threadSize ?? "";
      const accordion = style === "經摺裝";
      const amount = size === "A5" ? (accordion ? 130 : 100) : (accordion ? 150 : 120);
      const lines = [line(`${style}（${size}，50 張內）`, estimated(amount, "古書裝訂"), quantity, "本")];
      const extra = Math.ceil(Math.max(0, (innerSheets(values) ?? 0) - 50) / 10);
      if (extra) lines.push(line(`超過 50 張加價（每 10 張，${extra} 組）`, estimated(10, "古書裝訂超過 50 張每 10 張"), quantity * extra, "組"));
      return withPrint({ lines }, values, quantity, "A4");
    },
  },
  {
    slug: "butterfly-book", title: "蝴蝶平、精裝", smallQuantity: "sample50", bulk: "standard",
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
    slug: "construction-book", title: "工程施工本", smallQuantity: "sample50", bulk: "standard",
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
      const fold = values.drawingFold ?? "";
      const sheets = Number(values.drawingSheets);
      const lines = [line(`工程圖冊 ${values.drawingCover}（${fold}，10 張內）`, price("4-2", values.drawingCover ?? "", fold, "10張內"), quantity, "本")];
      const extra = Math.ceil(Math.max(0, sheets - 10) / 10);
      if (extra) lines.push(line(`超過 10 張加價（每 10 張，共 ${extra} 組）`, price("4-2", "每增加10張", fold), quantity * extra, "組"));
      if (values.drawingFoil === "需要燙金") lines.push(line(`燙金費（${fold}）`, price("4-2", "燙金費概估", fold, "每件概估"), 1, "件"));
      return { lines };
    },
  },
  {
    slug: "screw-contract", title: "鎖螺絲合約書", smallQuantity: "included", bulk: "standard",
    fields: [
      { id: "screwType", label: "螺絲形式", kind: "select", options: ["外裝式螺絲", "內裝兩片式", "內裝式螺絲"], help: "基本價含 A4、1 公分內、2 孔。" },
      ...innerFields,
    ],
    calc(values, quantity) {
      const mm = innerThicknessMm(values) ?? 0;
      const lines = [line(`合約書 ${values.screwType}（A4，1 公分內）`, price("11-2", "合約書", values.screwType ?? "", "1~39本、A4、1公分內2孔"), quantity, "本")];
      const extraCm = Math.ceil(Math.max(0, mm - 10) / 10);
      if (extraCm) lines.push(line(`資料厚度加價（超過 1 公分，共 ${extraCm} 公分）`, price("11-2", "A4資料厚度", "A4", "每公分"), quantity * extraCm, "公分"));
      return withPrint({ lines }, values, quantity, "A4");
    },
  },
  {
    slug: "menu-production", title: "菜單螺絲裝", smallQuantity: "sample50", bulk: "standard",
    fields: [
      { id: "screwType", label: "螺絲形式", kind: "select", options: ["外裝式螺絲", "內裝兩片式", "內裝式螺絲"], help: "基本價含 A4、1 公分內、2 孔。" },
      ...innerFields,
      { id: "menuCorner", label: "護角", kind: "select", options: ["不需要", "加護角"] },
      { id: "waistFold", label: "內頁腰折線", kind: "select", options: ["不需要", "需要"] },
    ],
    calc(values, quantity) {
      const mm = innerThicknessMm(values) ?? 0;
      const lines = [line(`菜單 ${values.screwType}（A4，1 公分內）`, price("11-1", "菜單", values.screwType ?? "", "3~39本、A4、1公分內2孔"), quantity, "本")];
      const extraCm = Math.ceil(Math.max(0, mm - 10) / 10);
      if (extraCm) lines.push(line(`厚度加價（超過 1 公分，共 ${extraCm} 公分）`, price("11-1", "超過厚度", "A4", "每公分"), quantity * extraCm, "公分"));
      if (values.menuCorner === "加護角") lines.push(line("護角", price("11-1", "護角", "", "每本"), quantity, "本"));
      if (values.waistFold === "需要") lines.push(line("內頁腰折線", price("11-1", "內頁腰折線", "", "每張"), quantity * (innerSheets(values) ?? 0), "張"));
      return withPrint({ lines }, values, quantity, "A4");
    },
  },
  {
    slug: "q-rod-hardcover", title: "Q桿精裝", smallQuantity: "sample50", bulk: "standard",
    fields: [{ id: "qRodCover", label: "封面", kind: "select", options: ["A4自備封面", "A4皮面"] }],
    calc(values, quantity) {
      return { lines: [line(`Q桿精裝（${values.qRodCover}）`, price("11-1", "Q桿菜單", values.qRodCover ?? ""), quantity, "本")] };
    },
  },
];

const bySlug = new Map(products.map((product) => [product.slug, product]));

export function isAutoPriced(slug: string) { return bySlug.has(slug); }
export function pricingFields(slug: string) { return bySlug.get(slug)?.fields ?? []; }
/** 有內頁印刷欄位的產品（設計師模式會多出紙張、張數等欄位）。 */
export function hasInnerPages(slug: string) { return pricingFields(slug).some((field) => field.id === "printColor"); }

function matches(condition: Condition | undefined, values: Values) {
  return !condition || condition.values.includes(values[condition.field] ?? "");
}

const designerOnlyIds = new Set(innerFields.filter((field) => field.only === "designer" && !innerFields.some((other) => other.id === field.id && other.only !== "designer")).map((field) => field.id));

/** 一般客戶模式忽略設計師專用欄位的值（避免切換模式後殘留的值影響計價）。 */
export function effectiveValues(values: Values): Values {
  if (isDesigner(values)) return values;
  return Object.fromEntries(Object.entries(values).filter(([key]) => !designerOnlyIds.has(key)));
}

export function visiblePricingFields(slug: string, values: Values) {
  const mode = isDesigner(values) ? "designer" : "simple";
  const effective = effectiveValues(values);
  return pricingFields(slug).filter((field) => (!field.only || field.only === mode) && matches(field.when, effective) && !(field.unless && matches(field.unless, effective)));
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
  if (choice.needsDistrict && !motorDistricts.includes(district as (typeof motorDistricts)[number])) return null;
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
  const result = product.calc(effectiveValues(input.values), quantity);
  if ("invalid" in result) return { ...base, status: "incomplete", reason: result.invalid };
  const lines = [...result.lines];
  if (product.bulk === "standard" && quantity >= 40) {
    // 每件一次的固定費用（製版、燙金基本費等）不打折。
    const discountable = lines.filter((item) => item.unit !== "件").reduce((sum, item) => sum + item.amount, 0);
    const rate = quantity >= 100 ? 0.2 : 0.1;
    const amount = -Math.round(discountable * rate);
    lines.push({ label: quantity >= 100 ? "100 本以上 8 折" : "40~99 本 9 折", unitPrice: amount, quantity: 1, unit: "式", amount, source: "價格規則：比照證書夾數量折扣（2026-11-16 確認）" });
  }
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
