import { hasValidPublishableKey } from "../_shared/auth.ts";
import { adminClient, allowSubmission, publicNumber } from "../_shared/database.ts";
import { allowedOrigin, corsHeaders, response } from "../_shared/http.ts";
import { email, isoDate, phone, positiveInteger, submissionFingerprints, text, uuid, type JsonObject } from "../_shared/validation.ts";

const products = {
  "thesis-binding": ["prd-thesis-binding", "論文", "book-binding"],
  "certificate-folder": ["prd-certificate-folder", "證書夾", "certificate-folder"],
  "construction-book": ["prd-construction-book", "工程施工本", "construction-book"],
  "engineering-contract": ["prd-engineering-contract", "工程合約書", "book-binding"],
  "perfect-binding": ["prd-perfect-binding", "膠裝", "book-binding"],
  "hardcover": ["prd-hardcover", "精裝", "book-binding"],
  "sewn-softcover": ["prd-sewn-softcover", "線平裝", "book-binding"],
  "sewn-hardcover": ["prd-sewn-hardcover", "線精裝", "book-binding"],
  "exposed-spine-sewn": ["prd-exposed-spine-sewn", "裸背線裝", "book-binding"],
  "machine-sewn-binding": ["prd-machine-sewn-binding", "車線平裝", "book-binding"],
  "saddle-stitch": ["prd-saddle-stitch", "騎馬釘", "book-binding"],
  "ring-binding": ["prd-ring-binding", "線圈環裝", "book-binding"],
  "butterfly-book": ["prd-butterfly-book", "蝴蝶平、精裝", "book-binding"],
  "menu-production": ["prd-menu-production", "菜單螺絲裝", "menu"],
  "q-rod-hardcover": ["prd-q-rod-hardcover", "Q桿精裝", "book-binding"],
  "screw-contract": ["prd-screw-contract", "鎖螺絲合約書", "book-binding"],
} as const;

const customerTypes = new Set(["個人", "公司行號", "學校或行政單位"]);
const preferredContacts = new Set(["電話", "Email", "LINE"]);
const deliveryMethods = new Set(["自取", "需要配送", "尚未確定"]);
const specificationKeys = new Set([
  "purpose", "binding", "size", "orientation", "pages", "thickness", "insidePrint", "printSides",
  "cover", "coverSample", "turning", "coverFinish", "thesisBound", "foilText", "mounting", "screw",
  "corner", "coverFilm", "saddleCover", "menuType", "openSize", "print", "material", "accessory",
  "lamination", "design", "style", "opening", "fixing", "lining", "finish", "constructionType",
  "sourceSize", "finishSize", "sheets", "constructionCover", "folding", "item", "occasion", "approxSize",
  "reference", "appearance", "help", "projectName", "budget",
]);

function optionalChoice(body: JsonObject, key: string, allowed: Set<string>) {
  const value = text(body, key, 80);
  if (value && !allowed.has(value)) throw new Error(`invalid:${key}`);
  return value;
}

function specifications(body: JsonObject) {
  const input = body.specifications;
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("invalid:specifications");
  const result: Record<string, string> = {};
  for (const [key, raw] of Object.entries(input)) {
    if (!specificationKeys.has(key) || typeof raw !== "string") throw new Error("invalid:specifications");
    const value = raw.trim();
    if (value.length > 2000) throw new Error("invalid:specifications");
    if (value) result[key] = value;
  }
  if (!result.projectName) throw new Error("invalid:specifications");
  return result;
}

Deno.serve(async (request) => {
  const origin = allowedOrigin(request);
  if (!origin) return new Response(null, { status: 403 });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (request.method !== "POST") return response(origin, 405, { error: "method_not_allowed" });

  try {
    if (!await hasValidPublishableKey(request)) return response(origin, 401, { error: "invalid_api_key" });
    const length = Number(request.headers.get("content-length") ?? 0);
    if (length > 32_768) return response(origin, 413, { error: "payload_too_large" });
    const body = await request.json() as JsonObject;
    const emailValue = email(body, "email");
    const productSlug = text(body, "productSlug", 80, true)!;
    const product = products[productSlug as keyof typeof products];
    if (!product) throw new Error("invalid:productSlug");
    const customerType = text(body, "customerType", 20, true)!;
    if (!customerTypes.has(customerType)) throw new Error("invalid:customerType");
    if (body.privacyConsent !== true) throw new Error("invalid:privacyConsent");
    const organization = text(body, "organization", 120);
    if (customerType !== "個人" && !organization) throw new Error("invalid:organization");
    const deliveryMethod = optionalChoice(body, "deliveryMethod", deliveryMethods);
    const deliveryAddress = text(body, "deliveryAddress", 500);
    if (deliveryMethod === "需要配送" && !deliveryAddress) throw new Error("invalid:deliveryAddress");
    const quantity = positiveInteger(body, "quantity");
    if (!quantity) throw new Error("invalid:quantity");

    const idempotencyKey = uuid(body, "idempotencyKey");
    const client = adminClient();
    const previous = await client.from("manual_inquiries").select("inquiry_no").eq("idempotency_key", idempotencyKey).maybeSingle();
    if (previous.error) throw previous.error;
    if (previous.data) return response(origin, 200, { referenceNo: previous.data.inquiry_no, duplicate: true });
    if (!await allowSubmission(client, await submissionFingerprints(request, emailValue), "manual_inquiry")) {
      return response(origin, 429, { error: "rate_limited" });
    }

    const { data, error } = await client.rpc("create_manual_inquiry", {
      p_inquiry_no: publicNumber("MI"),
      p_idempotency_key: idempotencyKey,
      p_customer_type: customerType,
      p_contact_name: text(body, "contactName", 80, true),
      p_phone: phone(body, "phone"),
      p_email: emailValue,
      p_organization: organization,
      p_preferred_contact: optionalChoice(body, "preferredContact", preferredContacts),
      p_line_id: text(body, "lineId", 80),
      p_delivery_method: deliveryMethod,
      p_delivery_address: deliveryAddress,
      p_expected_date: isoDate(body, "expectedDate"),
      p_file_status: text(body, "fileStatus", 80),
      p_special_requirements: text(body, "specialRequirements", 2000),
      p_customer_notes: text(body, "customerNotes", 2000),
      p_contact_notes: text(body, "contactNotes", 2000),
      p_product_id: product[0],
      p_product_slug: productSlug,
      p_product_name: product[1],
      p_form_type: product[2],
      p_quantity: quantity,
      p_specifications: specifications(body),
    });
    if (error) throw error;
    return response(origin, 201, { referenceNo: data });
  } catch (error) {
    const invalid = error instanceof Error && error.message.startsWith("invalid:");
    console.error("submit-manual-inquiry", error);
    return response(origin, invalid ? 400 : 500, { error: invalid ? error.message : "submission_failed" });
  }
});
