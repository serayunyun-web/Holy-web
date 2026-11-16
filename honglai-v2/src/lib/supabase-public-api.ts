import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export class SubmissionError extends Error {
  constructor(public code: string) { super(code); }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let browserClient: SupabaseClient | null = null;

/** 瀏覽器端 Supabase client（只用 publishable key；權限由 RLS 與 RPC 內的角色檢查控管）。 */
export function supabaseBrowser() {
  if (!url || !key) throw new SubmissionError("not_configured");
  browserClient ??= createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } });
  return browserClient;
}

export function isSupabaseConfigured() { return Boolean(url && key); }

export async function callPublicFunction<T extends object>(functionName: string, payload: Record<string, unknown>, accessToken?: string): Promise<T> {
  if (!url || !key) throw new SubmissionError("not_configured");
  let response: Response;
  try {
    response = await fetch(`${url}/functions/v1/${functionName}`, {
      method: "POST",
      headers: { "content-type": "application/json", apikey: key, ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}) },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new SubmissionError("network_error");
  }
  const result = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new SubmissionError(result.error ?? "submission_failed");
  return result;
}

/** 舊介面：保留給既有表單使用，回傳需求編號。 */
export async function submitPublicForm(functionName: string, payload: Record<string, unknown>) {
  const result = await callPublicFunction<{ referenceNo?: string }>(functionName, payload);
  if (!result.referenceNo) throw new SubmissionError("submission_failed");
  return result.referenceNo;
}
