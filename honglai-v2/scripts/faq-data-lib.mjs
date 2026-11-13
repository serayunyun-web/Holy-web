import { createHash } from "node:crypto";

export const sourceCategoryDefinitions = [
  ["印刷與估價相關", "printing-estimates"],
  ["稿件與檔案相關", "files-artwork"],
  ["色彩與印刷品質", "color-quality"],
  ["數位印刷相關", "digital-printing"],
  ["後加工相關", "finishing"],
  ["發票與請款", "invoices"],
  ["配送與取貨", "delivery"],
  ["聯絡與服務時間", "contact-hours"],
  ["著作權與委託責任", "copyright"],
  ["網站政策", "website-policies"],
];

export const categoryDefinitions = [
  ["印刷與估價", "printing-estimates", "calculator", ["印刷與估價相關"]],
  ["稿件與檔案", "files-artwork", "files", ["稿件與檔案相關", "著作權與委託責任"]],
  ["色彩與品質", "color-quality", "palette", ["色彩與印刷品質"]],
  ["印刷與加工", "printing-finishing", "printer", ["數位印刷相關", "後加工相關"]],
  ["訂單與服務", "orders-service", "headset", ["發票與請款", "配送與取貨", "聯絡與服務時間"]],
  ["網站政策", "website-policies", "policy", ["網站政策"]],
];

const sourceSlugByCategory = new Map(sourceCategoryDefinitions);
const displayCategoryBySource = new Map(
  categoryDefinitions.flatMap(([name, slug, icon, sourceCategories]) =>
    sourceCategories.map((sourceCategory) => [sourceCategory, { name, slug, icon }]),
  ),
);

const knownMetadataLabels = new Set([
  "分類",
  "FAQ 顯示",
  "AI 可使用",
  "回答類型",
  "是否需人工",
  "價格相關",
]);

function normalizeQuestion(question) {
  return question.trim().replace(/\s+/g, " ").toLocaleLowerCase("zh-Hant");
}

function parseValue(line, label) {
  const prefix = `**${label}：**`;
  return line.startsWith(prefix) ? line.slice(prefix.length).trim() : null;
}

