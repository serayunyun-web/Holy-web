# 鴻萊興業 V2｜全站圖片素材與製作規格盤點

> 盤點日期：2026-11-04  
> 專題截止：2026-11-25  
> 範圍：`honglai-v2/public`、`src/app`、`src/components`、`src/data`、`src/app/globals.css` 及實際圖片引用。  
> 本文件只整理圖片需求；未修改網站排版、功能、LOGO、價格、產品資料、placeholder、Supabase 或部署設定。

## 0. 判讀方式與結論摘要

- **【程式碼已確認】**：可直接由目前程式碼、資料欄位或 CSS 讀到的現況。
- **【依版面推估】**：程式碼沒有固定像素，依容器、斷點與顯示比例估算的製作規格。
- **【建議新增或調整】**：圖片製作或未來開發建議，不代表目前網站已實作。
- 圖片位置以「資料槽／畫面槽」計算，不將同一個 Header、Footer 在 15 個動態頁重複計數；動態相關產品區以 3 個畫面槽計。主圖若同時用於卡片、列表與詳情頁，算多個使用位置、但只算 1 個獨立素材。
- **已確認圖片位置：86 個**：LOGO 2、favicon 1、首頁輪播桌機／手機 6、首頁熱門產品 4、B2B／B2C 入口 2、公司形象 1、分類圖示 5、產品列表卡片 15、產品詳情 gallery 45、相關產品卡片 3、企業合作 2。
- **已確認獨立素材：63 個**：既有 LOGO 1、既有 favicon 1、待製作 61。材質樣品照因 `materialSamples` 為空陣列，數量待正式清單確認，未灌入總數。
- **待製作 61 個來源素材分級**：P0 31、P1 20、P2 10。卡片與主圖的衍生裁切檔不另算來源素材；若另輸出實體檔，則每項產品最多多 1 張衍生 WebP。
- `public/honglai-logo.png` 是目前唯一正式品牌圖片，Header 與 Footer 共用；不得重繪、改色或生成替代品。`file.svg`、`globe.svg`、`next.svg`、`vercel.svg`、`window.svg` 未被目前頁面引用，屬 Next.js 範本殘留，不列為製作需求。
- 首頁目前是單一 CSS 拼貼佔位視覺，**沒有輪播元件、輪播狀態、手動切換、自動播放或 reduced-motion 邏輯**。三張輪播屬待開發項目，本輪只先製作圖片規格。

## A. 全站圖片需求總表

