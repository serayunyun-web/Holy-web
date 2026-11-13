import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import {
  assertGeneratedConsistency,
  buildFaqPayload,
  createAiKnowledgePayload,
  renderAiKnowledgeModule,
} from "./faq-data-lib.mjs";

const [, , sourceArgument, frontendOutputArgument, aiOutputArgument] = process.argv;
const sourcePath = resolve(
  sourceArgument ?? "content/knowledge/鴻萊_FAQ_KNOWLEDGE_BASE_第二版.md",
);
const frontendOutputPath = resolve(
  frontendOutputArgument ?? "src/data/faq.generated.json",
);
const aiOutputPath = resolve(
  aiOutputArgument ?? "supabase/functions/_shared/faq-knowledge.generated.ts",
);

const markdown = await readFile(sourcePath, "utf8");
let existingEntries = [];
try {
  const existing = JSON.parse(await readFile(frontendOutputPath, "utf8"));
  existingEntries = Array.isArray(existing.faqs) ? existing.faqs : [];
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

const frontendPayload = buildFaqPayload(markdown, {
  sourceName: basename(sourcePath),
  existingEntries,
});
const aiPayload = createAiKnowledgePayload(frontendPayload);
assertGeneratedConsistency(frontendPayload, aiPayload);

const frontendSource = `${JSON.stringify(frontendPayload, null, 2)}\n`;
const aiSource = renderAiKnowledgeModule(aiPayload);

// 所有解析與一致性驗證都在正式檔案寫入前完成，避免錯誤資料覆蓋既有 FAQ。
await Promise.all([
  mkdir(dirname(frontendOutputPath), { recursive: true }),
  mkdir(dirname(aiOutputPath), { recursive: true }),
]);
await Promise.all([
  writeFile(frontendOutputPath, frontendSource, "utf8"),
  writeFile(aiOutputPath, aiSource, "utf8"),
]);

console.log([
  `FAQ source: ${sourcePath}`,
  `Generated ${frontendPayload.faqs.length} FAQ entries across ${frontendPayload.categories.length} display categories.`,
  `Public FAQ entries: ${frontendPayload.faqs.filter((faq) => faq.isActive && faq.faqVisible).length}.`,
  `AI-usable entries: ${aiPayload.entries.length}.`,
].join("\n"));
