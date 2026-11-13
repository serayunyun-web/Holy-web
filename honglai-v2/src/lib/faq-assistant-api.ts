import { visibleFaqEntries } from "@/data/faq";

export type AssistantAction = "none" | "estimate" | "contact";

export type AssistantSource = { id: string; question: string };

export type AssistantReply = {
  answer: string;
  sources: AssistantSource[];
  requiresHuman: boolean;
  action: AssistantAction;
};

type AssistantResponse = Partial<AssistantReply> & { success?: boolean; error?: string };

const RETRYABLE_ERRORS = new Set(["AI_TIMEOUT", "SERVICE_UNAVAILABLE"]);

function responseErrorCode(status: number, result: AssistantResponse) {
  if (result.error) return result.error;
  if (status === 401) return "UNAUTHORIZED";
  if (status === 429) return "RATE_LIMITED";
  if (status === 503) return "SERVICE_UNAVAILABLE";
  if (status === 504) return "AI_TIMEOUT";
  return `HTTP_${status}`;
}

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function normalize(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase("zh-Hant").replace(/[^\p{Letter}\p{Number}]+/gu, " ").trim();
}

function publicFaqFallback(message: string): AssistantReply | null {
  const normalizedMessage = normalize(message);
  if (/論文|畢業論文|論文裝訂|論文精裝/u.test(normalizedMessage)) {
    const thesisFaq = visibleFaqEntries.find((entry) => entry.id === "printing-estimates-05");
    return {
      answer: "可以，鴻萊目前提供論文裝訂服務。公開 FAQ 另說明，論文精裝半成品是已燙金的論文書殼／封面，不包含完整內頁成冊；實際裝訂款式、材質、價格與交期仍需由專人確認。",
      sources: thesisFaq ? [{ id: thesisFaq.id, question: thesisFaq.question }] : [],
      requiresHuman: true,
      action: "contact",
    };
  }
  const terms = new Set(normalizedMessage.split(" ").filter((term) => term.length >= 2));
  if (/少量|一本|單本|最低數量|最低印量/u.test(normalizedMessage)) terms.add("少量");
  if (/出血/u.test(normalizedMessage)) terms.add("出血");
  if (/pdf|檔案格式/u.test(normalizedMessage)) terms.add("pdf");
  if (/解析度|dpi|畫質/u.test(normalizedMessage)) terms.add("解析度");
  if (/數位燙金|燙金/u.test(normalizedMessage)) terms.add("燙金");
  if (/論文|畢業論文|論文裝訂|論文精裝/u.test(normalizedMessage)) terms.add("論文");

  const match = visibleFaqEntries
    .filter((entry) => entry.aiUsable)
    .map((entry) => {
      const question = normalize(entry.question);
      const answer = normalize(entry.answer);
      const subcategory = normalize(entry.subcategory);
      let score = question === normalizedMessage ? 100 : 0;
      for (const term of terms) {
        if (question.includes(term)) score += 24 + term.length;
        if (subcategory.includes(term)) score += 14 + term.length;
        if (answer.includes(term)) score += 3 + term.length;
      }
      return { entry, score };
    })
    .filter(({ score }) => score >= 16)
    .sort((a, b) => b.score - a.score || a.entry.displayOrder - b.entry.displayOrder)[0];

  if (!match) return null;
  const requiresHuman = Boolean(match.entry.requiresHuman);
  const answer = match.entry.priceRelated
    ? "關於價格，請使用網站的線上估價功能查看可估價品項；若屬企業、大量、客製或資料不足的需求，會由專人進一步確認。"
    : match.entry.answer;
  return {
    answer,
    sources: [{ id: match.entry.id, question: match.entry.question }],
    requiresHuman,
    action: requiresHuman ? "contact" : match.entry.priceRelated ? "estimate" : "none",
  };
}

function localFallback(message: string): AssistantReply {
  const faqReply = publicFaqFallback(message);
  if (faqReply) return faqReply;

  return {
    answer: "目前找不到能直接回答這個問題的公開 FAQ。請改用「聯絡我們」提供需求，由專人確認；我不會把未確認的內容當成答案。",
    sources: [],
    requiresHuman: true,
    action: "contact",
  };
}

export class AssistantRequestError extends Error {
  constructor(public code: string) {
    super(code);
    this.name = "AssistantRequestError";
  }
}

export async function askFaqAssistant(message: string): Promise<AssistantReply> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return localFallback(message);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(`${url}/functions/v1/faq-assistant`, {
        method: "POST",
        headers: { apikey: key, "content-type": "application/json" },
        body: JSON.stringify({ message }),
      });
    } catch {
      return localFallback(message);
    }

    const result = await response.json().catch(() => ({})) as AssistantResponse;
    if (!response.ok || !result.success || !result.answer) {
      const code = responseErrorCode(response.status, result);
      if (attempt === 0 && RETRYABLE_ERRORS.has(code)) {
        await wait(650);
        continue;
      }
      return localFallback(message);
    }
    const reply = {
      answer: result.answer,
      sources: Array.isArray(result.sources) ? result.sources : [],
      requiresHuman: Boolean(result.requiresHuman),
      action: result.action ?? "none",
    };
    if (!reply.sources.length && reply.requiresHuman) {
      const fallback = publicFaqFallback(message);
      if (fallback) return fallback;
    }
    return reply;
  }
  return localFallback(message);
}