| 編號 | 頁面／區塊 | 使用位置數 | 獨立素材數 | 現況 | 建議來源 | 優先級 | 程式碼依據 |
|---|---|---:|---:|---|---|---|---|
| GL-01 | Header／Footer 公司 LOGO | 2 | 1（已存在） | 正式 PNG；非 placeholder | 原檔保留 | 既有 | `src/components/header.tsx:18-26`、`footer.tsx:8`、`globals.css:52,395` |
| GL-02 | favicon | 1 | 1（已存在） | `src/app/favicon.ico` | 原檔保留 | 既有 | `src/app/favicon.ico` |
| HM-BN-01～03 | 首頁主輪播，桌機 | 3 | 3 | 目前僅 1 個 CSS 佔位區，無輪播 | 優先實拍；不足時用明確標示的 AI 示意圖 | P0 | `src/app/page.tsx:20-44`、`globals.css:242-279` |
| HM-BN-M01～M03 | 首頁主輪播，手機 | 3 | 3 | 尚無手機獨立素材欄位 | 與桌機同主題的獨立直幅構圖 | P0 | `globals.css:521-526,537-545` |
| HM-PD-01～04 | 首頁熱門產品卡 | 4 | 0（重用產品主圖） | 目前皆為 CSS placeholder | 實拍產品主圖 | P0 | `src/app/page.tsx:46-55`、`src/data/site.ts:17` |
| HM-AU-01～02 | 首頁 B2B／B2C 入口 | 2 | 2 | 目前只用「企／創」文字圓標 | 實拍或簡潔情境插畫 | P0 | `src/app/page.tsx:59-71`、`globals.css:358-369` |
| HM-CO-01 | 首頁公司簡介 | 1 | 1 | `PlaceholderArtwork` | 工廠／作業／成品環境實拍 | P0 | `src/app/page.tsx:89-98`、`globals.css:381-385` |
| SV-CT-00～04 | 產品分類篩選：全部＋4 類 | 5 | 5 | 目前為「全／冊／企／創／製」文字 | 統一 SVG 圖示 | P0 | `src/data/catalog.ts:52-64`、`services-catalog.tsx:27-34` |
| SV-CD-01～15 | 產品列表卡片 | 15 | 0（重用各產品主圖） | `cardImage:null` | 實拍主圖裁切 | P0/P1 | `src/data/catalog.ts:80-197`、`product-card.tsx:16-21` |
| SV-DT-01～45 | 15 項產品詳情 gallery | 45 | 45 | 全部 `src:null`、`isPlaceholder:true` | 實拍優先；工藝示意可用插畫／標示 AI | P0/P1/P2 | `src/data/catalog.ts:74-78`、`product-gallery.tsx:16-28` |
| SV-RL-01～03 | 詳情頁相關產品卡 | 3 | 0（重用主圖） | 動態選 3 項，仍顯示 placeholder | 重用產品主圖 | P0/P1 | `src/app/services/[slug]/page.tsx:62`、`catalog.ts:206-209` |
| B2B-01 | 企業合作 Hero | 1 | 1 | CSS 皮革封面佔位 | 數位燙金皮革封面實拍 | P0 | `src/app/business/page.tsx:10`、`globals.css:441-445` |
| B2B-02 | 企業合作特色服務 | 1 | 1 | CSS 燙金細節佔位 | 燙金、紋理與邊角細節實拍 | P0 | `src/app/business/page.tsx:11`、`globals.css:451-454` |
| MT-XX | 材質與配件樣品卡 | 待確認 | 待確認 | `materialSamples=[]`；目前不渲染卡片 | 每個正式編號 1 張實拍 | 待清單後分級 | `src/data/material-samples.ts:13-18`、`sample-browser.tsx:12,22` |

### 已檢查但目前不需要獨立圖片的頁面／區塊

| 頁面／區塊 | 現況與判斷 | 程式碼依據 |
|---|---|---|
| 最新消息 | 純文字清單，沒有圖片欄位 | `src/app/page.tsx:75-87`、`src/data/home-news.ts:8-13` |
| 首頁承印流程 | 7 個編號圓標為 HTML/CSS，不是圖片；本期可保留以降低製作量 | `src/app/page.tsx:101-114`、`globals.css:346-350` |
| 所有一般內頁 PageHero | 青綠／米白 CSS 漸層，沒有 Banner 圖片欄位 | `src/components/page-hero.tsx:3-4`、`globals.css:152-154` |
| 合作廠商專區 | 純文字卡與 CTA，沒有圖片槽 | `src/app/partners/page.tsx:6` |
| 樣品冊申請 | PageHero＋文字＋表單，沒有圖片槽 | `src/app/business/sample-request/page.tsx:7` |
| 下單／詢價／估價 | PageHero、表單與提示；沒有產品預覽圖片欄位 | `src/app/order/page.tsx:7-13`、`quote/page.tsx:7-9` |
| FAQ | 分類圖示為 inline SVG；不需要額外圖片檔 | `src/components/faq-browser.tsx:18-73,323` |
| 聯絡我們 | 純文字資訊卡，沒有地圖或店面照欄位 | `src/app/contact/page.tsx:6-8` |
| 關於我們獨立頁 | 目前沒有 `/about` 路由；首頁公司簡介即現有對應內容 | `src/app/page.tsx:89-99` |
| B2C 獨立頁 | 目前沒有獨立 B2C 路由；現有入口導向 `/services` | `src/app/page.tsx:67-70` |
| CSS 背景圖 | 未找到 `background-image` 或 `url(...)` 圖片；現有背景皆為色彩／gradient | `src/app/globals.css` 全檔掃描 |

## B. Banner 尺寸、安全區與輪播規格

### B-1. 首頁三張輪播 Banner（P0）

**【程式碼已確認】** 現有 `.editorial-hero` 桌機為左右兩欄，最小高度 650px；右側 `.hero-photo-panel` 最小高度 650px。900px 以下改為上下排列，圖片區 520px；700px 以下圖片區 430px。現有 HTML 文字在左側，不在圖片內。圖片區目前由 CSS 物件拼成，沒有 `<Image>`、carousel、按鈕、指示點或 autoplay。

