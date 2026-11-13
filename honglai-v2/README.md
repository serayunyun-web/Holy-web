# 鴻萊興業 V2

Next.js 16.4.4 靜態匯出網站。人工詢價功能透過 Supabase Edge Function 寫入 staging；網站不包含自動估價、正式訂單、工作單或線上付款。

## Windows 一鍵開發預覽

在檔案總管進入本資料夾，雙擊：

`啟動網站預覽.bat`

啟動器會檢查 Node.js、相依套件及連接埠 3000，接著啟動開發伺服器並自動開啟：

<http://127.0.0.1:3000>

日常修改程式後，Next.js 會自動更新頁面，不需要重新 build。若鴻萊預覽已經啟動，批次檔只會開啟瀏覽器，不會重複占用連接埠。若連接埠被其他服務占用，它會顯示錯誤，但不會停止該程序。

要關閉預覽，請在標題為「鴻萊興業 V2 開發預覽」的命令視窗按 `Ctrl+C`，或直接關閉該視窗。

## 確認使用 staging

本機 `.env.local` 必須包含：

```text
NEXT_PUBLIC_SUPABASE_URL=https://ortxroasrfomdmfctkmm.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=你的 staging Publishable Key
```

`NEXT_PUBLIC_*` 只能使用可公開的 Publishable Key，不得放入 Secret Key、Access Token 或資料庫密碼。Edge Function 的 `APP_SUPABASE_SECRET_KEY`、`RATE_LIMIT_SALT` 與 `ALLOWED_ORIGINS` 必須保存在 Supabase staging secrets，不寫入本機啟動檔或 Git。

可用以下 PowerShell 指令只顯示 Project Ref，不輸出 Key：

```powershell
Select-String -LiteralPath .env.local -Pattern 'ortxroasrfomdmfctkmm'
```

## 正式建置與靜態匯出預覽

在本資料夾開啟 PowerShell：

```powershell
npm run lint -- --no-cache
npx tsc --noEmit --incremental false
npm run build
npm run preview:static
```

建置成功後，首頁位於：

`honglai-v2/out/index.html`

正式建置預覽網址是 <http://127.0.0.1:4173>。請透過此 HTTP 網址檢查，不要直接以 `file://` 雙擊 HTML。按 `Ctrl+C` 關閉靜態預覽。

## 人工詢價流程

- `/order` 會把未送出的內容保存在目前瀏覽器，這只是草稿。
- 產品詳情頁使用 `/order?product=<產品 slug>` 預選 15 項產品之一。
- 只有按下「正式送出人工詢價」且畫面收到 `MI-...` 詢價編號，才代表 staging 已建立紀錄。
- 所有產品目前皆為人工詢價；不顯示未確認價格，也不建立正式訂單或工作單。

## 常見問題

### 雙擊後顯示找不到 Node.js

先安裝專案目前使用的 Node.js，再重新開啟命令提示字元。執行 `node --version` 應能顯示版本。

### 顯示尚未安裝相依套件

在本資料夾執行 `npm install`，完成後再雙擊啟動檔。

### 連接埠 3000 被占用

啟動器不會停止任何現有程序。若占用者不是鴻萊網站，請自行確認並關閉該程式，或暫時以 `npm run dev -- --port 3001` 使用其他連接埠；使用其他連接埠時，Supabase staging 的 `ALLOWED_ORIGINS` 也必須包含對應來源。

### 表單顯示 staging 尚未設定或送出失敗

確認 `.env.local` 使用 staging URL 與 Publishable Key、`submit-manual-inquiry` 已部署，以及 staging secrets 的 `ALLOWED_ORIGINS` 包含目前預覽網址。失敗時資料不會被顯示為成功，瀏覽器草稿仍會保留。

### 修改後正式預覽沒有更新

重新執行 `npm run build`，再重啟 `npm run preview:static`。開發預覽則不需要 build。
