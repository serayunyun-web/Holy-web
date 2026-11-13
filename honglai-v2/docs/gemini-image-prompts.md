# 產品圖 Gemini 生圖提示詞

17 項產品 × 3 張（01 正面全貌／02 裝訂細節／03 翻開內頁）。

## 這一版改了什麼

上一版只靠 Gemini 自己看參考圖。但它對「書」的預設是精裝書，所以生出來的每一項都長得像精裝書，像膠裝就被畫成有硬殼、有飛邊。

這一版的做法：

1. **每項產品的真實結構都寫進提示詞**：裝訂方式、厚度、有沒有硬殼、封面和內頁是否一樣大、書背長什麼樣子，並且寫明「不能有什麼」。例如膠裝寫明：沒有硬殼、沒有飛邊、封面和內頁裁切齊平。
2. **每張圖只能有一本**：不能出現好幾本、多出來的封面或亂擺的紙。
3. **光線和擺放位置全部統一**：主光從左上方來，陰影落在右下，產品放在畫面正中央、約佔寬度的 55～60%，而且要像真的相機拍的照片，不能像 3D 模型圖。
4. **每項產品的構圖都不一樣**：故意選最能看出這種裝訂特色的擺法。例如精裝站立露出圓背、工程施工本側拍強調厚度、騎馬裝露出對摺書背。整排產品圖看起來會有明顯差異。
5. **參考圖只用來理解結構**，不再要求 Gemini 自己分析。結構以提示詞文字為準，Gemini 比較不會亂畫。

## 每個產品的流程

1. 開新對話，依序上傳：圖 1 商標、圖 2 氛圍參考（米白封面那張書冊照）、圖 3 之後是網路上找到的這種裝訂的參考圖（1～4 張）。
2. 第一則訊息：貼「共用開頭」＋該產品的「01」。
3. 滿意之後，接著貼「02」「03」。
4. 對照每項的「重點檢查」。不對的話，用文件最後的「修正用提示詞」。
5. 存檔：照「產品名 01／02／03」命名，放進「專題專用圖」資料夾。

**找參考圖的小提醒**

- 選**看得清楚結構**的圖：書背、裝訂處、翻開的樣子。
- 參考圖的顏色和文字不用管，提示詞已經要求 Gemini 不能照抄。
- 如果某一項還是畫不對，把參考圖傳給我，我再把它的結構寫得更精確。

## 共用開頭（每個產品的第一則訊息都要貼）

```
You generate product photos for a Taiwanese bookbinding studio's website. Each product is a DIFFERENT binding type, and the photos must make those differences obvious. Do not default to a generic hardcover book.

Attached images:
- Image 1 = company logo. Use only its exact SHAPE; the color and finish are given in each request. Never redraw or simplify it.
- Image 2 = mood reference: calm, airy, soft pastel, clean. Copy nothing else from it.
- Image 3 and after = reference photos of this binding type. Use them to understand the STRUCTURE. Never copy their colors, text, logos, background, or props.

The written "Structure" in each request is the source of truth. Follow it exactly, including every "must NOT" item.

Every image:
- EXACTLY ONE product in the frame. Never show multiple copies or a stack of products, extra covers, loose boards, spare pages, or a second product (the pages inside the one product are fine). One single object, neatly placed, nothing scattered.
- Background: plain seamless cream #FAF8F1 studio backdrop, no props.
- Lighting (identical in every image): one large soft key light from the upper LEFT, plus a soft fill from the right. Natural, slightly warm daylight. Covers are NOT overexposed: white areas keep visible paper texture and gentle tonal shading. A soft contact shadow falls toward the lower RIGHT of the product.
- Placement (identical in every image): the single product sits exactly in the CENTER of the frame and fills about 55–60% of the frame width, with equal empty space on the left and right.
- Look: a real camera photograph with a natural lens (about 50–85 mm), shallow depth of field. NOT a 3D render, NOT a flat mockup, NOT isometric.
- Product size: portrait A4 (210 × 297 mm). Photo frame: landscape 3:2.
- No text, letters, or numbers anywhere. Page edges plain unless stated.
- Inner pages: blank or soft abstract gray text blocks / simple line drawings only.
- All images in this conversation show the SAME product.
```

## 17 項產品總覽