**【建議新增或調整】** 三張輪播應採「圖片與 HTML 文字分離」。圖片不要放標題、按鈕、價格、LOGO；可重用既有 HTML 標題區，或未來讓每張 slide 的文字仍由 HTML/CSS 疊加。原始 LOGO 不進行重製。

| 編號／主題 | 桌機原始製作尺寸 | 手機原始製作尺寸 | 生成比例 | 顯示／裁切推估 | 主體位置與文字安全區 | 建議檔名與路徑 |
|---|---|---|---|---|---|---|
| HM-BN-01 品牌形象與專業裝訂加工 | 1920×800 px | 1080×1350 px | 12:5（Gemini 可先用 16:9 再裁）；4:5 | 桌機未來建議容器約 2.4:1；手機約 4:5。`object-fit:cover` 時上下／左右可能裁切 | 桌機主體放右側 45%；左側 35% 保留乾淨；手機主體置中偏下，四邊各留 10%，上方 25% 避免文字／控制點 | `public/images/banners/home-brand-desktop.webp`、`home-brand-mobile.webp` |
| HM-BN-02 B2B 企業合作 | 1920×800 px | 1080×1350 px | 同上 | 同上 | 桌機大量製作、燙金或裝訂作業放右中；左側留空。手機避免把機具／成品貼邊 | `public/images/banners/home-b2b-desktop.webp`、`home-b2b-mobile.webp` |
| HM-BN-03 B2C 個人／創作者 | 1920×800 px | 1080×1350 px | 同上 | 同上 | 桌機作品集、少量客製成品放右中；手機以 1–3 個清楚成品為主，不塞滿背景 | `public/images/banners/home-b2c-desktop.webp`、`home-b2c-mobile.webp` |

共同規格：WebP、sRGB、不透明背景、桌機每張建議 ≤300 KB、手機每張 ≤220 KB；不在圖中嵌字或 LOGO。若只能先做一套，先做 1920×800 並將主體限制在中央 50%，但手機裁切品質不如獨立 4:5 素材，因此正式 P0 仍建議 6 個輸出檔。

輪播未來開發驗收項目（本輪不實作）：

1. 上一張／下一張按鈕、可辨識的 3 個指示點、鍵盤操作與手機左右滑動。
2. 自動播放建議 6–8 秒，不要快於 5 秒；滑鼠移入、鍵盤聚焦、使用者互動時暫停。
3. `prefers-reduced-motion: reduce` 時停用自動播放與滑動動畫，保留手動切換。
4. 首張可優先載入；第 2、3 張延遲載入。桌機／手機用 `<picture>` 或 Next.js `sizes`，避免同時下載兩套大圖。
5. 圖片以 `object-fit: cover` 顯示；各 slide 可個別設定 `object-position`，預設 `center center`。不可把重要主體放在最外側 15%。
6. 三張統一低彩度青綠、米白、棕色與溫暖自然光；圖片本身不重複 HTML 文字。這是視覺建議，不是既有 CSS 固定規格。

### B-2. 現有內頁 Hero／Banner 判定

| 頁面 | 現況 | 圖片需求 |
|---|---|---|
| 服務與產品、材質樣品、樣品冊申請、合作廠商、下單、估價、聯絡 | 共用 `PageHero` CSS 漸層 | 本期不需圖片；若未來改成照片 Banner，另開需求，不列本次 61 張 |
| 企業合作 | 專用雙欄 Hero，右側 CSS 皮革封面佔位 | 需 B2B-01，一張 4:3 實拍；手機可共用同檔，主體置中 |

## C. 商品分類簡易圖示

所有圖示建議統一製作為 **512×512 px、1:1、透明背景 SVG**；同時可輸出 128×128 PNG 作預覽。實際 CSS 圖示框為 48×48 px，手機不變。線條 2.5–3 px（以 48px 顯示稿計）、圓角端點、青綠主線搭配少量棕色，不加入公司 LOGO。

