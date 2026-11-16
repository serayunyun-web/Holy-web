// 規格欄位中文名稱（Email、後台、工作單共用）。自動計價欄位取自計價引擎；其餘欄位對應 src/data/order-options.ts。
import { pricingFields } from "./pricing.ts";

const manualLabels: Record<string, string> = {
  purpose: "用途", size: "成品尺寸", orientation: "成品方向", pages: "內頁頁數", insidePrint: "內頁印刷", printSides: "印刷面",
  cover: "封面材質", coverSample: "皮面／膠皮", turning: "翻閱方向", coverFinish: "封面加工", coverFilm: "封面膠片",
  coverColor: "封面顏色／樣品編號", foilContent: "燙金內容", projectName: "製作名稱", coverSampleChoice: "選擇的樣品", mode: "填寫模式",
};

/** 依填寫順序回傳 [欄位名稱, 值]。 */
export function specRows(productSlug: string, specifications: Record<string, unknown>): [string, string][] {
  const fields = new Map(pricingFields(productSlug).map((field) => [field.id, field]));
  return Object.entries(specifications).filter(([, value]) => typeof value === "string" && value.trim()).map(([id, value]) => {
    const field = fields.get(id);
    const unit = field?.kind === "number" ? ` ${field.unit}` : "";
    return [field?.label ?? manualLabels[id] ?? id, `${value}${unit}`];
  });
}

export const allowedManualSpecKeys = new Set(Object.keys(manualLabels));