| # | 產品 | 裝訂類型 | 01 構圖 |
|---|---|---|---|
| 1 | 論文 | 硬殼精裝 | 平放，從書的底部往下約 30 度 |
| 2 | 證書夾 | 對開夾 | 闔上平放，微俯角露出薄薄的邊 |
| 3 | 工程施工本 | 極厚圖冊硬殼 | 四分之三側視，強調極厚 |
| 4 | 工程合約書 | 硬殼精裝（站立） | 站立，同時看到封面和書背 |
| 5 | 膠裝 | 軟皮膠裝（疊放） | 一本平放，從左前方露出方背與齊平的薄封面 |
| 6 | 精裝 | 圓背精裝（站立） | 站立轉 45 度，露出圓背 |
| 7 | 線平裝 | 軟皮穿線 | 平放，從左上角看到書背底部的台 |
| 8 | 線精裝 | 硬殼穿線（攤平） | 一本闔上平放（攤平留給 03） |
| 9 | 裸背線裝 | 裸背縫線 | 四分之三側視，露出裸背縫線 |
| 10 | 車線平裝 | 薄本車線 | 俯拍，露出左側車線 |
| 11 | 古書線裝 | 和紙穿線 | 俯拍，露出右側穿線 |
| 12 | 騎馬裝 | 對摺騎馬釘 | 一本平放，從左前方露出對摺書背 |
| 13 | 線圈環裝 | 雙線圈 | 平放，從左上看到整排線圈 |
| 14 | 蝴蝶平、精裝 | 厚頁攤平 | 攤平的全景跨頁 |
| 15 | 菜單螺絲裝 | 螺絲固定菜單 | 俯拍，露出左側兩顆螺絲 |
| 16 | Q桿精裝 | 結構待確認 | 平放，從左前方看 |
| 17 | 鎖螺絲合約書 | 螺絲鎖合 | 平放，從左前方看到三顆螺絲 |

---

## 1. 論文 `thesis-binding`｜硬殼精裝

**重點檢查**：硬殼有飛邊、方背、封面靠書背有溝槽、燙金商標是單色金

**01 正面全貌**（跟共用開頭一起貼）
```
Product: 論文.
Structure: case-bound hardcover thesis, about 2–3 cm thick. Rigid boards about 3 mm thick wrapped in leather; the boards extend about 3 mm past the page block on the top, bottom, and fore edge. Flat, square spine wrapped in the same leather. A clear hinge groove runs along the front cover next to the spine. Cream page block, plain edges.
Must NOT: not a softcover, not padded, no clasp or ribbon.
Cover: deep forest green leather (Honglai sample D55, close to #293E38) with a fine natural grain.
Logo: the shape of image 1 as a single-color gold foil stamp (#D4AF37), centered on the upper half of the front cover.
Composition: the book lies flat, front cover up, spine on the LEFT; camera in front of the bottom edge, looking down about 30 degrees, centered, so the cover, the bottom edge of the page block, and the board overhang are visible.
```

**02 裝訂細節**
```
Shot 02 of the same product. Close-up of the bottom-left corner: spine, hinge groove, board overhang, and the inner pages next to the spine. Follow the Structure exactly. Keep the cover and logo identical to shot 01.
```

**03 翻開內頁**
```
Shot 03 of the same product: the SAME single book, simply opened in the middle and lying on its back, like an ordinary open book on a table. The two halves of the open pages face up; the front and back covers lie flat underneath the pages, so only a thin edge of the cover color shows around the pages. The front cover and logo are NOT visible in this shot. No extra covers, panels, flaps, inserts, endpaper sheets, or loose pages — just one open book. The pages open smoothly with a gentle curve at the gutter. Pages: cream, with soft gray abstract text blocks and one simple line chart. Camera in front of the book, looking down about 35 degrees, centered, filling about 55–60% of the frame width. Same lighting as shot 01. Follow the Structure exactly.
```

## 2. 證書夾 `certificate-folder`｜對開夾

**重點檢查**：不是書、沒有內頁、闔上很薄、四角圓、打開是對開卡片

**01 正面全貌**（跟共用開頭一起貼）
```
Product: 證書夾.
Structure: a certificate folder, NOT a book: two rigid padded panels joined by a flexible cloth hinge in the middle, opening like a card. There are no pages at all. Closed it is only about 8–10 mm thick, with softly rounded corners and slightly puffy padded edges.
Must NOT: no page block, no spine with pages, no binding.
Cover: natural cream linen bookcloth (#FAF8F1) with a visible fine weave.
Logo: the shape of image 1 as a single-color gold foil stamp (#D4AF37), small, centered on the front panel.
Composition: the folder lies flat, closed, front panel up, shot from directly above at a slight angle so its thin padded edge is visible on one side.
```

**02 裝訂細節**
```
Shot 02 of the same product. Close-up of the cloth hinge and the thin padded edge of the closed folder. Follow the Structure exactly. Keep the cover and logo identical to shot 01.
```

**03 翻開內頁**
```
Shot 03 of the same product: the SAME single folder opened flat like a card, inside facing up, the two panels side by side. Left panel: plain light sand lining. Right panel: one blank cream certificate held by four clear corner holders, with only a thin gold border and no text. The outside cover and logo are NOT visible. Nothing else in the frame. Camera in front, looking down about 35 degrees, centered. Same lighting as shot 01.
```

## 3. 工程施工本 `construction-book`｜極厚圖冊硬殼

**重點檢查**：極厚接近方盒、書背側看得到摺疊圖紙的摺邊、書背是獨立硬殼且有空隙