| 編號 | 分類／ID | 對應產品 | 圖示物件建議 | 檔名 |
|---|---|---|---|---|
| SV-CT-00 | 全部產品／`all` | 15 項全部 | 四格產品總覽：書冊、資料夾、桌曆、加工工具的極簡組合 | `public/images/category-icons/all-products.svg` |
| SV-CT-01 | 論文／書冊／`cat-books` | 論文裝訂、彩色膠裝、縫線、車線、蝴蝶書、雙線圈、環裝 | 一本打開或有書脊的書冊 | `public/images/category-icons/books.svg` |
| SV-CT-02 | 工程／企業／`cat-business` | 證書夾、施工本、菜單、工程合約書、螺絲裝、檔案夾、三角桌曆 | 工程圖紙＋資料夾／建築線稿 | `public/images/category-icons/business.svg` |
| SV-CT-03 | 創作／生活／`cat-creative` | 證書夾、菜單、彩色膠裝、縫線、車線、蝴蝶書、螺絲裝、檔案夾、三角桌曆、雙線圈、環裝 | 作品集／色票與小星點 | `public/images/category-icons/creative.svg` |
| SV-CT-04 | 加工服務／`cat-finishing` | 縫線、車線、螺絲裝、雙線圈、環裝、打孔裝冊 | 打孔器／裝訂環與工具輪廓 | `public/images/category-icons/finishing.svg` |

格式與安全區：SVG `viewBox="0 0 512 512"`，內容放在中央 384×384（四邊 64px 安全區），透明背景，單檔建議 ≤20 KB（最佳化後）。五個圖示共用尺寸、線寬與視覺重量；不可將產品照片塞入圓形框。

## D. 15 項產品圖片清單（依 `catalog.ts` 實際順序）

共同欄位現況：每項 `cardImage:null`；gallery 固定有 `main`、`detail`、`usage` 三筆且 `src:null`。因此目前 15 張卡片與 45 張 gallery 都會顯示 CSS 佔位。主圖可同時提供產品列表、首頁熱門產品、相關產品與詳情主圖，不需另拍卡片圖。

