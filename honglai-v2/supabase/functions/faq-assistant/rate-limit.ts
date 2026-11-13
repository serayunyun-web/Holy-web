type RpcClient = {
  rpc: (
    name: string,
    parameters: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: unknown }>;
};

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function requestFingerprint(request: Request, salt: string) {
  if (!salt) throw new Error("missing-rate-limit-salt");
  const source =
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown";
  return await sha256(`${salt}|faq-assistant|${source}`);
}

export async function claimFaqAssistantRequest(
  client: RpcClient,
  fingerprint: string,
  limits: { shortLimit: number; shortWindowSeconds: number; dailyLimit: number },
) {
  const { data, error } = await client.rpc("claim_faq_assistant_request", {
    p_fingerprint: fingerprint,
    p_short_limit: limits.shortLimit,
    p_short_window_seconds: limits.shortWindowSeconds,
    p_daily_limit: limits.dailyLimit,
  });
  if (error) throw new Error("rate-limit-unavailable");
  return data === true;
}