**01 正面全貌**（跟共用開頭一起貼）
```
Product: 工程施工本.
Structure: an extremely thick hardcover case for construction drawings, almost box-shaped: the page block is about half to two-thirds as thick as the cover is wide. The pages are many large drawing sheets folded down to A4, so along the spine side you see the stacked folded edges of the sheets, slightly uneven and wavy, with a faint pale-blue tint. The spine is a separate rigid panel of the case with a visible gap between it and the folded edges. A clear hinge groove runs on the front board next to the spine. Small, even board overhang.
Must NOT: it must NOT look like a normal book; no neat uniform page block.
Cover: dark navy-black leather with a smooth, slightly satin surface (Honglai construction-book leather).
Logo: the shape of image 1 as a single-color gold foil stamp (#D4AF37), small, in the lower right corner of the front cover.
Composition: a three-quarter view from the front-left and slightly above, so the front cover, the very thick side, and the spine side with the folded sheet edges are all visible, emphasizing the box-like thickness.
```

**02 裝訂細節**
```
Shot 02 of the same product. Close-up of the spine side: the separate rigid spine panel, the gap, and the stacked folded edges of the drawing sheets. Follow the Structure exactly. Keep the cover and logo identical to shot 01.
```

**03 翻開內頁**
```
Shot 03 of the same product: the SAME single book, simply opened in the middle and lying on its back, like an ordinary open book on a table. The two halves of the open pages face up; the front and back covers lie flat underneath the pages, so only a thin edge of the cover color shows around the pages. The front cover and logo are NOT visible in this shot. No extra covers, panels, flaps, inserts, endpaper sheets, or loose pages — just one open book. The very thick block of folded drawing sheets stays thick on both sides. Pages: generic blue-gray architectural line drawings (abstract plan lines, grid) with no readable text or numbers. Camera in front of the book, looking down about 35 degrees, centered, filling about 55–60% of the frame width. Same lighting as shot 01. Follow the Structure exactly.
```

## 4. 工程合約書 `engineering-contract`｜硬殼精裝（站立）

**重點檢查**：硬殼、方背、站立時看得到書背

**01 正面全貌**（跟共用開頭一起貼）
```
Product: 工程合約書.
Structure: case-bound hardcover contract, about 3–4 cm thick. Rigid leather-covered boards about 3 mm thick extending about 3 mm past the page block; flat square spine; clear hinge groove on the front cover. Cream page block with plain edges.
Must NOT: not a softcover, no screws, no ring binding.
Cover: deep chocolate brown leather (Honglai sample C20) with a soft natural grain.
Logo: the shape of image 1 as a single-color gold foil stamp (#D4AF37), centered on the upper third of the front cover.
Composition: the book stands upright on its bottom edge, slightly turned so both the front cover and the flat spine are visible, camera at eye level, centered.
```

**02 裝訂細節**
```
Shot 02 of the same product. Close-up of the top of the flat spine and the board overhang above the page block. Follow the Structure exactly. Keep the cover and logo identical to shot 01.
```

**03 翻開內頁**
```
Shot 03 of the same product: the SAME single book, simply opened in the middle and lying on its back, like an ordinary open book on a table. The two halves of the open pages face up; the front and back covers lie flat underneath the pages, so only a thin edge of the cover color shows around the pages. The front cover and logo are NOT visible in this shot. No extra covers, panels, flaps, inserts, endpaper sheets, or loose pages — just one open book. The pages open with a gentle curve at the gutter. Pages: cream, with abstract gray paragraph blocks and empty signature lines. Camera in front of the book, looking down about 35 degrees, centered, filling about 55–60% of the frame width. Same lighting as shot 01. Follow the Structure exactly.
```

## 5. 膠裝 `perfect-binding`｜軟皮膠裝（疊放）

**重點檢查**：**沒有硬殼、沒有飛邊、封面和內頁齊平、方背、很薄、翻開會往書背彎**

**01 正面全貌**（跟共用開頭一起貼）
```
Product: 膠裝.
Structure: a perfect-bound softcover: a thin flexible card cover wrapped around a square, flat glued spine; the whole book is only about 8–12 mm thick. The cover is slightly flexible and its corners can curl a little. The pages are glued at the spine, not sewn.
Must NOT: NOT a hardcover: no rigid boards, no cover overhang, no hinge groove, no headband, no rounded spine. The cover is exactly the same size as the pages, trimmed flush on all three open edges.
Cover: matte soft-white card (#FAF8F1) whose lower third has soft organic wave shapes in light teal tints (#CFE3E0, #8FC1BC).
Logo: the shape of image 1 printed in one flat color (Honglai teal #207A75), small, upper center of the cover.
Composition: ONE book lying flat, front cover up, spine on the LEFT, the cover lying flat (not lifted or bent). Camera in front of the book, slightly to the left, looking down about 30 degrees, so the cover, the flat glued spine on the left, and the thin cover flush with the pages along the bottom edge are clearly visible.
```

**02 裝訂細節**
```
Shot 02 of the same product. Close-up of the square, flat glued spine and the bottom edge, showing that the thin cover is flush with the pages. Follow the Structure exactly. Keep the cover and logo identical to shot 01.
```

