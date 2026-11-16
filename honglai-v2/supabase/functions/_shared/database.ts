import { createClient } from "npm:@supabase/supabase-js@2";

export function adminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const secret = Deno.env.get("APP_SUPABASE_SECRET_KEY");
  if (!url || !secret) throw new Error("server:missing-supabase-configuration");
  return createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function allowSubmission(
  client: ReturnType<typeof adminClient>,
  fingerprints: { ip: string; email: string },
  formType: "business_inquiry" | "sample_request" | "manual_inquiry" | "manual_inquiry_upload" | "mock_payment",
  limit = 5,
) {
  const { data, error } = await client.rpc("claim_public_submission", {
    p_ip_fingerprint: fingerprints.ip,
    p_email_fingerprint: fingerprints.email,
    p_form_type: formType,
    p_limit: limit,
  });
  if (error) throw error;
  return data === true;
}

export function publicNumber(prefix: "BI" | "SR" | "MI") {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const random = crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();
  return `${prefix}-${date}-${random}`;
}
