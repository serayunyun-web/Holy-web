import faqData from "./faq.generated.json";

export type FaqCategory = {
  id: string;
  slug: string;
  name: string;
  icon: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
  faqVisible: boolean;
};

export type FaqEntry = {
  id: string;
  question: string;
  answer: string;
  sourceCategory: string;
  category: string;
  categorySlug: string;
  subcategory: string;
  faqVisible: boolean;
  aiUsable: boolean;
  answerType: string | null;
  requiresHuman: string | null;
  priceRelated: boolean;
  aiNotes: string[];
  displayOrder: number;
  isActive: boolean;
};

export type FaqReviewItem = {
  faqId: string;
  question: string;
  reasons: string[];
};

const data = faqData as {
  source: string;
  generatedAt: string;
  categories: FaqCategory[];
  faqs: FaqEntry[];
  aiPolicy: {
    mayProvidePrices: boolean;
    priceQuestionRoute: string;
    requiresHumanFor: string[];
  };
};

export const faqCategories = [...data.categories].sort(
  (a, b) => a.displayOrder - b.displayOrder,
);

export const faqEntries = [...data.faqs].sort(
  (a, b) => a.displayOrder - b.displayOrder,
);

export const visibleFaqCategories = faqCategories.filter(
  (category) => category.isActive && category.faqVisible,
);

export const visibleFaqEntries = faqEntries.filter(
  (faq) => faq.isActive && faq.faqVisible,
);

export const faqAiPolicy = data.aiPolicy;

export const faqReviewItems: FaqReviewItem[] = faqEntries.flatMap((faq) => {
  const reasons: string[] = [];

  if (!faq.faqVisible) {
    reasons.push("網站政策內容目前不顯示於一般 FAQ，發布前需確認政策文字");
  }
  if (faq.requiresHuman) {
    reasons.push(`來源標示需人工：${faq.requiresHuman}`);
  }
  if (faq.sourceCategory === "著作權與委託責任") {
    reasons.push("涉及著作權與委託責任，特定案件不得由 AI 判斷");
  }
  if (faq.sourceCategory === "發票與請款") {
    reasons.push("涉及發票與請款個案，需由客服或財務確認");
  }
  if (faq.subcategory === "營業時間") {
    reasons.push("營業時間需與正式公司資料再次核對");
  }
  if (faq.answer.includes("手提袋")) {
    reasons.push("回答提及目前未列入 V2 產品目錄的品項，僅保留原文並待確認");
  }
  if (
    /(賠償|退換貨|退款|補印|不得作為瑕疵|無法判定為印刷瑕疵|請勿下單)/.test(
      `${faq.question}\n${faq.answer}`,
    )
  ) {
    reasons.push("涉及售後、瑕疵或責任限制文字，正式發布前需人工確認");
  }

  return reasons.length
    ? [{ faqId: faq.id, question: faq.question, reasons }]
    : [];
});

export const faqDataSummary = {
  source: data.source,
  generatedAt: data.generatedAt,
  totalFaqs: faqEntries.length,
  visibleFaqs: visibleFaqEntries.length,
  totalCategories: faqCategories.length,
  visibleCategories: visibleFaqCategories.length,
};