**03 翻開內頁**
```
Shot 03 of the same product: the SAME single book, simply opened in the middle and lying on its back, like an ordinary open book on a table. The two halves of the open pages face up; the front and back covers lie flat underneath the pages, so only a thin edge of the cover color shows around the pages. The front cover and logo are NOT visible in this shot. No extra covers, panels, flaps, inserts, endpaper sheets, or loose pages — just one open book. Because it is glued, the pages curve strongly toward the spine and do NOT lie flat. Pages: soft abstract text blocks and one light teal color block. Camera in front of the book, looking down about 35 degrees, centered, filling about 55–60% of the frame width. Same lighting as shot 01. Follow the Structure exactly.
```

## 6. 精裝 `hardcover`｜圓背精裝（站立）

**重點檢查**：**圓背**、堵頭布、硬殼有飛邊

**01 正面全貌**（跟共用開頭一起貼）
```
Product: 精裝.
Structure: a classic case-bound hardcover about 2–3 cm thick with a ROUNDED spine (curved outward) and a matching curved fore edge on the page block. Cream headbands at the top and bottom of the spine. Rigid boards about 3 mm thick extending about 3 mm past the pages. Clear hinge grooves.
Must NOT: not flat-spined, not a softcover.
Cover: printed paper wrapped over rigid boards: light sand (#E8DCC6) with large soft organic shapes in warm wood brown (#926A46) at low opacity and one thin dashed flowing line.
Logo: the shape of image 1 printed in one flat color (warm wood brown #926A46), small, upper area of the cover.
Composition: the book stands upright, turned about 45 degrees so the front cover and the rounded spine are both visible, camera slightly above, centered.
```

**02 裝訂細節**
```
Shot 02 of the same product. Close-up of the top of the rounded spine: the headband, the curved spine, and the board overhang. Follow the Structure exactly. Keep the cover and logo identical to shot 01.
```

**03 翻開內頁**
```
Shot 03 of the same product: the SAME single book, simply opened in the middle and lying on its back, like an ordinary open book on a table. The two halves of the open pages face up; the front and back covers lie flat underneath the pages, so only a thin edge of the cover color shows around the pages. The front cover and logo are NOT visible in this shot. No extra covers, panels, flaps, inserts, endpaper sheets, or loose pages — just one open book. The pages open with a gentle curve at the gutter. Pages: cream, with abstract gray text blocks. Camera in front of the book, looking down about 35 degrees, centered, filling about 55–60% of the frame width. Same lighting as shot 01. Follow the Structure exactly.
```

## 7. 線平裝 `sewn-softcover`｜軟皮穿線

**重點檢查**：**軟封面、沒有飛邊**、書背底部看得到一台一台、可以攤平

**01 正面全貌**（跟共用開頭一起貼）
```
Product: 線平裝.
Structure: a thread-sewn softcover about 10–15 mm thick: the pages are folded signatures sewn together with thread, then wrapped in a thin flexible card cover glued at a flat spine. At the top and bottom of the spine you can see the separate folded signatures stacked side by side. It opens much flatter than a glued book.
Must NOT: NOT a hardcover: no rigid boards, no cover overhang, no hinge groove, no headband, no rounded spine. The cover is exactly the same size as the pages, trimmed flush on all three open edges.
Cover: textured cream paper (#FAF8F1) soft cover with a hand-drawn line illustration of two small birds in warm wood brown (#926A46) joined by a dashed flowing flight line.
Logo: the shape of image 1 printed in one flat color (warm wood brown #926A46), small, bottom center of the cover.
Composition: the book lies flat, front cover up, camera from the top-left corner at about 35 degrees so the cover and the bottom of the spine with the stacked signature folds are visible.
```

**02 裝訂細節**
```
Shot 02 of the same product. Close-up of the bottom of the spine, showing the stacked folded signatures and the sewing thread between them. Follow the Structure exactly. Keep the cover and logo identical to shot 01.
```

**03 翻開內頁**
```
Shot 03 of the same product: the SAME single book, simply opened in the middle and lying on its back, like an ordinary open book on a table. The two halves of the open pages face up; the front and back covers lie flat underneath the pages, so only a thin edge of the cover color shows around the pages. The front cover and logo are NOT visible in this shot. No extra covers, panels, flaps, inserts, endpaper sheets, or loose pages — just one open book. Because it is sewn, it lies almost completely flat, and the sewing thread is visible in the center fold. Pages: blank cream. Camera in front of the book, looking down about 35 degrees, centered, filling about 55–60% of the frame width. Same lighting as shot 01. Follow the Structure exactly.
```

## 8. 線精裝 `sewn-hardcover`｜硬殼穿線（攤平）

**重點檢查**：硬殼、**攤平時看得到中縫縫線**

**01 正面全貌**（跟共用開頭一起貼）
```
Product: 線精裝.
Structure: a thread-sewn hardcover: folded signatures sewn with thread inside a rigid cloth-covered case about 3 mm thick, flat spine, boards extending about 3 mm past the pages, cream headbands. Its key feature is that it lies completely flat when opened.
Must NOT: not a softcover.
Cover: Honglai teal bookcloth (#207A75) with a visible fine weave.
Logo: the shape of image 1 as a single-color gold foil stamp (#D4AF37), centered on the front cover.
Composition: ONE closed book lying flat, front cover up, spine on the LEFT; camera in front of the bottom edge, slightly to the left, looking down about 30 degrees, so the teal cloth cover, the board overhang, and the bottom of the sewn page block are visible.
```

