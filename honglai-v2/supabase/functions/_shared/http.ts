export const jsonHeaders = { "content-type": "application/json; charset=utf-8" };

export function allowedOrigin(request: Request) {
  const configured = (Deno.env.get("ALLOWED_ORIGINS") ?? "http://localhost:3000")
    .split(",").map((value) => value.trim()).filter(Boolean);
  const origin = request.headers.get("origin") ?? "";
  return configured.includes(origin) ? origin : null;
}

export function corsHeaders(origin: string) {
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-headers": "authorization, apikey, content-type, x-client-info",
    "access-control-allow-methods": "POST, OPTIONS",
    "vary": "Origin",
  };
}

export function response(origin: string, status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...jsonHeaders, ...corsHeaders(origin) } });
}
