import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import {
  assertGeneratedConsistency,
  buildFaqPayload,
  parseAiKnowledgeModule,
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

const [markdown, frontendSource, aiSource] = await Promise.all([
  readFile(sourcePath, "utf8"),
  readFile(frontendOutputPath, "utf8"),
  readFile(aiOutputPath, "utf8"),
]);
const frontendPayload = JSON.parse(frontendSource);
const aiPayload = parseAiKnowledgeModule(aiSource);
const expectedPayload = buildFaqPayload(markdown, {
  sourceName: basename(sourcePath),
  generatedAt: frontendPayload.generatedAt,
  existingEntries: frontendPayload.faqs,
});

if (JSON.stringify(frontendPayload) !== JSON.stringify(expectedPayload)) {
  throw new Error("src/data/faq.generated.json 與正式 Markdown 來源不一致，請先執行 npm run faq:generate");
}
assertGeneratedConsistency(frontendPayload, aiPayload);

const visibleFaqs = frontendPayload.faqs.filter((faq) => faq.isActive && faq.faqVisible);
const hiddenFaqs = frontendPayload.faqs.filter((faq) => faq.isActive && !faq.faqVisible);
const aiUsableFaqs = frontendPayload.faqs.filter((faq) => faq.isActive && faq.aiUsable);
const aiBlockedFaqs = frontendPayload.faqs.filter((faq) => faq.isActive && !faq.aiUsable);

console.log([
  "FAQ knowledge validation passed.",
  `Total: ${frontendPayload.faqs.length}`,
  `Public: ${visibleFaqs.length}`,
  `Hidden: ${hiddenFaqs.length}`,
  `AI usable: ${aiUsableFaqs.length}`,
  `AI blocked: ${aiBlockedFaqs.length}`,
  `Display categories: ${frontendPayload.categories.length}`,
  `Source SHA-256: ${frontendPayload.sourceSha256}`,
].join("\n"));