| # | 產品（ID／slug） | 卡片＋主圖 | 細節圖 | 材質／加工／使用圖 | 新來源素材 | 重用 | 建議來源／優先級 |
|---:|---|---|---|---|---:|---|---|
| 1 | 論文裝訂 `prd-thesis-binding`／`thesis-binding` | `thesis-binding-main.webp` | `thesis-binding-detail.webp`：書背、燙印或裝訂邊 | `thesis-binding-usage.webp`：封面材質／成冊情境 | 3 | 主圖供卡片 | 實拍；P0 |
| 2 | 證書夾 `prd-certificate-folder`／`certificate-folder` | `certificate-folder-main.webp` | `certificate-folder-detail.webp`：內角、磁扣或封邊 | `certificate-folder-usage.webp`：材質／開闔 | 3 | 同上 | 實拍；P0 |
| 3 | 施工本 `prd-construction-book`／`construction-book` | `construction-book-main.webp` | `construction-book-detail.webp`：厚度、書背、裱貼 | `construction-book-usage.webp`：工程圖冊使用情境 | 3 | 同上 | 實拍；P0 |
| 4 | 菜單製作 `prd-menu-production`／`menu-production` | `menu-production-main.webp` | `menu-production-detail.webp`：螺絲、護膜或可換頁結構 | `menu-production-usage.webp`：餐桌情境 | 3 | 同上 | 實拍；P0 |
| 5 | 工程合約書 `prd-engineering-contract`／`engineering-contract` | `engineering-contract-main.webp` | `engineering-contract-detail.webp`：封面／裝訂細節 | `engineering-contract-usage.webp`：文件使用情境 | 3 | 同上 | 實拍；P0 |
| 6 | 彩色膠裝 `prd-color-perfect-binding`／`color-perfect-binding` | `color-perfect-binding-main.webp` | `color-perfect-binding-detail.webp`：膠裝書背 | `color-perfect-binding-usage.webp`：紙材／翻頁 | 3 | 同上 | 實拍；main＋detail P1，usage P2 |
| 7 | 縫線裝訂 `prd-sewn-binding`／`sewn-binding` | `sewn-binding-main.webp` | `sewn-binding-detail.webp`：線跡近拍 | `sewn-binding-usage.webp`：結構示意 | 3 | 同上 | 實拍細節優先；P1/P2 |
| 8 | 車線裝訂 `prd-machine-sewn-binding`／`machine-sewn-binding` | `machine-sewn-binding-main.webp` | `machine-sewn-binding-detail.webp`：車線近拍 | `machine-sewn-binding-usage.webp`：加工結構 | 3 | 同上 | 實拍；P1/P2 |
| 9 | 蝴蝶書／蝶冊 `prd-butterfly-book`／`butterfly-book` | `butterfly-book-main.webp` | `butterfly-book-detail.webp`：展開與裱貼 | `butterfly-book-usage.webp`：直裱／厚裱示意 | 3 | 同上 | 實拍；P1/P2 |
| 10 | 螺絲裝訂 `prd-screw-binding`／`screw-binding` | `screw-binding-main.webp` | `screw-binding-detail.webp`：螺絲與孔位 | `screw-binding-usage.webp`：拆換頁示意 | 3 | 同上 | 實拍；P1/P2 |
| 11 | 檔案夾／活頁夾 `prd-file-binder`／`file-binder` | `file-binder-main.webp` | `file-binder-detail.webp`：夾具／內裡 | `file-binder-usage.webp`：開闔使用 | 3 | 同上 | 實拍；P1/P2 |
| 12 | 三角桌曆 `prd-triangle-desk-calendar`／`triangle-desk-calendar` | `triangle-desk-calendar-main.webp` | `triangle-desk-calendar-detail.webp`：底座／線圈 | `triangle-desk-calendar-usage.webp`：桌面情境 | 3 | 同上 | 實拍；P1/P2 |
| 13 | 雙線圈裝訂 `prd-double-loop-binding`／`double-loop-binding` | `double-loop-binding-main.webp` | `double-loop-binding-detail.webp`：雙線圈近拍 | `double-loop-binding-usage.webp`：平攤效果 | 3 | 同上 | 實拍；P1/P2 |
| 14 | 環裝裝訂 `prd-ring-binding`／`ring-binding` | `ring-binding-main.webp` | `ring-binding-detail.webp`：環材與孔位 | `ring-binding-usage.webp`：翻頁效果 | 3 | 同上 | 實拍；P1/P2 |
| 15 | 打孔裝冊 `prd-punch-binding`／`punch-binding` | `punch-binding-main.webp` | `punch-binding-detail.webp`：孔位／邊距 | `punch-binding-usage.webp`：加工步驟示意 | 3 | 同上 | 實拍；P1/P2 |

檔案路徑統一為 `public/images/products/{slug}/{filename}`。不得用其他產品照片替代；尤其縫線／車線、雙線圈／環裝、施工本／工程合約書應能從裝訂結構清楚辨識。若公司尚無實拍，AI 圖只可作「產品概念示意」，頁面須顯示「示意圖，非實際成品」；材質、顏色、孔數、線圈與加工結果不得由 AI 假造為可供應規格。

### 一張高解析主圖能否同時作卡片與詳情主圖？

可以，且本期建議如此做。原始主圖採 1600×1200（4:3），主體放在中央 70%，可直接用同一 WebP 搭配目前的 `object-fit:cover`。詳情容器桌機為約 55vw、最小高 520px；手機最小高 390px，比例會隨容器寬度變動，因此四邊至少留 12% 安全區。若某產品主體太靠邊，再額外輸出 1200×900 的卡片裁切衍生檔；這類衍生檔不算新的拍攝／生成素材。

## E. 圖片製作尺寸、顯示範圍與格式

