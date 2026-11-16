import assert from "node:assert/strict";
import test from "node:test";
import { MODE_DESIGNER, NO_PRINT, calculateEstimate, innerThicknessMm, invalidPricingFields, isAutoPriced, pickRing, pricingFields, shippingFor, visiblePricingFields } from "./pricing.ts";

const total = (slug: string, quantity: number, values: Record<string, string>, shippingId = "pickup", district?: string) =>
  calculateEstimate({ productSlug: slug, quantity, values, shippingId, district });

/** 一般客戶模式、不需要印刷：只算裝訂費。 */
const inner = (pages: string, extra: Record<string, string> = {}) => ({ pages, printSides: "雙面印刷", printColor: NO_PRINT, ...extra });
const designer = (extra: Record<string, string>) => ({ mode: MODE_DESIGNER, paper: "80g 道林紙", countUnit: "張數", printSides: "雙面印刷", coverPaper: "不指定", ...extra });

const baseValues: Record<string, Record<string, string>> = {
  "thesis-binding": { thesisInner: "內頁尚未膠裝", thesisFoil: "不需要燙金", schoolLogo: "不需要", ...inner("100") },
  "certificate-folder": { certStyle: "普通兩片式", certLining: "不需要", certCorner: "不需要", certFoil: "不需要", certLiningCount: "1" },
  "perfect-binding": { bookSize: "A4/B5", staple: "不需要", foldFlap: "不需要", ...inner("100") },
  "hardcover": { bookSize: "A4/B5", staple: "不需要", coverMaterial: "彩色印刷封面", ...inner("100") },
  "engineering-contract": { contractCover: "自備封面平裝", foldDrawings: "不需要", foldSheets: "5", contractFoil: "不需要", ...inner("100") },
  "sewn-softcover": { sewnSize: "A4/B5", foldFlap: "不需要", ...inner("40") },
  "sewn-hardcover": { sewnSize: "A4/B5", spineStyle: "方背", coverMaterial: "彩色印刷封面", elastic: "不需要", ...inner("40") },
  "exposed-spine-sewn": { sewnSize: "A4/B5", exposedStyle: "裸背線裝", ...inner("40") },
  "machine-sewn-binding": { foldSize: "A3→A4/B4→B5", ...inner("20") },
  "saddle-stitch": { saddleSize: "A4/B5", ...inner("32") },
  "ring-binding": { ringSize: "A4（含 B5、A5）", ringType: "環裝", clearCover: "不需要", ...inner("100") },
  "traditional-thread-binding": { threadStyle: "四眼線裝", threadSize: "A4/B5", ...inner("60") },
  "butterfly-book": { butterflySize: "A4/B5", mounting: "直裱", butterflyBinding: "平裝", thicken: "不需要", sheets: "8" },
  "construction-book": { constructionType: "工程圖冊", drawingCover: "專用皮", drawingFold: "A3→A4", drawingSheets: "25", drawingFoil: "不需要", bindingCover: "自備封面封底", bindingSize: "A2", bindingThickness: "3" },
  "screw-contract": { screwType: "外裝式螺絲", ...inner("300") },
  "menu-production": { screwType: "外裝式螺絲", menuCorner: "加護角", waistFold: "需要", ...inner("20") },
  "q-rod-hardcover": { qRodCover: "A4自備封面" },
};

test("所有可下單產品都能自動計價，每個選項（兩種模式）都對得到價目", () => {
  for (const [slug, values] of Object.entries(baseValues)) {
    assert.ok(isAutoPriced(slug), slug);
    for (const mode of ["一般客戶", MODE_DESIGNER]) {
      const modeValues = mode === MODE_DESIGNER ? { ...values, ...designer({ innerSheetCount: "50" }) } : values;
      for (const field of pricingFields(slug).filter((item) => !item.only || item.only === (mode === MODE_DESIGNER ? "designer" : "simple"))) {
        if (field.kind !== "select") continue;
        for (const option of field.options) {
          for (const quantity of [1, 10, 50, 150]) {
            const result = total(slug, quantity, { ...modeValues, [field.id]: option, colorSheets: "10" });
            assert.equal(result.status, "priced", `${mode} ${slug} ${field.id}=${option} ×${quantity} → ${result.reason ?? ""}`);
          }
        }
      }
    }
  }
});

