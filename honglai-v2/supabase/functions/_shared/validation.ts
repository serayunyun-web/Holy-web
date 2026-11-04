const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[0-9+()\-\s]{6,30}$/;

export type JsonObject = Record<string, unknown>;

export function text(input: JsonObject, key: string, max: number, required = false) {
  const value = typeof input[key] === "string" ? input[key].trim() : "";
  if ((required && !value) || value.length > max) throw new Error(`invalid:${key}`);
  return value || null;
}

export function email(input: JsonObject, key: string) {
  const value = text(input, key, 254, true)!;
  if (!emailPattern.test(value)) throw new Error(`invalid:${key}`);
  return value.toLowerCase();
}

export function phone(input: JsonObject, key: string) {
  const value = text(input, key, 30, true)!;
  if (!phonePattern.test(value)) throw new Error(`invalid:${key}`);
  return value;
}

export function uuid(input: JsonObject, key: string) {
  const value = text(input, key, 36, true)!;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new Error(`invalid:${key}`);
  return value;
}

export function positiveInteger(input: JsonObject, key: string) {
  if (input[key] === null || input[key] === undefined || input[key] === "") return null;
  const value = Number(input[key]);
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`invalid:${key}`);
  return value;
}

export function isoDate(input: JsonObject, key: string) {
  const value = text(input, key, 10);
  if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`invalid:${key}`);
  return value;
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function submissionFingerprints(request: Request, emailValue: string) {
  const salt = Deno.env.get("RATE_LIMIT_SALT");
  if (!salt) throw new Error("server:missing-rate-limit-salt");
  const realIp = request.headers.get("x-real-ip")?.trim();
  const forwarded = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  const ip = realIp || forwarded || "unknown";
  return {
    ip: await sha256(`${salt}|ip|${ip}`),
    email: await sha256(`${salt}|email|${emailValue.toLowerCase()}`),
  };
}
