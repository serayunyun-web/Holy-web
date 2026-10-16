import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const [, , sourceArgument, outputArgument] = process.argv;

if (!sourceArgument || !outputArgument) {
  throw new Error("Usage: node scripts/generate-faq-data.mjs <source.md> <output.json>");
}

const sourcePath = resolve(sourceArgument);
const outputPath = resolve(outputArgument);
const markdown = await readFile(sourcePath, "utf8");
const lines = markdown.replace(/\r\n/g, "\n").split("\n");

const sourceCategoryDefinitions = [
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

const categoryDefinitions = [
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
const faqEntries = [];
let current = null;
let inAiRules = false;

function parseValue(line, label) {
  const prefix = `**${label}：**`;
  return line.startsWith(prefix) ? line.slice(prefix.length).trim() : null;
}

function stableId(category, index) {
  return `${sourceSlugByCategory.get(category) ?? "faq"}-${String(index + 1).padStart(2, "0")}`;
}

function finishCurrent() {
  if (!current) return;

  while (current.answerLines.at(-1) === "") current.answerLines.pop();
  while (current.aiNotes.at(-1) === "") current.aiNotes.pop();

  if (!current.category || !current.subcategory) {
    throw new Error(`Missing category metadata for: ${current.question}`);
  }

  const displayCategory = displayCategoryBySource.get(current.category);
  if (!displayCategory) throw new Error(`Unknown category: ${current.category}`);

  const categoryEntryIndex = faqEntries.filter(
    (entry) => entry.sourceCategory === current.category,
  ).length;
  faqEntries.push({
    id: stableId(current.category, categoryEntryIndex),
    question: current.question,
    answer: current.answerLines.join("\n").trim(),
    sourceCategory: current.category,
    category: displayCategory.name,
    categorySlug: displayCategory.slug,
    subcategory: current.subcategory,
    faqVisible: current.faqVisible === "是",
    aiUsable: current.aiUsable === "是",
    answerType: current.answerType || null,
    requiresHuman: current.requiresHuman || null,
    priceRelated: current.priceRelated === "是",
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

  if (inAiRules) continue;

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

  const categoryValue = parseValue(line, "分類");
  if (categoryValue !== null) {
    const [category, subcategory] = categoryValue.split("／");
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
  source: "鴻萊_FAQ_KNOWLEDGE_BASE_第二版.md",
  generatedAt: "2026-10-14",
  categories,
  faqs: faqEntries,
  aiPolicy: {
    mayProvidePrices: false,
    priceQuestionRoute: "/quote",
    requiresHumanFor: ["企業、大量、客製或資料不足", "實際訂單瑕疵與售後個案", "發票個案"],
  },
};

await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Generated ${faqEntries.length} FAQ entries across ${categories.length} categories.`);
