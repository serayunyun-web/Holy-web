import { faqKnowledge } from "../_shared/faq-knowledge.generated.ts";
import { evaluateBusinessRules, noReliableAnswer } from "./business-rules.ts";
import { GeminiClientError } from "./gemini-client.ts";
import { searchFaqKnowledge } from "./retrieval.ts";
import { unsafeAnswerReason } from "./response-safety.ts";
import type {
  AssistantAction,
  AssistantErrorCode,
  AssistantFailure,
  AssistantSource,
  AssistantSuccess,
  GenerateAnswerInput,
} from "./types.ts";

type HandlerDependencies = {
  enabled: boolean;
  configured: boolean;
  allowedOrigins: string[];
  validatePublishableKey: (request: Request) => Promise<boolean>;
  claimRateLimit: (request: Request) => Promise<boolean>;
  generateAnswer: (input: GenerateAnswerInput) => Promise<string>;
};

function corsHeaders(origin: string) {
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-headers": "apikey, content-type, x-client-info",
    "access-control-allow-methods": "POST, OPTIONS",
    "content-type": "application/json; charset=utf-8",
    "vary": "Origin",
  };
}

function jsonResponse(origin: string, status: number, body: AssistantSuccess | AssistantFailure) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(origin) });
}

function failure(origin: string, status: number, error: AssistantErrorCode) {
  return jsonResponse(origin, status, { success: false, error });
}

function success(
  origin: string,
  answer: string,
  sources: AssistantSource[],
  requiresHuman: boolean,
  action: AssistantAction,
) {
  return jsonResponse(origin, 200, { success: true, answer, sources, requiresHuman, action });
}

function geminiFailure(origin: string, error: unknown) {
  if (!(error instanceof GeminiClientError)) return failure(origin, 503, "SERVICE_UNAVAILABLE");
  switch (error.code) {
    case "rate_limited": return failure(origin, 429, "RATE_LIMITED");
    case "model_unavailable": return failure(origin, 503, "MODEL_UNAVAILABLE");
    case "timeout": return failure(origin, 504, "AI_TIMEOUT");
    default: return failure(origin, 503, "SERVICE_UNAVAILABLE");
  }
}

export function createFaqAssistantHandler(dependencies: HandlerDependencies) {
  return async function faqAssistantHandler(request: Request) {
    const origin = request.headers.get("origin") ?? "";
    if (!origin || !dependencies.allowedOrigins.includes(origin)) {
      return new Response(null, { status: 403 });
    }
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== "POST") return failure(origin, 405, "INVALID_REQUEST");
    if (!dependencies.enabled) return failure(origin, 503, "SERVICE_UNAVAILABLE");
    if (!dependencies.configured) return failure(origin, 503, "SERVICE_UNAVAILABLE");
    if (!await dependencies.validatePublishableKey(request)) return failure(origin, 401, "UNAUTHORIZED");

    const contentType = request.headers.get("content-type")?.toLocaleLowerCase() ?? "";
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (!contentType.includes("application/json") || contentLength > 4096) {
      return failure(origin, 400, "INVALID_REQUEST");
    }

    let payload: unknown;
    try {
      const rawBody = await request.text();
      if (new TextEncoder().encode(rawBody).byteLength > 4096) {
        return failure(origin, 400, "INVALID_REQUEST");
      }
      payload = JSON.parse(rawBody);
    } catch {
      return failure(origin, 400, "INVALID_REQUEST");
    }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return failure(origin, 400, "INVALID_REQUEST");
    }
    const rawMessage = (payload as Record<string, unknown>).message;
    const message = typeof rawMessage === "string" ? rawMessage.trim() : "";
    if (!message || Array.from(message).length > 500 || message.includes("\0")) {
      return failure(origin, 400, "INVALID_REQUEST");
    }

    try {
      if (!await dependencies.claimRateLimit(request)) return failure(origin, 429, "RATE_LIMITED");
    } catch {
      return failure(origin, 503, "SERVICE_UNAVAILABLE");
    }

    const rule = evaluateBusinessRules(message);
    const matches = searchFaqKnowledge(message, faqKnowledge.entries);
    const sources = matches.map(({ entry }) => ({ id: entry.id, question: entry.question }));

    if (rule.kind !== "faq" && rule.answer) {
      return success(origin, rule.answer, sources, rule.requiresHuman, rule.action);
    }
    if (!matches.length) {
      return success(origin, noReliableAnswer, [], true, "contact");
    }

    let answer: string;
    try {
      answer = await dependencies.generateAnswer({ message, matches });
    } catch (error) {
      return geminiFailure(origin, error);
    }
    if (unsafeAnswerReason(answer)) {
      return success(origin, noReliableAnswer, sources, true, "contact");
    }
    const requiresHuman = matches.some(({ entry }) => Boolean(entry.requiresHuman));
    return success(origin, answer, sources, requiresHuman, requiresHuman ? "contact" : "none");
  };
}
