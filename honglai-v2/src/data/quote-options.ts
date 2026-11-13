export type ShippingOption = {
  id: "pickup" | "freight" | "post" | "taichung";
  label: string;
  note: string;
  fee: number;
};

export const shippingOptions: readonly ShippingOption[] = [
  { id: "pickup", label: "自取", note: "不加運費", fee: 0 },
  { id: "freight", label: "貨運", note: "每筆固定運費", fee: 150 },
  { id: "post", label: "郵寄", note: "每筆固定運費", fee: 80 },
  { id: "taichung", label: "台中市內寄送", note: "每筆固定運費", fee: 100 },
] as const;

const manualMarkers = ["自訂", "其他", "不確定", "請專人建議", "尚未決定"];

export type QuoteReadiness = {
  mode: "pending-price-data" | "manual";
  title: string;
  message: string;
};

export function evaluateQuoteReadiness(productSlug: string, quantity: number, values: Record<string, string>, freeTextFieldIds: readonly string[] = []): QuoteReadiness {
  if (productSlug === "menu-production") {
    return {
      mode: "manual",
      title: "需要人工估價",
      message: "菜單製作的正式價目資料尚未補齊，請先填寫需求，由專人協助確認。",
    };
  }

  if (productSlug !== "certificate-folder" && quantity >= 40) {
    return {
      mode: "manual",
      title: "需要人工估價",
      message: "一般品項 40 本以上改由專人計價；證書夾不受此數量上限限制。",
    };
  }

  const hasNonStandardOption = Object.values(values).some((value) => manualMarkers.some((marker) => value.includes(marker)));
  if (hasNonStandardOption) {
    return {
      mode: "manual",
      title: "需要人工估價",
      message: "目前包含自訂或尚未確定的規格，網站不會推測價格，請由專人確認。",
    };
  }

  const hasFreeTextRequirement = freeTextFieldIds.some((id) => values[id]?.trim());
  if (hasFreeTextRequirement) {
    return {
      mode: "manual",
      title: "需要人工估價",
      message: "已填寫文字型特殊需求，需由專人確認內容後才能估價。",
    };
  }

  return {
    mode: "pending-price-data",
    title: "價格資料尚未連接",
    message: "規格已可先整理；產品金額會在正式價目資料庫完成串接後啟用。",
  };
}

