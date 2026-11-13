import type { FaqKnowledgeEntry } from "../_shared/faq-knowledge.generated.ts";

export type AssistantAction = "none" | "estimate" | "contact";
export type AssistantErrorCode =
  | "INVALID_REQUEST"
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "MODEL_UNAVAILABLE"
  | "AI_TIMEOUT"
  | "SERVICE_UNAVAILABLE";

export type AssistantSource = { id: string; question: string };

export type AssistantSuccess = {
  success: true;
  answer: string;
  sources: AssistantSource[];
  requiresHuman: boolean;
  action: AssistantAction;
};

export type AssistantFailure = { success: false; error: AssistantErrorCode };

export type SearchResult = {
  entry: FaqKnowledgeEntry;
  score: number;
  matchedTerms: string[];
};

export type BusinessRuleKind =
  | "faq"
  | "price"
  | "manualQuote"
  | "deliveryPromise"
  | "afterSales"
  | "outOfScope"
  | "promptInjection";

export type BusinessRuleResult = {
  kind: BusinessRuleKind;
  action: AssistantAction;
  requiresHuman: boolean;
  answer: string | null;
};

export type GenerateAnswerInput = {
  message: string;
  matches: SearchResult[];
};
