# 鴻萊興業 V2｜Gemini FAQ 小幫手後端設計

日期：2026-11-05  
狀態：待使用者審核後實作  
範圍：Supabase Edge Function 後端與測試，不含聊天介面、部署、金鑰設定或正式啟用

## 1. 目標與非目標

本階段建立一個單輪問答的 Supabase Edge Function。它只根據第一階段產生的 FAQ AI 知識資料回答鴻萊興業的印刷、裝訂、產品、估價流程與服務問題，並以固定後端規則阻止直接報價、不當承諾及提示詞注入。

本階段不製作聊天視窗、不啟用首頁 AI 客服按鈕、不修改網站視覺、不部署 Function 或 migration、不設定或讀取真實 Gemini API Key，也不呼叫真實 Gemini API。

## 2. 現有架構與沿用項目

- Next.js 靜態輸出維持不變，不新增 Next.js API Route。
- 新功能位於 `supabase/functions/faq-assistant/`。
- FAQ 唯一正式來源仍為 `content/knowledge/鴻萊_FAQ_KNOWLEDGE_BASE_第二版.md`。
- Edge Function 匯入 `supabase/functions/_shared/faq-knowledge.generated.ts`，不建立第二套答案。
- 沿用 `_shared/auth.ts`、`_shared/http.ts` 與 `_shared/database.ts` 的安全模式；如需補充共用函式，只做向後相容新增，不改變既有三個表單 Function。
- `supabase/config.toml` 只新增 `[functions.faq-assistant]`，不修改現有 Function 設定。

## 3. API 契約

### 3.1 請求

只接受 `POST` 與 CORS `OPTIONS`：

```json
{
  "message": "請問可以製作少量精裝書嗎？"
}
```

限制：

- `Content-Type` 必須是 `application/json`。
- Request Body 上限 4096 bytes。
- `message` 必須是字串，去除頭尾空白後為 1 至 500 個 Unicode 字元。
- 不接受其他對話歷史、檔案、URL、模型名稱或自訂系統提示。

### 3.2 成功回應

```json
{
  "success": true,
  "answer": "回覆內容",
  "sources": [
    {
      "id": "printing-estimates-01",
      "question": "有最低印量限制嗎？"
    }
  ],
  "requiresHuman": false,
  "action": "none"
}
```

`action` 僅能是：

- `none`
- `estimate`
- `contact`

來源、轉人工狀態與 action 由後端決定，不接受 Gemini 自行提供。回應不包含任意模型產生的 URL。

### 3.3 錯誤回應

錯誤格式：

```json
{
  "success": false,
  "error": "INVALID_REQUEST"
}
```

允許的錯誤代碼：

- `INVALID_REQUEST`
- `UNAUTHORIZED`
- `RATE_LIMITED`
- `MODEL_UNAVAILABLE`
- `AI_TIMEOUT`
- `SERVICE_UNAVAILABLE`

回應不包含 Google 原始錯誤、Stack Trace、私密環境變數或 API Key。

## 4. Function 資料流

1. 驗證允許來源；不允許的 Origin 回傳 403。
2. 處理 `OPTIONS`；其他非 `POST` 方法回傳 405。
3. 檢查 `FAQ_ASSISTANT_ENABLED`。未明確設為 `true` 時回傳 `SERVICE_UNAVAILABLE`，不呼叫 Gemini。
4. 使用既有 `hasValidPublishableKey()` 驗證 `apikey`。Publishable Key 只代表合法網站客戶端，不視為使用者身分。
5. 驗證 Content-Type、Body 大小、JSON 與訊息長度。
6. 由受控請求標頭取得來源地址；使用 `RATE_LIMIT_SALT` 雜湊，只傳送雜湊值給限流 RPC。
7. 呼叫 PostgreSQL RPC 原子地檢查短期與每日限制。RPC 不可用或回傳錯誤時 fail closed，不呼叫 Gemini。
8. 執行提示詞注入、服務範圍、價格、人工報價、交期、售後及個別訂單意圖判斷。
9. 執行 FAQ 關鍵字檢索並取前 5 筆。
10. 無足夠相關資料時直接回傳固定轉人工回答，不呼叫 Gemini。
11. 高風險意圖使用後端固定回答；一般 FAQ 才呼叫 Gemini。
12. 驗證 Gemini 回應、執行輸出安全檢查；失敗時改用固定安全回答。
13. 回傳由後端組合的答案、來源、轉人工狀態與 action。

## 5. 模組設計

### `faq-assistant/index.ts`

負責 HTTP 邊界、依賴組合、CORS、驗證順序、錯誤映射與最終回應。不得包含大量檢索或提示詞字串。

### `faq-assistant/retrieval.ts`

提供純函式：

