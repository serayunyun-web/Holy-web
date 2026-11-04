type SubmissionResponse = { referenceNo?: string; error?: string };

export class SubmissionError extends Error {
  constructor(public code: string) { super(code); }
}

export async function submitPublicForm(functionName: string, payload: Record<string, unknown>) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new SubmissionError("not_configured");

  let response: Response;
  try {
    response = await fetch(`${url}/functions/v1/${functionName}`, {
      method: "POST",
      headers: { "content-type": "application/json", apikey: key, authorization: `Bearer ${key}` },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new SubmissionError("network_error");
  }
  const result = await response.json().catch(() => ({})) as SubmissionResponse;
  if (!response.ok || !result.referenceNo) throw new SubmissionError(result.error ?? "submission_failed");
  return result.referenceNo;
}