| 類型 | 建議原始尺寸【依版面推估】 | 實際 CSS／顯示範圍【程式碼已確認】 | 比例 | 裁切／安全區 | 格式／透明 | 大小上限 |
|---|---|---|---|---|---|---|
| 首頁輪播桌機 | 1920×800 | 待輪播實作；現況 Hero 高 ≥650px、右圖區為半頁 | 12:5 | 未來 `cover`；重要內容中央 70%，左 35% 乾淨 | WebP／否 | 300 KB |
| 首頁輪播手機 | 1080×1350 | 待實作；現況圖片區高 520／430px | 4:5 | `cover`；四邊 10%，上方 25% | WebP／否 | 220 KB |
| 產品主圖／卡片 | 1600×1200 | 卡片圖高 215px；首頁 190px、手機 145px；詳情 ≥520px／手機 ≥390px | 4:3 | 現有 `object-fit:cover`，未設定 `object-position`，預設置中；主體中央 70% | WebP／否 | 250 KB |
| 產品細節圖 | 1600×1200 | 同 gallery 容器 | 4:3 | `cover`；細節中心四邊留 10% | WebP／否 | 220 KB |
| 材質／加工／使用圖 | 1600×1200 | 同 gallery 容器 | 4:3 | `cover`；若是步驟插畫，文字不要貼邊 | WebP；插畫可 PNG | 220 KB |
| B2B Hero／特色圖 | 1600×1200 | 桌機最小高 430／410px；Hero 手機 340px | 4:3 | 建議 `cover`；主體中央 70% | WebP／否 | 250 KB |
| B2B／B2C 入口 | 1200×900 | 現有卡片桌機高 ≥185px、手機 ≥160px；尚未有圖片槽 | 4:3 | 若未來做背景圖，保留文字側 45% 空間 | WebP／否 | 180 KB |
| 公司形象 | 1600×1200 | placeholder 高 390px／320px／250px | 4:3 | `cover`；人物與機具不可貼邊 | WebP／否 | 250 KB |
| 分類圖示 | 512×512 | 圖示框 48×48px | 1:1 | 中央 75% | SVG／是 | 20 KB |
| 材質樣品色卡 | 1000×1000 | 尚無正式資料；未來 `.sample-image` 卡片 | 1:1 | 色卡填滿，四邊留 5%；需一致白平衡 | WebP 或 JPG／否 | 180 KB |
| 公司 LOGO | 現有 964×250 | Header 190–245px 寬；Footer ≤290px | 約 3.86:1 | `object-fit:contain`，不裁切 | 現有 PNG／依原檔 | 不重製 |

Gemini 生成比例速查：Banner 草稿可用 16:9（完成後裁成 1920×800）、手機 4:5、產品與情境 4:3、分類圖示 1:1。這些是生成比例，不是網站實際顯示像素。AI 產物仍需人工檢查文字亂碼、錯誤裝訂結構、虛構 LOGO、材質失真與多餘零件。

## F. 檔名與資料夾規範

```text
public/images/
├─ banners/
│  ├─ home-brand-desktop.webp
│  ├─ home-brand-mobile.webp
│  ├─ home-b2b-desktop.webp
│  ├─ home-b2b-mobile.webp
│  ├─ home-b2c-desktop.webp
│  └─ home-b2c-mobile.webp
├─ category-icons/
│  ├─ all-products.svg
│  ├─ books.svg
│  ├─ business.svg
│  ├─ creative.svg
│  └─ finishing.svg
├─ home/
│  ├─ audience-b2b.webp
│  ├─ audience-b2c.webp
│  └─ company-workshop.webp
├─ business/
│  ├─ digital-foil-leather-cover.webp
│  └─ digital-foil-leather-detail.webp
├─ products/{slug}/
│  ├─ {slug}-main.webp
│  ├─ {slug}-detail.webp
│  └─ {slug}-usage.webp
└─ materials/{kind}/
   └─ {official-code}.webp
```

規則：只用小寫英文、數字與連字號；產品資料夾必須等於 `catalog.ts` 的 `slug`；不使用 `final`、`new`、`圖片1` 等不可追蹤名稱。版本更新用 Git，不在正式檔名加日期。若保留原始攝影檔，另放專案外的素材封存區；網站 `public` 只放壓縮後輸出。

## G. P0／P1／P2 製作順序與數量

### P0：31 張／11-25 前必須完成

- 6 張首頁輪播輸出：3 主題 × 桌機／手機。
- 5 個商品分類 SVG。
- 2 張首頁 B2B／B2C 入口。
- 1 張首頁公司形象。
- 2 張企業合作圖。
- 前 5 項主力產品各 3 張，共 15 張：論文裝訂、證書夾、施工本、菜單製作、工程合約書。

### P1：20 張／建議完成

- 其餘 10 項產品的主圖＋細節圖，共 20 張：彩色膠裝至打孔裝冊。
- 這 10 張主圖同時補齊產品列表卡片與相關產品卡片，因此效益最高。

### P2：10 張／有時間再做