**02 裝訂細節**
```
Shot 02 of the same product. Close-up of the top of the spine: headband, sewn signatures, and board overhang. Follow the Structure exactly. Keep the cover and logo identical to shot 01.
```

**03 翻開內頁**
```
Shot 03 of the same product: the SAME single book, simply opened in the middle and lying on its back, like an ordinary open book on a table. The two halves of the open pages face up; the front and back covers lie flat underneath the pages, so only a thin edge of the cover color shows around the pages. The front cover and logo are NOT visible in this shot. No extra covers, panels, flaps, inserts, endpaper sheets, or loose pages — just one open book. Because it is sewn, it lies completely flat on its own, and the sewing thread is visible in the center fold. Pages: cream with soft abstract text blocks. Camera in front of the book, looking down about 35 degrees, centered, filling about 55–60% of the frame width. Same lighting as shot 01. Follow the Structure exactly.
```

## 9. 裸背線裝 `exposed-spine-sewn`｜裸背縫線

**重點檢查**：**沒有書背封皮**、縫線完全露出、前後是兩片灰紙板

**01 正面全貌**（跟共用開頭一起貼）
```
Product: 裸背線裝.
Structure: an exposed-spine book: there is NO spine cover at all. Two separate gray-board covers (about 1.5 mm thick) sit on the front and back, flush with the pages. The spine shows the folded signatures and the sewing thread loops completely bare, like a row of stitched paper folds. Signature edges show layers of cream, light teal, warm brown, and gold-yellow paper. It opens completely flat.
Must NOT: no spine cover, no wrapped case, no rounded spine, no headband.
Cover: plain kraft gray-board front and back covers with a loose hand-drawn line of a bird and a dashed flight path screen-printed in Honglai teal (#207A75).
Logo: the shape of image 1 printed in one flat color (Honglai teal #207A75), small, near the bottom of the front cover.
Composition: a three-quarter view from the front-left and slightly above, so the front cover and the bare sewn spine are both clearly visible.
```

**02 裝訂細節**
```
Shot 02 of the same product. Close-up of a macro of the bare spine: folded signatures and sewing thread loops. Follow the Structure exactly. Keep the cover and logo identical to shot 01.
```

**03 翻開內頁**
```
Shot 03 of the same product: the SAME single book, simply opened in the middle and lying on its back, like an ordinary open book on a table. The two halves of the open pages face up; the front and back covers lie flat underneath the pages, so only a thin edge of the cover color shows around the pages. The front cover and logo are NOT visible in this shot. No extra covers, panels, flaps, inserts, endpaper sheets, or loose pages — just one open book. It lies completely flat on its own, with the sewing thread visible in the center fold. Pages: one gold-yellow (#D4AF37) page on the left, a cream page with a simple line illustration on the right. Camera in front of the book, looking down about 35 degrees, centered, filling about 55–60% of the frame width. Same lighting as shot 01. Follow the Structure exactly.
```

## 10. 車線平裝 `machine-sewn-binding`｜薄本車線

**重點檢查**：**很薄、沒有書背厚度**、左側一排車線

**01 正面全貌**（跟共用開頭一起貼）
```
Product: 車線平裝.
Structure: a thin booklet only about 3–6 mm thick: a stack of flat sheets and a soft paper cover sewn together by ONE straight row of sewing-machine stitches running top to bottom about 8 mm in from the left edge, through the cover and all pages. The stitches are clearly visible on the front cover. There is no spine width — the left edge is just the flat stacked edges.
Must NOT: NOT a hardcover: no rigid boards, no cover overhang, no hinge groove, no headband, no rounded spine. The cover is exactly the same size as the pages, trimmed flush on all three open edges; no glued spine, no staples.
Cover: pale warm-gray paper soft cover; the stitching thread is gold-yellow (#D4AF37).
Logo: the shape of image 1 printed in one flat color (deep forest green #293E38), small, on the cover.
Composition: the booklet lies flat, shot from directly above at a slight angle, the row of gold-yellow machine stitches along the left edge clearly visible.
```

**02 裝訂細節**
```
Shot 02 of the same product. Close-up of a macro of the row of machine stitches through the cover near the left edge. Follow the Structure exactly. Keep the cover and logo identical to shot 01.
```

**03 翻開內頁**
```
Shot 03 of the same product: the SAME single book, simply opened in the middle and lying on its back, like an ordinary open book on a table. The two halves of the open pages face up; the front and back covers lie flat underneath the pages, so only a thin edge of the cover color shows around the pages. The front cover and logo are NOT visible in this shot. No extra covers, panels, flaps, inserts, endpaper sheets, or loose pages — just one open book. The pages only open partly because of the stitch line along the inner margin, which is visible. Pages: cream with abstract gray text blocks. Camera in front of the book, looking down about 35 degrees, centered, filling about 55–60% of the frame width. Same lighting as shot 01. Follow the Structure exactly.
```