test("膠裝：A4、80g 雙面 300 頁＝150 張 1.5 公分，10 本", () => {
  const result = total("perfect-binding", 10, { ...baseValues["perfect-binding"], ...inner("300") });
  assert.equal(result.subtotal, 450); // 45 × 10
  assert.equal(result.total, 450);
});

test("膠裝：厚度 2~3 公分加價、折書口、運費", () => {
  const result = total("perfect-binding", 5, { bookSize: "A4/B5", staple: "加打釘", foldFlap: "需要", ...inner("500") }, "hct");
  assert.equal(result.subtotal, (50 + 5 + 15) * 5);
  assert.equal(result.total, (50 + 5 + 15) * 5 + 130);
});

test("頁數換算：單面每頁 1 張、雙面進位；一般客戶固定 80g 道林", () => {
  assert.equal(innerThicknessMm({ mode: MODE_DESIGNER, paper: "100g 道林紙", pages: "101", printSides: "雙面印刷" }), 6.63); // 51 張 × 0.13
  assert.equal(innerThicknessMm({ pages: "100", printSides: "單面印刷" }), 10);
  assert.equal(innerThicknessMm({ paper: "萊妮紙 250g", pages: "100", printSides: "單面印刷" }), 10); // 一般模式忽略紙種
  assert.equal(innerThicknessMm(designer({ paper: "萊妮紙 250g", innerSheetCount: "10" })), 3);
});

test("剛好 2 公分算在 2 公分以下", () => {
  assert.equal(total("perfect-binding", 3, { ...baseValues["perfect-binding"], ...inner("400") }).subtotal, 45 * 3);
});

test("超過 5 公分改為每公分加價（比照 5-1）", () => {
  // 1200 頁雙面 = 600 張 × 0.1 = 60mm → 4~5 公分 +20，再超過 1 公分 +10
  const result = total("perfect-binding", 3, { ...baseValues["perfect-binding"], ...inner("1200") });
  assert.equal(result.status, "priced");
  assert.equal(result.subtotal, (45 + 20 + 10) * 3);
});

test("內頁印刷費：每行小計四捨五入，B5 照 A4、A3 尺寸照 A3", () => {
  const bw = total("perfect-binding", 3, { ...baseValues["perfect-binding"], ...inner("30", { printColor: "黑白", printSides: "單面印刷" }) });
  const printLine = bw.lines.find((item) => item.label.startsWith("內頁黑白印刷"))!;
  assert.equal(printLine.quantity, 90); // 30 張 × 3 本
  assert.equal(printLine.amount, 54); // 0.6 × 90
  const color = total("perfect-binding", 1, { ...baseValues["perfect-binding"], bookSize: "A3/30x30mm", ...inner("21", { printColor: "彩色" }) });
  assert.equal(color.lines.find((item) => item.label.startsWith("內頁彩色印刷"))!.amount, 11 * 8);
  const rounding = total("perfect-binding", 1, { ...baseValues["perfect-binding"], ...inner("15", { printColor: "黑白", printSides: "單面印刷" }) });
  assert.equal(rounding.lines.find((item) => item.label.startsWith("內頁黑白印刷"))!.amount, 9);
  const odd = total("perfect-binding", 1, { ...baseValues["perfect-binding"], ...inner("7", { printColor: "黑白", printSides: "單面印刷" }) });
  assert.equal(odd.lines.find((item) => item.label.startsWith("內頁黑白印刷"))!.amount, 4); // 4.2 → 4
});