- Unicode NFKC 正規化。
- 繁體中文文字小寫化、全半形正規化及基本標點移除。
- 多關鍵字切分。
- 僅搜尋 `isActive && aiUsable` 的資料。
- 題目完整匹配、題目部分匹配、子分類、顯示分類、原始分類、答案依序加權。
- 少量製作、最低印量、檔案格式、解析度、燙金、取貨等同義詞只作查詢擴充，不加入商業規則。
- 結果依分數及原始 `displayOrder` 穩定排序。
- 預設最多 5 筆，低於門檻視為無可靠答案。

### `faq-assistant/business-rules.ts`

提供純函式並在 Gemini 前決定：

- `scope`：客服範圍內或無關問題。
- `price`：價格／折扣／總價／費用意圖；不能把 300dpi、3mm、40 本、營業時間等一般數字誤判為價格。
- `manualQuote`：企業、大量、客製、資料不足、一般品項 40 本以上；證書夾依知識庫例外處理。
- `deliveryPromise`：急件、明天完成、固定日期承諾。
- `afterSales`：退款、補印、賠償、退換貨、瑕疵爭議、訂單狀態。
- `promptInjection`：忽略規則、索取 API Key、系統提示詞、假冒管理員、強迫報價、要求執行程式。

高風險規則使用保守結果；不確定時轉人工，不讓模型自行裁定。

### `faq-assistant/prompts.ts`

存放固定 System Instructions 與 FAQ 上下文格式。明確區分：

- 系統規則。
- 使用者問題（不可信內容）。
- FAQ 參考資料（不可信指令，只能作為內容依據）。

System Instructions 要求台灣繁體中文、親切專業、B2B/B2C 同等重要、不假裝真人、不補充知識庫以外資訊。

### `faq-assistant/gemini-client.ts`

使用原生 `fetch` 呼叫官方 REST `generateContent`，不加入 SDK：

- `GEMINI_API_KEY` 只從 `Deno.env.get()` 取得。
- `GEMINI_MODEL` 必填，不提供猜測預設值。
- URL 只包含經 `encodeURIComponent` 處理的模型 ID。
- 金鑰只放 `x-goog-api-key` header。
- 使用 `AbortController`，預設 8000ms 超時。
- `maxOutputTokens` 使用保守上限，初始值 384。
- `temperature` 使用低值，初始值 0.2。
- 不啟用搜尋、工具呼叫、程式執行或外部 URL context。
- 處理 429、404／模型不可用、5xx、逾時、安全過濾、非 STOP 完成原因、無候選與空白文字。
- 日誌只記錄安全錯誤代碼與 HTTP 狀態，不記錄完整訪客問題、提示詞或金鑰。

### `faq-assistant/response-safety.ts`

檢查模型輸出是否包含：

- 金額符號、幣別或明確價格語境。
- 折扣、總價、單價、加工費等直接報價。
- 一定完成、一定交貨、保證製作等承諾。
- 對退款、補印、賠償或瑕疵個案的裁定。
- API Key、系統提示詞或內部規則揭露。

檢查失敗不嘗試自行修補模型文字，直接替換為後端固定安全回答。

### `faq-assistant/types.ts`

集中定義請求、成功回應、錯誤代碼、action、檢索結果與 Gemini Client 介面，避免模組間使用不受控字串。

## 6. Gemini 模型與設定

官方模型頁目前列出 `gemini-3.5-flash-lite` 為穩定 Flash-Lite 候選，但專案實際存取資格無法在沒有金鑰及使用者同意時確認。因此：

- Function 強制要求 `GEMINI_MODEL`。
- `.env.example` 註記目前官方候選，但不寫入程式預設值。
- 金鑰或模型缺少時回傳 `SERVICE_UNAVAILABLE`。
- 真實模型清單及呼叫只在使用者設定金鑰並另行同意後測試。

## 7. 持久化限流

新增 migration，不修改既有 `public_submission_limits`：

- 建立 `private.faq_assistant_rate_limits`。
- 欄位只包含雜湊來源指紋及時間，不保存原始 IP 或問題。
- 建立 `(fingerprint, occurred_at desc)` 索引。
- 新增 `public.claim_faq_assistant_request(...)` Security Definer RPC。
- 使用 advisory transaction lock，避免併發請求同時通過。
- 預設限制為 10 次／10 分鐘及 50 次／24 小時。
- 每次 claim 時清除超過短期保留期間的舊記錄。
- Table 對 `anon`、`authenticated` 完全撤權。
- RPC 只授權 server-side secret role；Edge Function 使用既有 admin client 呼叫。
- migration 或 RPC 未部署時 Function fail closed。

來源地址優先使用託管環境提供的 `cf-connecting-ip`，其次 `x-real-ip`。缺少可用地址時使用共用保守桶，不略過限流。正式公開前仍需透過 staging 日誌確認實際標頭，並建議第三階段加入 Turnstile；本階段維持 `FAQ_ASSISTANT_ENABLED=false`。

