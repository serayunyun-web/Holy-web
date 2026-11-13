export type GeminiClientErrorCode =
  | "not_configured"
  | "rate_limited"
  | "model_unavailable"
  | "timeout"
  | "safety_blocked"
  | "empty_response"
  | "service_unavailable";

export class GeminiClientError extends Error {
  readonly code: GeminiClientErrorCode;

  constructor(code: GeminiClientErrorCode) {
    super(code);
    this.name = "GeminiClientError";
    this.code = code;
  }
}

type GeminiOptions = {
  apiKey: string | undefined;
  model: string | undefined;
  systemInstruction: string;
  prompt: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

export async function generateGeminiAnswer({
  apiKey,
  model,
  systemInstruction,
  prompt,
  timeoutMs = 8000,
  fetchImpl = fetch,
}: GeminiOptions) {
  if (!apiKey || !model || !/^[a-z0-9][a-z0-9._-]{1,100}$/i.test(model)) {
    throw new GeminiClientError("not_configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetchImpl(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 384, candidateCount: 1 },
        }),
      },
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new GeminiClientError("timeout");
    throw new GeminiClientError("service_unavailable");
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 429) throw new GeminiClientError("rate_limited");
  if (response.status === 404) throw new GeminiClientError("model_unavailable");
  if (!response.ok) throw new GeminiClientError("service_unavailable");

  const data = await response.json().catch(() => null) as {
    promptFeedback?: { blockReason?: string };
    candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ text?: string }> } }>;
  } | null;
  if (!data) throw new GeminiClientError("service_unavailable");
  if (data.promptFeedback?.blockReason) throw new GeminiClientError("safety_blocked");
  const candidate = data.candidates?.[0];
  if (!candidate) throw new GeminiClientError("empty_response");
  if (candidate.finishReason && candidate.finishReason !== "STOP") {
    throw new GeminiClientError(candidate.finishReason === "SAFETY" ? "safety_blocked" : "service_unavailable");
  }
  const answer = candidate.content?.parts?.map((part) => part.text ?? "").join("").trim() ?? "";
  if (!answer) throw new GeminiClientError("empty_response");
  return answer;
}
