import { createSupabaseContext } from "npm:@supabase/server@1";

export async function hasValidPublishableKey(request: Request) {
  const { error } = await createSupabaseContext(request, { auth: "publishable" });
  return error === null;
}
