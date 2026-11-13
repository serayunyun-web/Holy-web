# 鴻萊興業 V2 快速查價頁第一階段實作計畫

日期：2026-11-09

## 設計校準

- 主題：一般客戶使用的印刷與裝訂產品快速查價入口。
- 單一任務：選一項產品、填標準規格、判斷未來自動查價或人工估價，並前往既有需求頁。
- 色彩：沿用 `--teal #178b87`、`--teal-deep #0f6f6c`、`--paper #f8f4ea`、`--white #fffdf8`、`--brown #8c6a55`。
- 字體：沿用 Noto Serif TC 顯示字與 Noto Sans TC 介面字，不新增外部字型。
- 版型：產品分類與產品目錄在上，選取後同頁展開規格與摘要；手機改成單欄。
- 識別元素：用「裝訂索引籤」式狀態條標示標準查價、人工估價及尚未串價，呼應書冊製作而非套用通用電商價格卡。
- 自我檢查：不新增通用 Dashboard、漸層 KPI 卡或與現站不一致的黑底／霓虹視覺；所有裝飾都服務產品分類、規格與狀態辨識。

## Task 1：建立純規則模組

新增 `src/data/quote-options.ts`：

- 配送方式與每筆固定運費。
- 查價狀態判斷所需常數。
- 可疑／非標準選項文字判斷。
- 一般品項 40 本以上、證書夾例外、菜單人工估價規則。

不放入產品價格，不讀取 Excel。

## Task 2：建立產品目錄式查價元件

新增 `src/components/quote-catalog.tsx`：

- 使用 `activeProducts`、`activeCategories`、`productFormTypeBySlug`、`fieldsByProduct`。
- 支援分類篩選、產品選取、條件式欄位、正整數數量及配送方式。
- 切換已有輸入的產品前顯示確認。
- 顯示規格摘要、固定運費、計價狀態與未稅說明。
- 不顯示產品金額或未稅合計。
- CTA 只以產品 slug 前往 `/order`，明確說明第一階段只帶產品。

## Task 3：接入快速查價頁

修改 `src/app/quote/page.tsx`：

- 保留既有 Banner 與圖片。
- 移除單純的未啟用提示卡。
- 加入流程說明及 `QuoteCatalog`。

## Task 4：加入限定樣式

修改 `src/app/globals.css`：

- 只新增 `quote-` 前綴樣式。
- 延續產品目錄、下單表單及既有色票。
- 桌機以目錄＋規格摘要呈現；平板與手機重排為單欄。
- 保留可見 focus、足夠點擊範圍與 reduced-motion 支援。

## Task 5：靜態與功能驗證

執行：

1. `npm run lint`
2. `npx tsc --noEmit`
3. `npm run build -- --webpack`（若一般 build 可用則先用一般 build）
4. 確認靜態匯出包含 `/quote` 與 `/order`。
5. 瀏覽器驗證 15 項產品、分類、條件欄位、39／40 本、證書夾 40 本、菜單、四種運費及 CTA。
6. 桌機與手機畫面截圖檢查。

不修改資料庫、Edge Function、價格 Excel、既有人工詢價提交、Logo、FAQ 或正式部署。
