import type { FaqKnowledgeEntry } from "../_shared/faq-knowledge.generated.ts";
import type { SearchResult } from "./types.ts";

const synonymGroups = [
  { pattern: /少量|一本|單本|最低數量|最低印量/u, terms: ["少量", "最低數量", "最低印量"] },
  { pattern: /pdf|檔案格式/u, terms: ["pdf", "檔案格式"] },
  { pattern: /解析度|dpi|畫質/u, terms: ["解析度", "dpi"] },
  { pattern: /數位燙金|燙金/u, terms: ["數位燙金", "燙金"] },
  { pattern: /營業時間|幾點|服務時間/u, terms: ["營業時間", "線上服務時間"] },
  { pattern: /超商|取貨|配送/u, terms: ["超商取貨", "取貨方式", "配送"] },
  { pattern: /出血/u, terms: ["出血"] },
] as const;

export function normalizeSearchText(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("zh-Hant")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function searchTerms(message: string) {
  const normalized = normalizeSearchText(message);
  const terms = new Set<string>();
  if (normalized) terms.add(normalized);
  for (const token of normalized.split(" ")) {
    if (token.length >= 2) terms.add(token);
  }
  for (const group of synonymGroups) {
    if (group.pattern.test(normalized)) {
      for (const term of group.terms) terms.add(normalizeSearchText(term));
    }
  }
  return [...terms].filter((term) => term.length >= 2);
}

function scoreField(field: string, term: string, weight: number) {
  if (!field || !term || !field.includes(term)) return 0;
  return weight + Math.min(term.length, 10);
}

export function searchFaqKnowledge(
  message: string,
  entries: readonly FaqKnowledgeEntry[],
  options: { limit?: number; threshold?: number } = {},
): SearchResult[] {
  const normalizedMessage = normalizeSearchText(message);
  const terms = searchTerms(message);
  const limit = options.limit ?? 5;
  const threshold = options.threshold ?? 12;

  return entries
    .filter((entry) => entry.isActive && entry.aiUsable)
    .map((entry) => {
      const question = normalizeSearchText(entry.question);
      const answer = normalizeSearchText(entry.answer);
      const sourceCategory = normalizeSearchText(entry.sourceCategory);
      const category = normalizeSearchText(entry.category);
      const subcategory = normalizeSearchText(entry.subcategory);
      const matchedTerms: string[] = [];
      let score = question === normalizedMessage ? 160 : 0;
      if (normalizedMessage.length >= 2 && question.includes(normalizedMessage)) score += 80;

      for (const term of terms) {
        const termScore =
          scoreField(question, term, 24) +
          scoreField(subcategory, term, 18) +
          scoreField(category, term, 10) +
          scoreField(sourceCategory, term, 8) +
          scoreField(answer, term, 4);
        if (termScore > 0) matchedTerms.push(term);
        score += termScore;
      }
      return { entry, score, matchedTerms };
    })
    .filter((result) => result.score >= threshold)
    .sort((a, b) => b.score - a.score || a.entry.displayOrder - b.entry.displayOrder)
    .slice(0, limit);
}