function newStableId(category, question, usedIds) {
  const slug = sourceSlugByCategory.get(category) ?? "faq";
  const digest = createHash("sha256")
    .update(`${category}\n${normalizeQuestion(question)}`)
    .digest("hex")
    .slice(0, 10);
  let candidate = `${slug}-${digest}`;
  let suffix = 2;
  while (usedIds.has(candidate)) {
    candidate = `${slug}-${digest}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function parseBooleanFlag(value, label, question) {
  if (value !== "是" && value !== "否") {
    throw new Error(`${question} 的「${label}」必須明確標示為「是」或「否」`);
  }
  return value === "是";
}

export function buildFaqPayload(markdown, options = {}) {
  const {
    sourceName = "鴻萊_FAQ_KNOWLEDGE_BASE_第二版.md",
    generatedAt = new Date().toISOString().slice(0, 10),
    existingEntries = [],
  } = options;
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const existingIdByQuestion = new Map(
    existingEntries.map((entry) => [normalizeQuestion(entry.question), entry.id]),
  );
  const usedIds = new Set();
  const faqEntries = [];
  const commonRules = [];
  const parseWarnings = [];
  let current = null;
  let inAiRules = false;

  function finishCurrent() {
    if (!current) return;
    while (current.answerLines.at(-1) === "") current.answerLines.pop();
    while (current.aiNotes.at(-1) === "") current.aiNotes.pop();

    const question = current.question.trim();
    const answer = current.answerLines.join("\n").trim();
    if (!question) throw new Error("發現空白 FAQ 問題");
    if (!answer) throw new Error(`FAQ「${question}」的答案為空`);
    if (!current.category || !current.subcategory) {
      throw new Error(`FAQ「${question}」缺少分類或子分類`);
    }

    const displayCategory = displayCategoryBySource.get(current.category);
    if (!displayCategory) {
      throw new Error(`FAQ「${question}」使用無法對應的分類：${current.category}`);
    }

    const normalized = normalizeQuestion(question);
    const preservedId = existingIdByQuestion.get(normalized);
    const id = preservedId && !usedIds.has(preservedId)
      ? preservedId
      : newStableId(current.category, question, usedIds);
    usedIds.add(id);

    faqEntries.push({
      id,
      question,
      answer,
      sourceCategory: current.category,
      category: displayCategory.name,
      categorySlug: displayCategory.slug,
      subcategory: current.subcategory,
      faqVisible: parseBooleanFlag(current.faqVisible, "FAQ 顯示", question),
      aiUsable: parseBooleanFlag(current.aiUsable, "AI 可使用", question),
      answerType: current.answerType || null,
      requiresHuman: current.requiresHuman || null,
      priceRelated: current.priceRelated
        ? parseBooleanFlag(current.priceRelated, "價格相關", question)
        : false,
      aiNotes: current.aiNotes.filter(Boolean),
      displayOrder: faqEntries.length + 1,
      isActive: true,
    });
    current = null;
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line === "# AI 共通回答規則") {
      finishCurrent();
      inAiRules = true;
      continue;
    }

    if (inAiRules) {
      const rule = line.match(/^\d+\.\s+(.+)$/)?.[1]?.trim();
      if (rule) commonRules.push(rule);
      else if (line.trim() && !line.startsWith("#")) parseWarnings.push(`未解析 AI 共通規則：${line}`);
      continue;
    }

    if (line.startsWith("## ")) {
      finishCurrent();
      current = {
        question: line.slice(3).trim(),
        category: "",
        subcategory: "",
        faqVisible: "",
        aiUsable: "",
        answerType: "",
        requiresHuman: "",
        priceRelated: "",
        answerLines: [],
        aiNotes: [],
        readingAiNotes: false,
      };
      continue;
    }

    if (!current) continue;

    const metadataMatch = line.match(/^\*\*([^：]+)：\*\*/);
    if (metadataMatch && !knownMetadataLabels.has(metadataMatch[1]) && line !== "**AI 回答注意：**") {
      throw new Error(`FAQ「${current.question}」含有無法解析的欄位：${metadataMatch[1]}`);
    }

    const categoryValue = parseValue(line, "分類");
    if (categoryValue !== null) {
      const [category, subcategory, ...extra] = categoryValue.split("／");
      if (extra.length) throw new Error(`FAQ「${current.question}」的分類格式不正確：${categoryValue}`);
      current.category = category?.trim() ?? "";
      current.subcategory = subcategory?.trim() ?? "";
      continue;
    }

    const visibleValue = parseValue(line, "FAQ 顯示");
    if (visibleValue !== null) {
      current.faqVisible = visibleValue;
      continue;
    }

    const aiValue = parseValue(line, "AI 可使用");
    if (aiValue !== null) {
      current.aiUsable = aiValue;
      continue;
    }

    const answerTypeValue = parseValue(line, "回答類型");
    if (answerTypeValue !== null) {
      current.answerType = answerTypeValue;
      continue;
    }

    const humanValue = parseValue(line, "是否需人工");
    if (humanValue !== null) {
      current.requiresHuman = humanValue;
      continue;
    }

    const priceValue = parseValue(line, "價格相關");
    if (priceValue !== null) {
      current.priceRelated = priceValue;
      continue;
    }

    if (line === "**AI 回答注意：**") {
      current.readingAiNotes = true;
      continue;
    }

    if (line === "---") {
      finishCurrent();
      continue;
    }

    if (current.readingAiNotes) {
      if (line.startsWith("- ")) current.aiNotes.push(line.slice(2).trim());
      else if (line.trim()) parseWarnings.push(`FAQ「${current.question}」有未解析的 AI 注意事項：${line}`);
      continue;
    }

    current.answerLines.push(line);
  }

  finishCurrent();

  const categories = categoryDefinitions.map(([name, slug, icon], index) => ({
    id: slug,
    slug,
    name,
    icon,
    description: `${name}常見問題`,
    displayOrder: index + 1,
    isActive: true,
    faqVisible: faqEntries.some((entry) => entry.categorySlug === slug && entry.faqVisible),
  }));

  const payload = {
    source: sourceName,
    sourceSha256: createHash("sha256").update(markdown).digest("hex"),
    generatedAt,
    categories,
    faqs: faqEntries,
    commonRules,
    aiPolicy: {
      mayProvidePrices: false,
      priceQuestionRoute: "/quote",
      requiresHumanFor: [
        "企業、大量、客製或資料不足",
        "一般品項達 40 本以上（證書夾依既有規則處理）",
        "實際訂單瑕疵與售後個案",
        "發票個案",
      ],
    },
  };

  assertValidFaqPayload(payload, { parseWarnings });
  return payload;
}

export function createAiKnowledgePayload(frontendPayload) {
  return {
    source: frontendPayload.source,
    sourceSha256: frontendPayload.sourceSha256,
    generatedAt: frontendPayload.generatedAt,
    sourceFaqCount: frontendPayload.faqs.length,
    aiUsableFaqCount: frontendPayload.faqs.filter((faq) => faq.aiUsable).length,
    categories: frontendPayload.categories,
    commonRules: frontendPayload.commonRules,
    aiPolicy: frontendPayload.aiPolicy,
    entries: frontendPayload.faqs.filter((faq) => faq.isActive && faq.aiUsable),
  };
}

export function renderAiKnowledgeModule(aiPayload) {
  return [
    "// 此檔案由 scripts/generate-faq-data.mjs 自動產生，請勿手動編輯。",
    `export const faqKnowledge = ${JSON.stringify(aiPayload, null, 2)} as const;`,
    "",
    "export type FaqKnowledge = typeof faqKnowledge;",
    "export type FaqKnowledgeEntry = (typeof faqKnowledge.entries)[number];",
    "",
  ].join("\n");
}

export function parseAiKnowledgeModule(source) {
  const match = source.match(/^\/\/[^\n]*\nexport const faqKnowledge = ([\s\S]*?) as const;\n\nexport type/);
  if (!match) throw new Error("AI 知識資料格式無法解析");
  return JSON.parse(match[1]);
}

export function assertValidFaqPayload(payload, options = {}) {
  const errors = [...(options.parseWarnings ?? [])];
  if (!Array.isArray(payload.faqs) || payload.faqs.length === 0) errors.push("FAQ 資料為空");
  if (!Array.isArray(payload.categories) || payload.categories.length === 0) errors.push("FAQ 分類為空");
  if (!Array.isArray(payload.commonRules) || payload.commonRules.length === 0) errors.push("缺少 AI 共通回答規則");

  const ids = new Set();
  const questions = new Set();
  const categorySlugs = new Set(payload.categories.map((category) => category.slug));
  for (const faq of payload.faqs ?? []) {
    if (!faq.id) errors.push(`FAQ「${faq.question || "未知"}」缺少 ID`);
    else if (ids.has(faq.id)) errors.push(`重複 FAQ ID：${faq.id}`);
    ids.add(faq.id);

    const normalized = normalizeQuestion(faq.question ?? "");
    if (!normalized) errors.push(`FAQ ${faq.id || "未知"} 的問題為空`);
    else if (questions.has(normalized)) errors.push(`重複 FAQ 問題：${faq.question}`);
    questions.add(normalized);

    if (!faq.answer?.trim()) errors.push(`FAQ「${faq.question}」的答案為空`);
    if (!categorySlugs.has(faq.categorySlug)) errors.push(`FAQ「${faq.question}」使用未知顯示分類：${faq.categorySlug}`);
    if (!displayCategoryBySource.has(faq.sourceCategory)) errors.push(`FAQ「${faq.question}」使用未知原始分類：${faq.sourceCategory}`);
    if (typeof faq.faqVisible !== "boolean") errors.push(`FAQ「${faq.question}」的 FAQ 顯示標記無效`);
    if (typeof faq.aiUsable !== "boolean") errors.push(`FAQ「${faq.question}」的 AI 可使用標記無效`);
    if (typeof faq.priceRelated !== "boolean") errors.push(`FAQ「${faq.question}」的價格相關標記無效`);
  }

  if (errors.length) throw new Error(`FAQ 資料驗證失敗：\n- ${errors.join("\n- ")}`);
}

export function assertGeneratedConsistency(frontendPayload, aiPayload) {
  assertValidFaqPayload(frontendPayload);
  const expectedEntries = frontendPayload.faqs.filter((faq) => faq.isActive && faq.aiUsable);
  const errors = [];
  if (frontendPayload.sourceSha256 !== aiPayload.sourceSha256) errors.push("前端與 AI 資料的來源雜湊不同");
  if (aiPayload.sourceFaqCount !== frontendPayload.faqs.length) errors.push("AI 資料記錄的 FAQ 總數不一致");
  if (aiPayload.aiUsableFaqCount !== expectedEntries.length) errors.push("AI 可使用題數不一致");
  if (JSON.stringify(aiPayload.entries) !== JSON.stringify(expectedEntries)) errors.push("AI 題目內容與前端來源不一致");
  if (aiPayload.entries.some((entry) => !entry.aiUsable)) errors.push("AI 資料含有不可供 AI 使用的題目");
  if (JSON.stringify(aiPayload.commonRules) !== JSON.stringify(frontendPayload.commonRules)) errors.push("AI 共通規則不一致");
  if (JSON.stringify(aiPayload.aiPolicy) !== JSON.stringify(frontendPayload.aiPolicy)) errors.push("AI 政策資料不一致");
  if (errors.length) throw new Error(`FAQ 前後端資料不一致：\n- ${errors.join("\n- ")}`);
}