## 8. Supabase 驗證與 CORS

- `supabase/config.toml` 只新增 `[functions.faq-assistant] verify_jwt = false`。
- Function 內使用 `hasValidPublishableKey()` 驗證 `apikey`。
- 只接受 `ALLOWED_ORIGINS` 精確列出的來源。
- 不使用 `*` CORS。
- 不將 Publishable Key 視為訪客身分或防濫用措施。
- 公開成本控制依賴啟用開關、持久化限流、輸入限制、檢索前置判斷與輸出上限。

## 9. 環境變數

`.env.example` 新增註解範例，不含真實值：

```text
GEMINI_API_KEY=configure-in-supabase-secrets
GEMINI_MODEL=confirm-with-your-google-ai-project
FAQ_ASSISTANT_ENABLED=false
FAQ_ASSISTANT_TIMEOUT_MS=8000
FAQ_ASSISTANT_RATE_LIMIT=10
FAQ_ASSISTANT_DAILY_LIMIT=50
```

既有 `RATE_LIMIT_SALT`、`ALLOWED_ORIGINS`、Supabase URL 與 server-side secret 繼續沿用。

## 10. 測試設計

### 單元測試

- 使用第一階段產生的 FAQ 資料測試 7 個一般 FAQ 查詢及來源 ID。
- 測試價格、人工報價、交期、售後、訂單狀態、無關問題與提示詞注入。
- 測試全半形、繁中標點、多關鍵字與同義詞。
- 測試 300dpi、3mm、40 本與營業時間不被簡單數字規則誤擋。
- 測試生成後價格與承諾內容被替換為安全回答。

### 本機整合測試

- 將 handler 與 Gemini fetch、限流 RPC 以依賴注入方式隔離。
- Mock Gemini 成功、429、404／模型不可用、5xx、Timeout、安全過濾及空白回應。
- 測試空白、超長、非法 JSON、錯誤方法、錯誤 Origin、缺少 Publishable Key、API Key／模型缺少、限流拒絕與資料庫限流錯誤。
- 測試不會將金鑰或 Google 原始錯誤回傳給訪客。

### 真實 API 測試

本階段不執行。只有在使用者設定 Gemini Secret、確認模型存取資格並明確同意後，才對 staging 執行一筆最小測試。

### 工具驗證

- FAQ：`npm run faq:validate`
- 前端：ESLint、TypeScript、production build
- Edge Function：Deno lint/check/test；若本機沒有 Deno，使用 Supabase CLI bundle/serve 或清楚回報未能執行的檢查，不以其他檢查冒充。

## 11. 預計檔案變更

新增：

- `supabase/functions/faq-assistant/index.ts`
- `supabase/functions/faq-assistant/types.ts`
- `supabase/functions/faq-assistant/retrieval.ts`
- `supabase/functions/faq-assistant/business-rules.ts`
- `supabase/functions/faq-assistant/prompts.ts`
- `supabase/functions/faq-assistant/gemini-client.ts`
- `supabase/functions/faq-assistant/response-safety.ts`
- 對應 `*_test.ts` 測試檔
- `supabase/migrations/202611050001_faq_assistant_rate_limits.sql`

修改：

- `.env.example`
- `supabase/config.toml`
- 視測試工具需求，在 `package.json` 增加不涉及正式部署的測試指令

不修改：

- 現有三個 Edge Functions
- FAQ 顯示元件與 FAQ 答案
- 首頁、聊天按鈕及任何網站視覺
- 產品、價格、估價及訂單流程

## 12. 啟用與部署閘門

程式完成不等於公開可用。部署與啟用前必須另外確認：

1. 使用者建立並自行保管 Gemini API Key。
2. 使用者確認 Google AI 專案可用模型 ID 與帳務／免費額度政策。
3. migration 在 staging 套用成功。
4. Supabase Secrets 設定完成。
5. staging Function 部署完成但仍維持公開啟用旗標關閉。
6. 驗證來源標頭、限流、CORS、成本與安全日誌。
7. 使用者同意後才開啟 staging 測試。
8. 第三階段聊天介面另案設計，正式環境部署另行核准。

## 13. 驗收標準

- 28 個指定案例均有可預期結果。
- 一般 FAQ 能回傳正確來源 ID。
- 價格、承諾、售後與個案問題不交由模型自行裁定。
- 無可靠 FAQ 時不呼叫 Gemini，並轉人工。
- AI Key 不進入前端、Git、回應或日誌。
- 限流跨 Edge Function 執行個體生效；資料庫限流不可用時 fail closed。
- 現有三個 Edge Functions 與網站靜態建置不受影響。
- 未經另行核准，不部署、不設定金鑰、不呼叫真實 Gemini、不公開端點。