## 11. 古書線裝 `traditional-thread-binding`｜和紙穿線

**重點檢查**：**右側四孔穿線**、軟和紙封面

**01 正面全貌**（跟共用開頭一起貼）
```
Product: 古書線裝.
Structure: a traditional East Asian stab-bound book about 1 cm thick: soft washi cover flush with the pages; four holes along the RIGHT edge with silk thread passing through the holes and wrapping around the right edge in a regular pattern; pages are single sheets folded at the fore edge (double-layer pages).
Must NOT: NOT a hardcover: no rigid boards, no cover overhang, no hinge groove, no headband, no rounded spine. The cover is exactly the same size as the pages, trimmed flush on all three open edges; no glued spine.
Cover: soft beige washi paper cover with visible fibers, a narrow warm wood brown (#926A46) title slip, and warm brown silk thread.
Logo: the shape of image 1 printed in one flat color (cream on the brown title slip), small, on the title slip; no other text.
Composition: the book lies flat, shot from directly above at a slight angle, with the thread binding on the right edge clearly visible.
```

**02 裝訂細節**
```
Shot 02 of the same product. Close-up of the right binding edge: the four stitch holes and the silk thread wrapping around the edge. Follow the Structure exactly. Keep the cover and logo identical to shot 01.
```

**03 翻開內頁**
```
Shot 03 of the same product: the SAME single book, simply opened in the middle and lying on its back, like an ordinary open book on a table. The two halves of the open pages face up; the front and back covers lie flat underneath the pages, so only a thin edge of the cover color shows around the pages. The front cover and logo are NOT visible in this shot. No extra covers, panels, flaps, inserts, endpaper sheets, or loose pages — just one open book. The soft double-layer pages open gently; the side thread binding is visible. Pages: blank cream with a faint vertical grid, no characters. Camera in front of the book, looking down about 35 degrees, centered, filling about 55–60% of the frame width. Same lighting as shot 01. Follow the Structure exactly.
```

## 12. 騎馬裝 `saddle-stitch`｜對摺騎馬釘

**重點檢查**：**對摺、很薄、兩根釘書針、沒有方背**

**01 正面全貌**（跟共用開頭一起貼）
```
Product: 騎馬裝.
Structure: a thin saddle-stitched booklet only about 2–4 mm thick: a few sheets folded in half and fastened with two metal staples through the fold. The spine is just the folded edge — rounded and thin, with no flat spine. The cover is the same paper weight as a magazine cover.
Must NOT: NOT a hardcover: no rigid boards, no cover overhang, no hinge groove, no headband, no rounded spine. The cover is exactly the same size as the pages, trimmed flush on all three open edges; no flat spine, no glue.
Cover: smooth white coated paper with two or three large rounded light teal (#CFE3E0, #8FC1BC) color blocks overlapping at the top like soft hills.
Logo: the shape of image 1 printed in one flat color (Honglai teal #207A75), small, on the cover.
Composition: ONE booklet lying flat, front cover up, folded spine on the LEFT, slightly turned; camera from the front-left looking down about 35 degrees, so the cover and the thin folded spine are visible.
```

**02 裝訂細節**
```
Shot 02 of the same product. Close-up of the folded spine with the two staples. Follow the Structure exactly. Keep the cover and logo identical to shot 01.
```

**03 翻開內頁**
```
Shot 03 of the same product: the SAME single book, simply opened in the middle and lying on its back, like an ordinary open book on a table. The two halves of the open pages face up; the front and back covers lie flat underneath the pages, so only a thin edge of the cover color shows around the pages. The front cover and logo are NOT visible in this shot. No extra covers, panels, flaps, inserts, endpaper sheets, or loose pages — just one open book. Opened to the exact center spread, lying flat; the two staples are visible in the center fold. Pages: light teal color blocks and gray text blocks. Camera in front of the book, looking down about 35 degrees, centered, filling about 55–60% of the frame width. Same lighting as shot 01. Follow the Structure exactly.
```

## 13. 線圈環裝 `ring-binding`｜雙線圈

**重點檢查**：**沒有書背、整排雙線圈、方孔**

**01 正面全貌**（跟共用開頭一起貼）
```
Product: 線圈環裝.
Structure: a wire-o bound book: loose sheets and card covers punched with a row of small square holes along the LEFT edge and held by a double-loop metal wire running the full height. There is NO spine — the wire loops are the spine. About 1 cm of pages.
Must NOT: NOT a hardcover: no rigid boards, no cover overhang, no hinge groove, no headband, no rounded spine. The cover is exactly the same size as the pages, trimmed flush on all three open edges; no glued spine.
Cover: light sand (#E8DCC6) card cover with one thin dashed flowing line in warm brown; the binding wire is antique bronze.
Logo: the shape of image 1 printed in one flat color (warm wood brown #926A46), small, on the cover.
Composition: the book lies flat, shot from the top-left at about 35 degrees so the cover and the full row of double wire loops are clearly visible.
```

