import { hasValidPublishableKey } from "../_shared/auth.ts";
import { adminClient } from "../_shared/database.ts";
import { generateGeminiAnswer } from "./gemini-client.ts";
import { createFaqAssistantHandler } from "./handler.ts";
import { buildGeminiPrompt, systemInstruction } from "./prompts.ts";
import { claimFaqAssistantRequest, requestFingerprint } from "./rate-limit.ts";

function positiveInteger(value: string | undefined, fallback: number, minimum: number, maximum: number) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : fallback;
}

const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const timeoutMs = positiveInteger(Deno.env.get("FAQ_ASSISTANT_TIMEOUT_MS"), 8000, 1000, 20000);
const shortLimit = positiveInteger(Deno.env.get("FAQ_ASSISTANT_RATE_LIMIT"), 10, 1, 100);
const dailyLimit = positiveInteger(Deno.env.get("FAQ_ASSISTANT_DAILY_LIMIT"), 50, 1, 1000);
const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
const geminiModel = Deno.env.get("GEMINI_MODEL");

const handler = createFaqAssistantHandler({
  enabled: Deno.env.get("FAQ_ASSISTANT_ENABLED") === "true",
  configured: Boolean(geminiApiKey && geminiModel),
  allowedOrigins,
  validatePublishableKey: hasValidPublishableKey,
  claimRateLimit: async (request) => {
    const salt = Deno.env.get("RATE_LIMIT_SALT");
    if (!salt) throw new Error("missing-rate-limit-salt");
    const fingerprint = await requestFingerprint(request, salt);
    return await claimFaqAssistantRequest(adminClient(), fingerprint, {
      shortLimit,
      shortWindowSeconds: 600,
      dailyLimit,
    });
  },
  generateAnswer: async ({ message, matches }) => await generateGeminiAnswer({
    apiKey: geminiApiKey,
    model: geminiModel,
    systemInstruction,
    prompt: buildGeminiPrompt(message, matches),
    timeoutMs,
  }),
});

Deno.serve(handler);