test("設計師：混合印刷分兩行，彩色張數不可超過總張數", () => {
  const values = { ...baseValues["perfect-binding"], ...designer({ innerSheetCount: "50", printColor: "黑白彩色混合", colorSheets: "10" }) };
  const result = total("perfect-binding", 2, values);
  assert.equal(result.lines.find((item) => item.label.startsWith("內頁彩色"))!.amount, 6 * 10 * 2);
  assert.equal(result.lines.find((item) => item.label.startsWith("內頁黑白"))!.amount, 1 * 40 * 2);
  assert.equal(total("perfect-binding", 2, { ...values, colorSheets: "60" }).status, "incomplete");
});

test("模式切換：一般客戶看不到設計師欄位，殘留值也不影響", () => {
  const simpleIds = visiblePricingFields("perfect-binding", { countUnit: "張數" }).map((field) => field.id);
  assert.ok(simpleIds.includes("pages"));
  assert.ok(!simpleIds.includes("paper") && !simpleIds.includes("innerSheetCount"));
  const designerIds = visiblePricingFields("perfect-binding", designer({})).map((field) => field.id);
  assert.ok(designerIds.includes("paper") && designerIds.includes("innerSheetCount") && !designerIds.includes("pages"));
});

test("1~2 本打樣：一般 +50／本；車線平裝用價目表打樣價", () => {
  const thesis = total("thesis-binding", 2, baseValues["thesis-binding"]);
  assert.equal(thesis.subtotal, (135 + 50) * 2);
  const sewn = total("machine-sewn-binding", 1, { foldSize: "A4→A5/B5→B6", ...inner("16") });
  assert.equal(sewn.subtotal, 45);
});

test("論文燙金與封底燙校徽", () => {
  const values = { ...baseValues["thesis-binding"], thesisInner: "內頁已膠裝" };
  assert.equal(total("thesis-binding", 6, { ...values, thesisFoil: "數位燙金（免製版）" }).subtotal, 125 * 6 + 500 + 70 * 2);
  assert.equal(total("thesis-binding", 6, { ...values, thesisFoil: "製版燙金（全版）" }).subtotal, 125 * 6 + 1050);
  assert.equal(total("thesis-binding", 6, { ...values, thesisFoil: "製版燙金（共版・限台中市大學）" }).subtotal, 125 * 6 + 800);
  assert.equal(total("thesis-binding", 6, { ...values, schoolLogo: "需要" }).subtotal, 125 * 6 + 150);
});

test("數量折扣：一般品項 40~99 9 折、100 以上 8 折；固定費用不打折；證書夾維持原規則", () => {
  const perfect = baseValues["perfect-binding"];
  assert.equal(total("perfect-binding", 40, perfect).subtotal, 45 * 40 - Math.round(45 * 40 * 0.1));
  assert.equal(total("perfect-binding", 100, perfect).subtotal, 45 * 100 - Math.round(45 * 100 * 0.2));
  const thesis = { ...baseValues["thesis-binding"], thesisFoil: "製版燙金（全版）" };
  assert.equal(total("thesis-binding", 50, thesis).subtotal, 135 * 50 - Math.round(135 * 50 * 0.1) + 1050);
  const cert = { certStyle: "普通兩片式", certLining: "不需要", certCorner: "不需要", certFoil: "不需要" };
  assert.equal(total("certificate-folder", 10, cert).subtotal, 1150);
  assert.equal(total("certificate-folder", 50, cert).subtotal, Math.round(115 * 0.9 * 50));
  assert.equal(total("certificate-folder", 100, { ...cert, certFoil: "需要燙金" }).subtotal, Math.round(115 * 0.8 * 100) + 8 * 100);
  assert.equal(total("certificate-folder", 50, { ...cert, certFoil: "需要燙金" }).subtotal, Math.round(115 * 0.9 * 50) + 500 + 450);
  assert.equal(total("certificate-folder", 300, cert).subtotal, Math.round(115 * 0.8 * 300));
});

test("線平裝：超過 3 台（48 頁）每台加價", () => {
  // 80 頁 = 5 台 → 超過 2 台 × 5
  assert.equal(total("sewn-softcover", 5, { ...baseValues["sewn-softcover"], ...inner("80") }).subtotal, (65 + 2 * 5) * 5);
});