- 其餘 10 項產品的材質／加工／使用情境圖，共 10 張。
- 材質樣品照不列入 10 張；收到正式樣品名稱與編號後，以「每編號 1 張」另排優先級。

### 數量核對

| 項目 | 數量 | 說明 |
|---|---:|---|
| 圖片使用位置 | 86 | 以唯一資料／畫面槽計；含 2 個既有品牌檔使用位置與 3 個動態相關產品槽 |
| 獨立素材總數 | 63 | 既有 LOGO＋favicon 2，待製作 61 |
| 待製作獨立素材 | 61 | P0 31＋P1 20＋P2 10 |
| 可重複使用的素材 | 16 | 15 張產品主圖可重用於卡片／詳情；1 個 LOGO 可重用於 Header／Footer |
| 不另製作的重用位置 | 22 | 首頁熱門 4＋列表卡 15＋相關卡 3；均重用產品主圖 |
| 數量待確認 | 材質樣品 N 張 | `materialSamples` 空陣列，不虛構數量 |

若一天只能完成 3–5 張，建議依序：

1. 第 1–2 天：三張桌機 Banner＋三張手機 Banner。
2. 第 3 天：5 個分類圖示（統一風格可批次完成）。
3. 第 4 天：B2B／B2C 入口、公司形象、企業合作 Hero／細節。
4. 第 5–7 天：論文裝訂、證書夾、施工本、菜單、工程合約書；先每項主圖，再補細節與使用圖。
5. 剩餘時間：其餘產品先一項一張主圖，以最快消除列表空白；再補細節，最後補 usage。

## H. 交給 Codex 時如何對應正確位置與產品 ID

每次交付請提供「檔案＋對應表」，不要只說「這些是產品圖」。範例：

```text
檔案：thesis-binding-main.webp
產品 ID：prd-thesis-binding
slug：thesis-binding
用途：cardImage + gallery id thesis-binding-main
真實性：公司實拍
允許裁切：是，主體需保留中央 70%
```

產品圖對應規則：

- `public/images/products/{slug}/{slug}-main.webp` → `cardImage`，也對應 gallery 的 `{slug}-main`。
- `{slug}-detail.webp` → gallery `{slug}-detail`。
- `{slug}-usage.webp` → gallery `{slug}-usage`；若內容其實是材質或加工示意，交付時明確註明，之後再同步調整 label／alt，不能只換圖而保留錯誤說明。
- AI 圖交付時加註「AI 示意」，並說明哪些材質／加工特徵不可視為公司可供應規格。
- 材質樣品必須附公司正式 `code`、`name`、`kind`（`cover` 或 `corner`）與適用產品；沒有正式編號時先不要加入資料檔。
- Banner 請成對交付 desktop／mobile，並註明主體位置。分類圖示一次交付完整 5 個，以免風格不一致。

### 程式碼引用總索引

- 產品與分類資料：`src/data/catalog.ts:3-23,52-78,80-209`
- 產品卡：`src/components/product-card.tsx:16-21`
- 產品 gallery：`src/components/product-gallery.tsx:9-28`
- 首頁：`src/app/page.tsx:20-116`
- 首頁與產品 CSS：`src/app/globals.css:110-134,180-200,242-395,521-600`
- 企業合作：`src/app/business/page.tsx:8-17`、`src/app/globals.css:431-454,497-500`
- 材質樣品：`src/data/material-samples.ts:1-18`、`src/components/sample-browser.tsx:8-22`
- LOGO：`src/components/header.tsx:18-26`、`src/components/footer.tsx:8`

## 最終製作提醒

1. 先向公司索取真實產品與材質照；實拍永遠優先於 AI。
2. AI 圖不得冒充公司案例，不得生成或改造公司 LOGO，不得讓錯誤材質／裝訂結構造成客戶誤認。
3. Banner、情境圖不嵌網站文案；標題、按鈕與說明由 HTML/CSS 疊加，利於手機排版、SEO 與無障礙。
4. 所有照片輸出前統一 sRGB、移除不必要 EXIF、壓縮並在實際桌機／手機容器檢查裁切。
5. 本文件的 1920×800、1600×1200、1080×1350 等是建議製作尺寸；目前程式碼尚未固定這些輸出像素。
