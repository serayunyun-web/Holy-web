import { hasValidPublishableKey } from "../_shared/auth.ts";
import { ATTACHMENT_BUCKET, MAX_ATTACHMENTS, attachmentPath, attachmentProblem } from "../_shared/attachment-rules.ts";
import { adminClient, allowSubmission, publicNumber } from "../_shared/database.ts";
import { sendEmail, trialQuoteEmail } from "../_shared/email.ts";
import { allowedOrigin, corsHeaders, response } from "../_shared/http.ts";
import { ESTIMATE_DISCLAIMER, calculateEstimate, isAutoPriced, shippingChoices, visiblePricingFields } from "../_shared/pricing.ts";
import { allowedManualSpecKeys, specRows } from "../_shared/spec-labels.ts";
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
const commonSpecKeys = new Set(["coverColor", "foilContent", "projectName", "coverSampleChoice"]);

/** 只保留此產品實際顯示的規格欄位，並檢查自動計價欄位完整合法。 */
function specifications(body: JsonObject, productSlug: string) {
  const input = body.specifications;
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("invalid:specifications");
  const raw: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value !== "string") throw new Error("invalid:specifications");
    if (value.trim().length > 2000) throw new Error("invalid:specifications");
    if (value.trim()) raw[key] = value.trim();
  }
  const auto = isAutoPriced(productSlug);
  const pricingIds = new Set(visiblePricingFields(productSlug, raw).map((field) => field.id));
  return Object.fromEntries(Object.entries(raw).filter(([key]) => commonSpecKeys.has(key) || (auto ? pricingIds.has(key) : allowedManualSpecKeys.has(key))));
}

type Attachment = { path: string; name: string; size: number; type: string };

function attachmentList(body: JsonObject, idempotencyKey: string): Attachment[] {
  const input = body.attachments ?? [];
  if (!Array.isArray(input) || input.length > MAX_ATTACHMENTS) throw new Error("invalid:attachments");
  return input.map((item, index) => {
    const entry = item as JsonObject;
    const name = text(entry, "name", 255, true)!;
    const size = Number(entry.size);
    if (attachmentProblem({ name, size }) || entry.path !== attachmentPath(idempotencyKey, index, name)) throw new Error("invalid:attachments");
    return { path: entry.path as string, name, size, type: text(entry, "type", 120) ?? "" };
  });
}

async function prepareUploads(request: Request, origin: string, body: JsonObject) {
  const idempotencyKey = uuid(body, "idempotencyKey");
  const emailValue = email(body, "email");
  const files = body.files;
  if (!Array.isArray(files) || files.length < 1 || files.length > MAX_ATTACHMENTS) throw new Error("invalid:files");
  const checked = files.map((item) => {
    const entry = item as JsonObject;
    const name = text(entry, "name", 255, true)!;
    if (attachmentProblem({ name, size: Number(entry.size) })) throw new Error("invalid:files");
    return name;
  });
  const client = adminClient();
  if (!await allowSubmission(client, await submissionFingerprints(request, emailValue), "manual_inquiry_upload")) {
    return response(origin, 429, { error: "rate_limited" });
  }
  const uploads = [];
  for (const [index, name] of checked.entries()) {
    const path = attachmentPath(idempotencyKey, index, name);
    const { data, error } = await client.storage.from(ATTACHMENT_BUCKET).createSignedUploadUrl(path, { upsert: true });
    if (error || !data) throw error ?? new Error("upload_url_failed");
    uploads.push({ path, token: data.token });
  }
  return response(origin, 200, { uploads });
}

async function verifyUploaded(client: ReturnType<typeof adminClient>, idempotencyKey: string, attachments: Attachment[]) {
  if (!attachments.length) return;
  const { data, error } = await client.storage.from(ATTACHMENT_BUCKET).list(`pending/${idempotencyKey}`, { limit: 100 });
  if (error) throw error;
  const sizes = new Map((data ?? []).map((object) => [`pending/${idempotencyKey}/${object.name}`, Number(object.metadata?.size ?? -1)]));
  for (const file of attachments) if (sizes.get(file.path) !== file.size) throw new Error("invalid:attachments");
}

