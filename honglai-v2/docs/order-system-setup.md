# 查價、下單、報價確認與工作單：上線設定

程式已完成，但以下步驟需要用你的 Supabase／寄信帳號操作，完成前線上網站的下單與後台不會運作。

## 1. 套用資料庫 Migration（staging）

```bash
npx supabase db push
```

新增：`supabase/migrations/202611160001_quotes_orders_work_orders.sql`
（附件、正式報價、訂單、工作單、私有檔案空間 `inquiry-files`、相關 RPC 與 RLS）。只新增，不刪除既有資料。

## 2. 部署 Edge Functions

```bash
npx supabase functions deploy submit-manual-inquiry
npx supabase functions deploy send-quote-email
```

`faq-assistant` 沒有修改，不需重新部署。

## 3. 設定寄信（Resend）

1. 在 Resend 驗證寄件網域（或寄件信箱）。
2. 設定 Secrets：

```bash
npx supabase secrets set RESEND_API_KEY=你的金鑰 EMAIL_FROM="鴻萊興業 <service@你的網域>" EMAIL_REPLY_TO=hongguan8888@gmail.com
```

未設定時：需求與報價仍會建立，但不寄信；後台會顯示確認連結讓你手動複製給客戶。

`ALLOWED_ORIGINS` 需包含正式網站網址（客戶確認連結會使用這個網址）。

## 4. 建立後台帳號

1. Supabase Dashboard → Authentication → Users → Add user（Email＋密碼）。
2. SQL Editor 執行（把 Email 換成該帳號）：

```sql
insert into public.profiles (user_id, display_name)
select id, '管理員' from auth.users where email = 'admin@example.com';
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'admin@example.com';
```

角色：`staff` 看資料、更新製作進度；`manager` 另可送出正式報價、確認工作單；`admin` 全部權限。

後台網址：`/hl-office-e3adeb95/`（刻意不公開，網站上沒有任何連結；請只分享給內部人員）

## 流程

客戶查價 → 下單（可上傳檔案）→ 自動寄「系統試算報價單」→ 後台確認並按「送出正式報價並寄給客戶」→ 客戶 3 天內點連結確認 → 自動成立訂單＋工作單（待內部確認）→ manager 確認工作單 → 待安排 → 製作中 → 已完成 → 已交付。

## 尚未自動化

- 附件 90 天自動刪除：目前未排程，需要時再加。
- 價格後台管理與 Excel 匯入：價格目前在 `supabase/functions/_shared/price-table.generated.ts`，改價需更新此檔與 `PRICE_VERSION`。
