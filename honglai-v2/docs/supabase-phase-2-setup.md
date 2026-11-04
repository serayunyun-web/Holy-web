# Supabase 第一階段本機串接設定清單

本機已準備 migration、兩支 Edge Functions 與前端呼叫程式，但尚未套用至正式 Supabase，也尚未部署 Edge Functions。

## 1. 建立與管理專案

1. 由公司持有的帳號建立 Supabase organization 與正式 project。
2. 分開規劃開發與正式環境，避免測試資料進入正式資料庫。
3. 確認專案 region、資料保存地點與可接受的營運成本。
4. 將專案 URL 與 Publishable Key 設為網站部署環境變數；Secret Key 只能存在 Edge Function secrets，不可放入前端。

## 2. 建議資料表與 migration

- `business_inquiries`：企業合作洽詢與處理狀態。
- `sample_requests`：樣品冊申請與審核狀態。
- `profiles`、`user_roles`：內部使用者與角色；連結 Supabase Auth 使用者。
- `business_inquiry_status_history`、`sample_request_status_history`：保存狀態變更。
- `public_submission_limits`：只保存加鹽雜湊指紋及次數，不保存原始 IP。
- `audit_logs`：預留必要的管理操作稽核。

所有 schema、索引、constraint、enum、RLS policy 與變更都以版本化 migration 管理，不直接在正式環境手動修改後遺漏紀錄。

## 3. Auth 與權限

1. 使用 Supabase Auth 建立管理員登入。
2. 不開放一般訪客讀取洽詢、樣品申請、合作廠商與內部備註。
3. 啟用 Row Level Security；公開訪客只能經受控的伺服器端提交流程新增允許欄位。
4. 管理員角色才能搜尋、篩選、查看資料及更新狀態。
5. 合作資格申請不會自動建立登入權限；核准與帳號啟用分開處理。

## 4. Storage 與附件（第三階段）

建立私有 bucket 前，公司需先確認：允許格式、單檔大小、檔案數量、保留期限與下載權限。上傳時需同時檢查副檔名、MIME type、檔案簽章與隨機化檔名；附件不得公開列目錄或使用可長期猜測的公開網址。

## 5. API 與部署遷移

現有 `output: "export"` 保持不變，敏感操作由 Supabase Edge Functions 提供：

1. 靜態前端只保存 Supabase URL 與 Publishable Key。
2. Secret Key 只設在 Edge Function secrets。
3. 在伺服器端再次驗證全部欄位，不信任前端驗證結果。
4. 使用 idempotency token、提交速率限制、Origin allowlist 與必要的濫用防護。
5. 成功建立資料後才回傳申請編號。
6. 前端只顯示適合訪客理解的錯誤，不暴露資料庫或內部設定。

## 6. 上線前公司需確認

- 正式個資告知文字、蒐集目的、保存期限與聯絡窗口。
- 管理員名單、帳號建立及離職停權流程。
- 附件規則與資料刪除流程。
- 樣品冊費用、運費、資格、內容與寄送規則。
- 合作廠商審核標準與專區權限。
- 是否採 CAPTCHA，以及可接受的防濫用方案。
- 備份、還原、稽核與事件通報責任人。

確認以上內容後，才把本機 migration 與 Edge Functions 套用到指定的 Supabase 專案。