Deno.serve(async (request) => {
  const origin = allowedOrigin(request);
  if (!origin) return new Response(null, { status: 403 });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (request.method !== "POST") return response(origin, 405, { error: "method_not_allowed" });

  try {
    if (!await hasValidPublishableKey(request)) return response(origin, 401, { error: "invalid_api_key" });
    const length = Number(request.headers.get("content-length") ?? 0);
    if (length > 65_536) return response(origin, 413, { error: "payload_too_large" });
    const body = await request.json() as JsonObject;
    if (body.action === "prepare-uploads") return await prepareUploads(request, origin, body);

    const emailValue = email(body, "email");
    const productSlug = text(body, "productSlug", 80, true)!;
    const product = products[productSlug as keyof typeof products];
    if (!product) throw new Error("invalid:productSlug");
    const customerType = text(body, "customerType", 20, true)!;
    if (!customerTypes.has(customerType)) throw new Error("invalid:customerType");
    if (body.privacyConsent !== true) throw new Error("invalid:privacyConsent");
    const organization = text(body, "organization", 120);
    if (customerType !== "個人" && !organization) throw new Error("invalid:organization");
    const quantity = positiveInteger(body, "quantity");
    if (!quantity || quantity > 100_000) throw new Error("invalid:quantity");

    const shippingChoice = shippingChoices.find((choice) => choice.id === body.shippingId);
    if (!shippingChoice) throw new Error("invalid:shippingId");
    const district = text(body, "shippingDistrict", 20) ?? undefined;
    const deliveryAddress = text(body, "deliveryAddress", 500);
    if (shippingChoice.needsAddress && !deliveryAddress) throw new Error("invalid:deliveryAddress");

    const idempotencyKey = uuid(body, "idempotencyKey");
    const specs = specifications(body, productSlug);
    const attachments = attachmentList(body, idempotencyKey);

    // 後端重新計價：不採用瀏覽器傳來的任何金額。
    const estimate = calculateEstimate({ productSlug, quantity, values: specs, shippingId: shippingChoice.id, district });
    if (estimate.status === "incomplete") throw new Error("invalid:specifications");
    if (shippingChoice.needsDistrict && !estimate.shipping) throw new Error("invalid:shippingDistrict");

    const client = adminClient();
    const previous = await client.from("manual_inquiries").select("inquiry_no").eq("idempotency_key", idempotencyKey).maybeSingle();
    if (previous.error) throw previous.error;
    if (previous.data) return response(origin, 200, { referenceNo: previous.data.inquiry_no, duplicate: true, emailSent: false, estimate });
    if (!await allowSubmission(client, await submissionFingerprints(request, emailValue), "manual_inquiry")) {
      return response(origin, 429, { error: "rate_limited" });
    }
    await verifyUploaded(client, idempotencyKey, attachments);

    const contactName = text(body, "contactName", 80, true)!;
    const { data: referenceNo, error } = await client.rpc("create_manual_inquiry_v2", {
      p_inquiry: {
        inquiry_no: publicNumber("MI"), idempotency_key: idempotencyKey, customer_type: customerType,
        contact_name: contactName, phone: phone(body, "phone"), email: emailValue, organization,
        preferred_contact: "Email", line_id: text(body, "lineId", 80),
        delivery_method: shippingChoice.label, delivery_address: deliveryAddress,
        expected_date: isoDate(body, "expectedDate"), customer_notes: text(body, "customerNotes", 2000),
        estimate, estimate_total: estimate.status === "priced" ? estimate.total : null, price_version: estimate.priceVersion,
        shipping: estimate.shipping,
      },
      p_item: { product_id: product[0], product_slug: productSlug, product_name: product[1], form_type: product[2], quantity, specifications: specs },
      p_attachments: attachments,
    });
    if (error) throw error;

    const emailSent = await sendEmail({
      to: emailValue,
      subject: `【鴻萊興業】${estimate.status === "priced" ? "系統試算報價單" : "已收到您的製作需求"}（${referenceNo}）`,
      html: trialQuoteEmail({ referenceNo, contactName, productName: product[1], quantity, specs: specRows(productSlug, specs), estimate, disclaimer: ESTIMATE_DISCLAIMER }),
    });
    if (emailSent) await client.from("manual_inquiries").update({ trial_email_sent_at: new Date().toISOString() }).eq("inquiry_no", referenceNo);
    return response(origin, 201, { referenceNo, emailSent, estimate });
  } catch (error) {
    const invalid = error instanceof Error && error.message.startsWith("invalid:");
    console.error("submit-manual-inquiry", error);
    return response(origin, invalid ? 400 : 500, { error: invalid ? error.message : "submission_failed" });
  }
});