**02 裝訂細節**
```
Shot 02 of the same product. Close-up of a macro of the double wire loops passing through the square holes. Follow the Structure exactly. Keep the cover and logo identical to shot 01.
```

**03 翻開內頁**
```
Shot 03 of the same product: the SAME single book opened and folded back 360 degrees around the wire, so one page lies flat on top and the front cover is hidden underneath. The page shows a simple abstract layout and a small light teal block. The wire loops are visible along the left edge. Nothing else in the frame. Camera in front, looking down about 35 degrees, centered. Same lighting as shot 01.
```

## 14. 蝴蝶平、精裝 `butterfly-book`｜厚頁攤平

**重點檢查**：**內頁是厚硬卡、攤開沒有中縫**

**01 正面全貌**（跟共用開頭一起貼）
```
Product: 蝴蝶平、精裝.
Structure: a lay-flat photo book: each page is a thick rigid board made of two sheets mounted back to back, about 1 mm thick each, so the page block looks like a stack of cards. The pages are joined at the gutter so every spread opens completely flat with no curve and almost no visible gutter.
Must NOT: no thin flexible pages, no curved pages at the gutter.
Cover: soft-white printed hardcover with layered pastel light teal wave shapes and a touch of Honglai teal at the bottom.
Logo: the shape of image 1 printed in one flat color (Honglai teal #207A75), small, upper area of the cover.
Composition: the book lies open and completely flat on a panoramic spread, shot from above at about 30 degrees, the thick rigid page edges visible at the side.
```

**02 裝訂細節**
```
Shot 02 of the same product. Close-up of the fore edge of the closed book, showing the stack of thick rigid mounted pages. Follow the Structure exactly. Keep the cover and logo identical to shot 01.
```

**03 翻開內頁**
```
Shot 03 of the same product: the SAME single book, simply opened in the middle and lying on its back, like an ordinary open book on a table. The two halves of the open pages face up; the front and back covers lie flat underneath the pages, so only a thin edge of the cover color shows around the pages. The front cover and logo are NOT visible in this shot. No extra covers, panels, flaps, inserts, endpaper sheets, or loose pages — just one open book. The thick rigid pages lie completely flat with almost no gutter. Pages: one continuous abstract landscape illustration in light teal, cream, and sand flowing across both pages. Camera in front of the book, looking down about 35 degrees, centered, filling about 55–60% of the frame width. Same lighting as shot 01. Follow the Structure exactly.
```

## 15. 菜單螺絲裝 `menu-production`｜螺絲固定菜單

**重點檢查**：**左側兩顆螺絲、沒有書背**、內頁護貝

**01 正面全貌**（跟共用開頭一起貼）
```
Product: 菜單螺絲裝.
Structure: a screw-bound restaurant menu: a thick rigid cover (about 2 mm) and several laminated loose sheets held together by two brass Chicago screws through holes near the LEFT edge. The screw heads are visible on the front cover. There is no spine — the left edge is the flat stack of cover and sheets.
Must NOT: no glued spine, no wrapped case, no rounded spine, no headband.
Cover: thick warm wood brown (#926A46) textured card cover; the screws are brass.
Logo: the shape of image 1 as a single-color gold foil stamp (#D4AF37), centered on the front cover.
Composition: the menu lies flat, shot from directly above at a slight angle, with the two brass screw heads near the left edge clearly visible.
```

**02 裝訂細節**
```
Shot 02 of the same product. Close-up of a macro of the brass screws through the cover and the stack of laminated sheets. Follow the Structure exactly. Keep the cover and logo identical to shot 01.
```

**03 翻開內頁**
```
Shot 03 of the same product: the SAME single book, simply opened in the middle and lying on its back, like an ordinary open book on a table. The two halves of the open pages face up; the front and back covers lie flat underneath the pages, so only a thin edge of the cover color shows around the pages. The front cover and logo are NOT visible in this shot. No extra covers, panels, flaps, inserts, endpaper sheets, or loose pages — just one open book. Opened flat at the screws on the left; the laminated sheets lie flat. Pages: a generic menu layout of abstract gray lines and small warm brown dividers, no readable words or prices. Camera in front of the book, looking down about 35 degrees, centered, filling about 55–60% of the frame width. Same lighting as shot 01. Follow the Structure exactly.
```

## 16. Q桿精裝 `q-rod-hardcover`｜結構待確認

> Q桿精裝的實際結構還沒確認，下面的結構描述是暫定的。請傳一張參考圖給我，我再改準確。

**重點檢查**：結構還沒確認，先看整體是否像活頁硬殼

**01 正面全貌**（跟共用開頭一起貼）
```
Product: Q桿精裝.
Structure: a hardcover binder: rigid cloth-covered boards with a flat spine; inside, a slim metal rod along the spine clamps a stack of loose sheets so pages can be added or removed.
Must NOT: not a sewn or glued book.
Cover: cream bookcloth (#FAF8F1) with a deep forest green (#293E38) cloth strip on the spine side.
Logo: the shape of image 1 as a single-color gold foil stamp (#D4AF37), centered on the cream area of the front cover.
Composition: the binder lies flat, closed, front cover up, camera from the front-left at about 30 degrees so the cover and the green spine strip are visible.
```

