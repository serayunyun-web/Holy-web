import { adminClient, allowSubmission, publicNumber } from "../_shared/database.ts";
import { allowedOrigin, corsHeaders, response } from "../_shared/http.ts";
import { email, isoDate, phone, positiveInteger, submissionFingerprints, text, uuid, type JsonObject } from "../_shared/validation.ts";

const cooperationTypes = new Set(["半成品加工", "完整裝訂代工", "特殊加工與客製", "其他合作需求"]);

Deno.serve(async (request) => {
  const origin = allowedOrigin(request);
  if (!origin) return new Response(null, { status: 403 });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (request.method !== "POST") return response(origin, 405, { error: "method_not_allowed" });

  try {
    const body = await request.json() as JsonObject;
    const emailValue = email(body, "email");
    const cooperationType = text(body, "cooperationType", 80, true)!;
    if (!cooperationTypes.has(cooperationType)) throw new Error("invalid:cooperationType");
    if (body.privacyConsent !== true) throw new Error("invalid:privacyConsent");

    const idempotencyKey = uuid(body, "idempotencyKey");
    const client = adminClient();
    const previous = await client.from("business_inquiries").select("inquiry_no").eq("idempotency_key", idempotencyKey).maybeSingle();
    if (previous.error) throw previous.error;
    if (previous.data) return response(origin, 200, { referenceNo: previous.data.inquiry_no, duplicate: true });
    if (!await allowSubmission(client, await submissionFingerprints(request, emailValue), "business_inquiry")) {
      return response(origin, 429, { error: "rate_limited" });
    }
    const record = {
      inquiry_no: publicNumber("BI"), idempotency_key: idempotencyKey,
      company_name: text(body, "companyName", 120, true), contact_name: text(body, "contactName", 80, true),
      phone: phone(body, "phone"), email: emailValue, line_id: text(body, "lineId", 80), city: text(body, "city", 20, true),
      cooperation_type: cooperationType, product_interest: text(body, "productInterest", 200),
      estimated_quantity: positiveInteger(body, "quantity"), specifications: text(body, "specifications", 500),
      material_requirements: text(body, "materialRequirements", 500), expected_date: isoDate(body, "expectedDate"),
      description: text(body, "description", 4000, true), privacy_consent_at: new Date().toISOString(),
    };
    const { data, error } = await client.from("business_inquiries").insert(record).select("inquiry_no").single();
    if (error?.code === "23505") {
      const existing = await client.from("business_inquiries").select("inquiry_no").eq("idempotency_key", idempotencyKey).maybeSingle();
      if (existing.data) return response(origin, 200, { referenceNo: existing.data.inquiry_no, duplicate: true });
    }
    if (error) throw error;
    return response(origin, 201, { referenceNo: data.inquiry_no });
  } catch (error) {
    const invalid = error instanceof Error && error.message.startsWith("invalid:");
    console.error("submit-business-inquiry", error);
    return response(origin, invalid ? 400 : 500, { error: invalid ? error.message : "submission_failed" });
  }
});
