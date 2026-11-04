export type FormErrors = Record<string, string>;

export function validateEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()); }
export function validatePhone(value: string) { return /^[0-9+()\-\s#]+$/.test(value.trim()) && value.replace(/\D/g, "").length >= 8; }
export function required(value: FormDataEntryValue | null) { return typeof value === "string" && value.trim().length > 0; }
export function focusFirstError(errors: FormErrors) { const first = Object.keys(errors)[0]; if (first) document.getElementById(first)?.focus(); }
