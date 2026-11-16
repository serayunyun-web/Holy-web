import assert from "node:assert/strict";
import test from "node:test";
import { calculateEstimate, innerThicknessMm, invalidPricingFields, isAutoPriced, pricingFields, shippingFor, visiblePricingFields } from "./pricing.ts";

const total = (slug: string, quantity: number, values: Record<string, string>, shippingId = "pickup", district?: string) =>
  calculateEstimate({ productSlug: slug, quantity, values, shippingId, district });

test("每個自動計價產品的所有選項組合都能在價目表找到價格", () => {
  // 以每個 select 的每個選項各跑一次，確保沒有對不到價目表的組合（對不到會丟出 price-missing）。
  const base: Record<string, Record<string, string>> = {
    "thesis-binding": { thesisInner: "內頁尚未膠裝", thesisFoil: "不需要燙金", schoolLogo: "不需要" },
    "certificate-folder": { certStyle: "普通兩片式", certLining: "不需要", certCorner: "不需要", certFoil: "不需要", certLiningCount: "1" },
    "perfect-binding": { bookSize: "A4/B5", staple: "不需要", paper: "80g 道林紙", pages: "100", printSides: "雙面印刷", foldFlap: "不需要" },
    "hardcover": { bookSize: "A4/B5", staple: "不需要", coverMaterial: "彩色印刷封面", paper: "80g 道林紙", pages: "100", printSides: "雙面印刷" },
    "machine-sewn-binding": { foldSize: "A3→A4/B4→B5", paper: "80g 道林紙", pages: "20", printSides: "雙面印刷" },
    "butterfly-book": { butterflySize: "A4/B5", mounting: "直裱", butterflyBinding: "平裝", thicken: "不需要", sheets: "8" },
    "construction-book": { constructionType: "工程圖冊", drawingCover: "專用皮", drawingFold: "A3→A4", drawingSheets: "25", drawingFoil: "不需要", bindingCover: "自備封面封底", bindingSize: "A2", bindingThickness: "3" },
    "screw-contract": { screwType: "外裝式螺絲", paper: "80g 道林紙", pages: "300", printSides: "雙面印刷" },
    "menu-production": { screwType: "外裝式螺絲", paper: "150g 道林紙／蒙肯紙", pages: "20", printSides: "雙面印刷", menuCorner: "加護角", waistFold: "需要" },
    "q-rod-hardcover": { qRodCover: "A4自備封面" },
  };
  for (const [slug, values] of Object.entries(base)) {
    assert.ok(isAutoPriced(slug), slug);
    for (const field of pricingFields(slug)) {
      if (field.kind !== "select") continue;
      for (const option of field.options) {
        const result = total(slug, 10, { ...values, [field.id]: option });
        assert.ok(result.status === "priced" || result.status === "manual", `${slug} ${field.id}=${option} → ${result.status} ${result.reason ?? ""}`);
      }
    }
    const pricedTypes = ["工程圖冊", "工程圖裝訂"];
    if (slug === "construction-book") for (const type of pricedTypes) assert.equal(total(slug, 10, { ...values, constructionType: type }).status, "priced");
  }
});

test("膠裝：A4、80g 雙面 300 頁＝150 張 1.5 公分，10 本", () => {
  const result = total("perfect-binding", 10, { bookSize: "A4/B5", staple: "不需要", paper: "80g 道林紙", pages: "300", printSides: "雙面印刷", foldFlap: "不需要" });
  assert.equal(result.status, "priced");
  assert.equal(result.subtotal, 450); // 45 × 10
  assert.equal(result.total, 450);
});

test("膠裝：厚度 2~3 公分加價、折書口、運費", () => {
  // 80g 雙面 500 頁 = 250 張 = 25mm → 2~3 公分 +5；折書口 +15
  const result = total("perfect-binding", 5, { bookSize: "A4/B5", staple: "加打釘", paper: "80g 道林紙", pages: "500", printSides: "雙面印刷", foldFlap: "需要" }, "hct");
  assert.equal(result.subtotal, (50 + 5 + 15) * 5);
  assert.equal(result.total, (50 + 5 + 15) * 5 + 130);
});

test("頁數換算：單面每頁 1 張、雙面進位", () => {
  assert.equal(innerThicknessMm({ paper: "100g 道林紙", pages: "101", printSides: "雙面印刷" }), 6.63); // 51 張 × 0.13
  assert.equal(innerThicknessMm({ paper: "80g 道林紙", pages: "100", printSides: "單面印刷" }), 10);
});

test("剛好 2 公分算在 2 公分以下", () => {
  const result = total("perfect-binding", 3, { bookSize: "A4/B5", staple: "不需要", paper: "80g 道林紙", pages: "400", printSides: "雙面印刷", foldFlap: "不需要" });
  assert.equal(result.subtotal, 45 * 3);
});

test("超過 5 公分轉人工", () => {
  const result = total("perfect-binding", 3, { bookSize: "A4/B5", staple: "不需要", paper: "80g 道林紙", pages: "1200", printSides: "雙面印刷", foldFlap: "不需要" });
  assert.equal(result.status, "manual");
});

test("1~2 本打樣：一般 +50／本；車線平裝用價目表打樣價", () => {
  const thesis = total("thesis-binding", 2, { thesisInner: "內頁尚未膠裝", thesisFoil: "不需要燙金", schoolLogo: "不需要" });
  assert.equal(thesis.subtotal, (135 + 50) * 2);
  const sewn = total("machine-sewn-binding", 1, { foldSize: "A4→A5/B5→B6", paper: "80g 道林紙", pages: "16", printSides: "雙面印刷" });
  assert.equal(sewn.subtotal, 45);
});

test("論文數位燙金：4 本內 500，超過每本 +70；製版費每件一次", () => {
  const digital = total("thesis-binding", 6, { thesisInner: "內頁已膠裝", thesisFoil: "數位燙金（免製版）", schoolLogo: "不需要" });
  assert.equal(digital.subtotal, 125 * 6 + 500 + 70 * 2);
  const plate = total("thesis-binding", 6, { thesisInner: "內頁已膠裝", thesisFoil: "製版燙金（全版）", schoolLogo: "不需要" });
  assert.equal(plate.subtotal, 125 * 6 + 1050);
  assert.equal(total("thesis-binding", 6, { thesisInner: "內頁已膠裝", thesisFoil: "不需要燙金", schoolLogo: "需要" }).status, "manual");
});

test("一般品項 40 本以上轉人工；證書夾 40~99 9 折、100~199 8 折、200 以上人工", () => {
  assert.equal(total("perfect-binding", 40, { bookSize: "A4/B5", staple: "不需要", paper: "80g 道林紙", pages: "100", printSides: "雙面印刷", foldFlap: "不需要" }).status, "manual");
  const cert = { certStyle: "普通兩片式", certLining: "不需要", certCorner: "不需要", certFoil: "不需要" };
  assert.equal(total("certificate-folder", 10, cert).subtotal, 1150);
  assert.equal(total("certificate-folder", 50, cert).subtotal, Math.round(115 * 0.9 * 50));
  assert.equal(total("certificate-folder", 100, { ...cert, certFoil: "需要燙金" }).subtotal, Math.round(115 * 0.8 * 100) + 8 * 100);
  assert.equal(total("certificate-folder", 50, { ...cert, certFoil: "需要燙金" }).status, "manual");
  assert.equal(total("certificate-folder", 200, cert).status, "manual");
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

test("未設定自動計價的產品轉人工", () => {
  assert.equal(total("sewn-softcover", 5, {}).status, "manual");
});