**02 裝訂細節**
```
Shot 02 of the same product. Close-up of the spine area and the metal rod mechanism holding the sheets. Follow the Structure exactly. Keep the cover and logo identical to shot 01.
```

**03 翻開內頁**
```
Shot 03 of the same product: the SAME single book, simply opened in the middle and lying on its back, like an ordinary open book on a table. The two halves of the open pages face up; the front and back covers lie flat underneath the pages, so only a thin edge of the cover color shows around the pages. The front cover and logo are NOT visible in this shot. No extra covers, panels, flaps, inserts, endpaper sheets, or loose pages — just one open book. The metal rod along the spine that clamps the sheets is visible in the center. Pages: abstract gray text blocks. Camera in front of the book, looking down about 35 degrees, centered, filling about 55–60% of the frame width. Same lighting as shot 01. Follow the Structure exactly.
```

## 17. 鎖螺絲合約書 `screw-contract`｜螺絲鎖合

**重點檢查**：**左側三顆螺絲、沒有包書背**、左邊看得到整疊紙

**01 正面全貌**（跟共用開頭一起貼）
```
Product: 鎖螺絲合約書.
Structure: a screw-bound contract about 2–3 cm thick: rigid front and back covers and a stack of loose pages held together by three silver Chicago screws in a vertical row near the LEFT edge, passing through the front cover, all pages, and the back cover. The screw heads sit on the green band. There is no wrapped spine — the left edge shows the flat stack.
Must NOT: no glued spine, no wrapped case, no rounded spine, no headband.
Cover: rigid warm light-gray card cover with a vertical deep forest green (#293E38) band along the left edge; the screws are silver.
Logo: the shape of image 1 printed in one flat color (deep forest green #293E38), small, upper right of the cover.
Composition: the contract lies flat, shot from the front-left at about 30 degrees so the three screw heads and the stacked left edge are visible.
```

**02 裝訂細節**
```
Shot 02 of the same product. Close-up of a macro of the three screws passing through the front cover, the page stack, and the back cover. Follow the Structure exactly. Keep the cover and logo identical to shot 01.
```

**03 翻開內頁**
```
Shot 03 of the same product: the SAME single book, simply opened in the middle and lying on its back, like an ordinary open book on a table. The two halves of the open pages face up; the front and back covers lie flat underneath the pages, so only a thin edge of the cover color shows around the pages. The front cover and logo are NOT visible in this shot. No extra covers, panels, flaps, inserts, endpaper sheets, or loose pages — just one open book. The screw posts are visible along the inner left margin, and the pages stay fixed there. Pages: abstract gray paragraph blocks and empty signature lines. Camera in front of the book, looking down about 35 degrees, centered, filling about 55–60% of the frame width. Same lighting as shot 01. Follow the Structure exactly.
```

---

## 修正用提示詞

在**同一個對話裡**貼對應的修正句，只改錯的地方。方括號裡的內容換成實際狀況。

**又畫成精裝書了（軟皮類最常見）**
```
This is wrong: you drew a hardcover. This product has NO rigid boards and NO cover overhang. The cover is a thin flexible card exactly the same size as the pages, trimmed flush on all edges. Regenerate following the Structure exactly. Keep the colors, logo, and background.
```

**結構某個地方不對**
```
The [位置，例如 spine] is wrong. It must be: [正確樣子，例如 a flat square glued spine about 10 mm thick]. Look at image [編號] for how it is built. Keep everything else the same.
```

**出現好幾本或多出東西**
```
Show exactly ONE product. Remove every extra copy, cover, board, loose page, and object. Keep this one product centered, with the same lighting and design.
```

**光線或位置跟其他產品不一致**
```
The lighting and placement do not match the rest of the series. Use one large soft key light from the upper LEFT and a soft fill from the right, natural slightly warm daylight, no overexposed white areas, soft contact shadow toward the lower RIGHT. Put the product exactly in the center, filling about 55–60% of the frame width. It must look like a real camera photograph, not a 3D render or isometric mockup. Keep the product, cover, and logo the same.
```

**構圖不對**
```
Use this composition instead: [貼上該產品 01 的 Composition 那一句]. Keep the product the same.
```

**商標變彩色或變形**
```
Fix the logo: use the exact shape of image 1, in [single-color gold foil / one flat color: 顏色], same size and position. Change nothing else.
```

**冒出文字或其他標誌**
```
Remove every letter, word, number, and any logo other than the image 1 logo. Change nothing else.
```

**三張不像同一本**
```
This must be the exact same product as shot 01 in this conversation: same structure, cover, logo position, and size. Regenerate to match it.
```

**背景有道具或顏色不對**
```
Remove all props. The background must be a plain seamless cream #FAF8F1 studio backdrop with a soft natural shadow. Keep the product exactly the same.
```