test("線圈：依厚度選規格，超過最大規格每公分 +20", () => {
  assert.deepEqual(pickRing("環裝代工", 9), { spec: "規格 10/12", overCm: 0 });
  assert.deepEqual(pickRing("環裝代工", 5), { spec: "規格 6/8", overCm: 0 });
  assert.deepEqual(pickRing("環裝代工", 60), { spec: "規格 51", overCm: 2 });
  // 100 頁雙面 = 50 張 = 5mm → 6/8 規格 25 元；膠片封面封底 2 × 5
  assert.equal(total("ring-binding", 3, { ...baseValues["ring-binding"], clearCover: "需要" }).subtotal, (25 + 10) * 3);
});

test("估計價：騎馬釘與古書裝訂；騎馬釘超過 100 頁不能計價", () => {
  assert.equal(total("saddle-stitch", 10, baseValues["saddle-stitch"]).subtotal, 200);
  assert.equal(total("saddle-stitch", 10, { ...baseValues["saddle-stitch"], ...inner("120") }).status, "incomplete");
  // 120 張 → 超過 70 張 = 7 組 × 10
  assert.equal(total("traditional-thread-binding", 3, { ...baseValues["traditional-thread-binding"], ...inner("240") }).subtotal, (120 + 70) * 3);
  assert.ok(total("saddle-stitch", 10, baseValues["saddle-stitch"]).lines[0].source.startsWith("估計價"));
});

test("工程合約書：厚度、折紙與燙金", () => {
  // 300 頁 = 150 張 = 15mm → 超過 1 公分 1 公分 +10；A2→A4 10 張：折紙 2.5×10，厚度 0.7 → 1 公分 +30
  const result = total("engineering-contract", 2, { ...baseValues["engineering-contract"], ...inner("300"), foldDrawings: "A2→A4", foldSheets: "10", contractFoil: "製版燙金" });
  assert.equal(result.subtotal, (40 + 10 + 25 + 30) * 2 + 500 + 450 + 50 * 2);
});

test("工程圖冊燙金依尺寸概估", () => {
  const result = total("construction-book", 3, { ...baseValues["construction-book"], drawingSheets: "8", drawingFoil: "需要燙金" });
  assert.equal(result.subtotal, 80 * 3 + 400);
});

test("規格不完整時不顯示金額", () => {
  const result = total("perfect-binding", 10, { bookSize: "A4/B5" });
  assert.equal(result.status, "incomplete");
  assert.equal(result.subtotal, null);
  assert.ok(invalidPricingFields("perfect-binding", { bookSize: "A4/B5" }).includes("pages"));
});

test("條件欄位：A4R 蝶冊不顯示裱法", () => {
  const ids = visiblePricingFields("butterfly-book", { butterflySize: "A4R" }).map((field) => field.id);
  assert.ok(!ids.includes("mounting"));
  assert.ok(ids.includes("thicken"));
  const result = total("butterfly-book", 3, { butterflySize: "A4R", thicken: "加厚", sheets: "7" });
  assert.equal(result.subtotal, 180 * 3 + 7 * 2 * 3 + 10 * 3);
});

test("工程圖冊每增加 10 張加價", () => {
  const result = total("construction-book", 2, { constructionType: "工程圖冊", drawingCover: "專用皮", drawingFold: "A3→A4", drawingSheets: "25", drawingFoil: "不需要" });
  assert.equal(result.subtotal, (80 + 10 * 2 + 50) * 2);
});

test("運費：機車配送需指定區域", () => {
  assert.equal(shippingFor("moto-next", undefined), null);
  assert.equal(shippingFor("moto-next", "大里")?.fee, 90);
  assert.equal(shippingFor("hct", undefined)?.fee, 130);
});

test("未知產品仍回傳人工", () => {
  assert.equal(total("no-such-product", 5, {}).status, "manual");
});
