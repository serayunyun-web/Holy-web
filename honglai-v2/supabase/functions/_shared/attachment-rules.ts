// 客戶附件規則（使用者確認：PDF／JPG／PNG／AI／ZIP，每檔 50MB 內，最多 10 個，保存 90 天）。前後端共用。
export const ATTACHMENT_BUCKET = "inquiry-files";
export const MAX_ATTACHMENTS = 10;
export const MAX_ATTACHMENT_BYTES = 50 * 1024 * 1024;
export const ATTACHMENT_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "ai", "zip"] as const;
export const ATTACHMENT_ACCEPT = ATTACHMENT_EXTENSIONS.map((ext) => `.${ext}`).join(",");

export function attachmentExtension(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

/** 回傳錯誤訊息；合法時回傳 null。 */
export function attachmentProblem(file: { name: string; size: number }) {
  if (!(ATTACHMENT_EXTENSIONS as readonly string[]).includes(attachmentExtension(file.name))) return "只接受 PDF、JPG、PNG、AI、ZIP 檔案。";
  if (file.size <= 0) return "檔案是空的。";
  if (file.size > MAX_ATTACHMENT_BYTES) return "單一檔案不可超過 50MB。";
  return null;
}

/** 儲存路徑只用英數字，避免中文檔名造成路徑問題；原始檔名另存資料庫。 */
export function attachmentPath(idempotencyKey: string, index: number, name: string) {
  return `pending/${idempotencyKey}/${index + 1}.${attachmentExtension(name)}`;
}

export function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
