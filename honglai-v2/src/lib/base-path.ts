/**
 * 網站部署在子路徑時（例如 GitHub Pages 的 /repo-name），由建置環境變數 NEXT_PUBLIC_BASE_PATH 提供前綴。
 * next/link 與 router 會自動加上前綴；圖片、模型等直接寫路徑的資源要經過 withBase()。
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const withBase = (path: string) => (path.startsWith("/") && !path.startsWith("//") ? `${BASE_PATH}${path}` : path);
