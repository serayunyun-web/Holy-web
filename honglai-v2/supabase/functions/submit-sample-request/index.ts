import { hasValidPublishableKey } from "../_shared/auth.ts";
import { adminClient, allowSubmission, publicNumber } from "../_shared/database.ts";
import { allowedOrigin, corsHeaders, response } from "../_shared/http.ts";
import { email, phone, submissionFingerprints, text, uuid, type JsonObject } from "../_shared/validation.ts";

Deno.serve(async (request) => {
  const origin = allowedOrigin(request);
  if (!origin) return new Response(null, { status: 403 });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (request.method !== "POST") return response(origin, 405, { error: "method_not_allowed" });

  try {
    if (!await hasValidPublishableKey(request)) return response(origin, 401, { error: "invalid_api_key" });
    const body = await request.json() as JsonObject;
    const emailValue = email(body, "email");
    if (body.privacyConsent !== true) throw new Error("invalid:privacyConsent");
    const idempotencyKey = uuid(body, "idempotencyKey");
    const client = adminClient();
    const previous = await client.from("sample_requests").select("request_no").eq("idempotency_key", idempotencyKey).maybeSingle();
    if (previous.error) throw previous.error;
    if (previous.data) return response(origin, 200, { referenceNo: previous.data.request_no, duplicate: true });
    if (!await allowSubmission(client, await submissionFingerprints(request, emailValue), "sample_request")) {
      return response(origin, 429, { error: "rate_limited" });
    }
    const record = {
      request_no: publicNumber("SR"), idempotency_key: idempotencyKey,
      company_name: text(body, "companyName", 120, true), contact_name: text(body, "contactName", 80, true),
      phone: phone(body, "phone"), email: emailValue, city: text(body, "city", 20, true),
      interest: text(body, "interest", 500, true), purpose: text(body, "purpose", 2000, true),
      note: text(body, "note", 2000), privacy_consent_at: new Date().toISOString(),
    };
    const { data, error } = await client.from("sample_requests").insert(record).select("request_no").single();
    if (error?.code === "23505") {
      const existing = await client.from("sample_requests").select("request_no").eq("idempotency_key", idempotencyKey).maybeSingle();
      if (existing.data) return response(origin, 200, { referenceNo: existing.data.request_no, duplicate: true });
    }
    if (error) throw error;
    return response(origin, 201, { referenceNo: data.request_no });
  } catch (error) {
    const invalid = error instanceof Error && error.message.startsWith("invalid:");
    console.error("submit-sample-request", error);
    return response(origin, invalid ? 400 : 500, { error: invalid ? error.message : "submission_failed" });
  }
});
