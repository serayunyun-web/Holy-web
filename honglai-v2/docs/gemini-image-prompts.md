# 產品圖 Gemini 生圖提示詞

17 項產品 × 3 張（01 正面全貌／02 裝訂細節／03 翻開內頁）。

## 這一版改了什麼

1. **場景完全沿用上一版**：背景、光線、擺放位置、鏡頭的文字一字不改，新圖才會和已經做好的圖放在一起不突兀。
2. **每張圖只有一本**：每一項的構圖都寫明「只有一本、不能疊放」。上一版的膠裝 01 就生成了三本疊在一起。
3. **新增「物理合理性」規則**：書背、封面、書口的位置都寫死，例如書背一定在封面左邊、內頁只能從三個開口邊看到、硬殼的飛邊不會出現在書背那一側。
4. **結構改成鴻萊的實際做法**：
   - 精裝改成**方背**（不做圓背）
   - 車線平裝改成**縫紉機沿書脊中縫車一道線**
   - Q桿精裝改成**前後硬殼，書背換成 Q 桿夾條**
   - 騎馬裝改名**騎馬釘**，古書線裝改名**古書裝訂**（只畫四眼線裝）
5. **03 翻開內頁依裝訂方式分開寫**：螺絲裝、Q 桿、線圈不是像一般書那樣從中間翻開，各自寫了正確的翻開方式。

## 每個產品的流程

1. 開新對話，依序上傳：
   - **圖 1**：商標
   - **圖 2**：風格參考（上一版用的同一張，米白封面那張書冊照）
   - **圖 3～5**：這種裝訂的實際樣子，**最多 3 張**
2. 第一則訊息：貼「共用開頭」＋該產品的「01」。
3. 滿意之後，接著貼「02」「03」。
4. 對照「共用檢查」和該項的「重點檢查」。不對的話，用文件最後的「修正用提示詞」。
5. 存檔：照「產品名 01／02／03」命名，放進「專題專用圖」資料夾。

**找實際樣子參考圖的小提醒**

- 選**看得清楚結構**的圖：書背、裝訂處、翻開的樣子。三張最好各拍一個角度。
- 參考圖的顏色、文字、商標不用管，提示詞已經要求 Gemini 不能照抄。
- 圖上有別家浮水印或品牌字也沒關係，只是給 Gemini 看結構。

## 共用檢查（每張圖都要看）

- [ ] 畫面裡**只有一本**，沒有疊放、沒有第二本、沒有散落的紙或道具
- [ ] 背景、光線、位置和其他產品圖一樣
- [ ] 書背在正確的位置（除了古書，都在封面**左邊**），書口在右邊
- [ ] 商標只出現在封面正面，沒有跑到封底、書背或內頁
- [ ] 內頁只從上、下、右三個開口邊看得到，書背那一側看不到紙張（裸背線裝、線圈、螺絲、Q 桿除外）
- [ ] 硬殼的飛邊只在上、下、右三邊，書背那一側沒有
- [ ] 沒有不合理的地方：沒有兩條書背、紙沒有穿過封面、各邊厚度一致、線條平直
- [ ] 沒有文字、數字或其他商標

## 共用開頭（每個產品的第一則訊息都要貼）

```
You generate product photos for a Taiwanese bookbinding studio's website. Each product is a DIFFERENT binding type, and the photos must make those differences obvious. Do not default to a generic hardcover book.

Attached images:
- Image 1 = company logo. Use only its exact SHAPE; the color and finish are given in each request. Never redraw or simplify it.
- Image 2 = mood reference: calm, airy, soft pastel, clean. Copy nothing else from it.
- Images 3 to 5 = reference photos of this binding type. Use them only to understand the STRUCTURE. Never copy their colors, text, logos, watermarks, background, or props.

The written "Structure" in each request is the source of truth. Follow it exactly, including every "Must NOT" item.

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

Physical correctness (the product must be a real, buildable object):
- The front cover carries the logo. The logo never appears on the back cover, the spine, or the pages.
- Unless the Structure says otherwise, the binding edge (spine) is on the LEFT side of the front cover and the opening edge (fore edge) is on the RIGHT.
- The spine connects the front and back covers along ONE edge only. Never two spines, never a spine on the fore edge, top, or bottom.
- Pages are visible only on the open edges (top, bottom, and fore edge), never on the spine side, unless the Structure says the spine is exposed.
- For hardcovers, the boards extend slightly past the pages on the top, bottom, and fore edge only; never on the spine side.
- Every edge is straight and parallel, the thickness is the same along the whole book, and no part passes through or floats away from another part.
```

## 17 項產品總覽

| # | 產品 | 裝訂類型 | 01 構圖 |
|---|---|---|---|
| 1 | 論文 | 方背硬殼精裝 | 平放，從書的底部往下約 30 度 |
| 2 | 證書夾 | 對開夾 | 闔上平放，微俯角露出薄薄的邊 |
| 3 | 工程施工本 | 極厚摺圖硬殼冊 | 四分之三側視，強調極厚 |
| 4 | 工程合約書 | 方背硬殼精裝（站立） | 站立，同時看到封面和書背 |
| 5 | 膠裝 | 軟皮膠裝 | 一本平放，從左前方露出方背與齊平的薄封面 |
| 6 | 精裝 | 方背硬殼精裝（站立） | 站立轉 45 度，露出方背 |
| 7 | 線平裝 | 軟皮穿線 | 平放，從左上角看到書背底部的台 |
| 8 | 線精裝 | 方背硬殼穿線 | 一本闔上平放（攤平留給 03） |
| 9 | 裸背線裝 | 裸背縫線 | 四分之三側視，露出裸背縫線 |
| 10 | 車線平裝 | 中縫車線 | 平放，從左前方露出書脊的車線 |
| 11 | 古書裝訂 | 四眼線裝 | 俯拍，露出右側穿線 |
| 12 | 騎馬釘 | 對摺騎馬釘 | 一本平放，從左前方露出對摺書背 |
| 13 | 線圈環裝 | 雙線圈 | 平放，從左上看到整排線圈 |
| 14 | 蝴蝶平、精裝 | 厚頁攤平 | 攤平的全景跨頁 |
| 15 | 菜單螺絲裝 | 螺絲固定菜單 | 俯拍，露出左側兩顆螺絲 |
| 16 | Q桿精裝 | 硬殼＋Q 桿書背 | 平放，從左前方看到 Q 桿 |
| 17 | 鎖螺絲合約書 | 螺絲鎖合 | 平放，從左前方看到三顆螺絲 |

---

## 1. 論文 `thesis-binding`｜方背硬殼精裝

**重點檢查**：硬殼有飛邊、**方背**、封面靠書背有溝槽、燙金商標是單色金

**01 正面全貌**（跟共用開頭一起貼）
```
Product: 論文.
Structure: case-bound hardcover thesis, about 2–3 cm thick. Rigid boards about 3 mm thick wrapped in leather; the boards extend about 3 mm past the page block on the top, bottom, and fore edge. Flat, square spine wrapped in the same leather. A clear hinge groove runs along the front cover next to the spine. Cream page block, plain edges.
Must NOT: not a softcover, not padded, no rounded spine, no clasp or ribbon.
Cover: deep forest green leather (Honglai sample D55, close to #293E38) with a fine natural grain.
Logo: the shape of image 1 as a single-color gold foil stamp (#D4AF37), centered on the upper half of the front cover.
Composition: ONE book only, never stacked. It lies flat, front cover up, spine on the LEFT; camera in front of the bottom edge, looking down about 30 degrees, centered, so the cover, the bottom edge of the page block, and the board overhang are visible.
```

**02 裝訂細節**
```
Shot 02 of the same product. Close-up of the bottom-left corner: the flat square spine, hinge groove, board overhang, and the bottom edge of the page block. Follow the Structure exactly. Keep the cover and logo identical to shot 01.
```

**03 翻開內頁**
```
Shot 03 of the same product: the SAME single book, simply opened in the middle and lying on its back, like an ordinary open book on a table. The two halves of the open pages face up; the front and back covers lie flat underneath the pages, so only a thin edge of the cover color shows around the pages. The front cover and logo are NOT visible in this shot. No extra covers, panels, flaps, inserts, endpaper sheets, or loose pages — just one open book. The pages open with a gentle curve at the gutter. Pages: cream, with soft gray abstract text blocks and one simple line chart. Camera in front of the book, looking down about 35 degrees, centered, filling about 55–60% of the frame width. Same lighting as shot 01. Follow the Structure exactly.
```

## 2. 證書夾 `certificate-folder`｜對開夾

**重點檢查**：不是書、沒有內頁、闔上很薄、四角圓、打開是對開卡片

**01 正面全貌**（跟共用開頭一起貼）
```
Product: 證書夾.
Structure: a certificate folder, NOT a book: two rigid padded panels joined by a flexible cloth hinge on the LEFT, opening like a card. There are no pages at all. Closed it is only about 8–10 mm thick, with softly rounded corners and slightly puffy padded edges.
Must NOT: no page block, no spine with pages, no binding, no visible paper edges.
Cover: natural cream linen bookcloth (#FAF8F1) with a visible fine weave.
Logo: the shape of image 1 as a single-color gold foil stamp (#D4AF37), small, centered on the front panel.
Composition: ONE folder only, never stacked. It lies flat, closed, front panel up, hinge on the LEFT, shot from directly above at a slight angle so its thin padded edge is visible on one side.
```

**02 裝訂細節**
```
Shot 02 of the same product. Close-up of the cloth hinge on the left and the thin padded edge of the closed folder. Follow the Structure exactly. Keep the cover and logo identical to shot 01.
```

**03 翻開內頁**
```
Shot 03 of the same product: the SAME single folder opened flat like a card, inside facing up, the two panels side by side joined by the cloth hinge in the middle. Left panel: plain light sand lining. Right panel: one blank cream certificate held by four clear corner holders, with only a thin gold border and no text. The outside cover and logo are NOT visible. Nothing else in the frame. Camera in front, looking down about 35 degrees, centered, filling about 55–60% of the frame width. Same lighting as shot 01.
```

## 3. 工程施工本 `construction-book`｜極厚摺圖硬殼冊

**重點檢查**：極厚接近方盒、書口側看得到摺疊圖紙的摺邊、書背是獨立硬殼

**01 正面全貌**（跟共用開頭一起貼）
```
Product: 工程施工本.
Structure: an extremely thick hardcover case for construction drawings, almost box-shaped: the page block is about half to two-thirds as thick as the cover is wide. The pages are large drawing sheets folded down to A4, so along the fore edge (RIGHT side) you see the stacked folded edges of the sheets, slightly uneven and wavy. The spine on the LEFT is a flat rigid panel of the case. A clear hinge groove runs on the front board next to the spine. Small, even board overhang on the top, bottom, and fore edge.
Must NOT: it must NOT look like a normal thin book; no neat uniform page block; no pages visible on the spine side.
Cover: dark navy-black leather with a smooth, slightly satin surface (Honglai construction-book leather).
Logo: the shape of image 1 as a single-color gold foil stamp (#D4AF37), small, in the lower right corner of the front cover.
Composition: ONE book only, never stacked. A three-quarter view from the front-right and slightly above, so the front cover, the very thick fore edge with the folded sheet edges, and the bottom edge are all visible, emphasizing the box-like thickness.
```

**02 裝訂細節**
```
Shot 02 of the same product. Close-up of the fore edge: the stacked folded edges of the drawing sheets inside the rigid case. Follow the Structure exactly. Keep the cover and logo identical to shot 01.
```

**03 翻開內頁**
```
Shot 03 of the same product: the SAME single book, opened in the middle and lying on its back. The front and back covers lie flat underneath; the front cover and logo are NOT visible. On the right half, one large drawing sheet is partly unfolded outward past the fore edge, showing its fold lines, to show how a big drawing folds down to A4. The very thick block of folded sheets stays thick on both sides. No extra covers, inserts, or loose pages. Pages: generic blue-gray architectural line drawings (abstract plan lines, grid) with no readable text or numbers. Camera in front of the book, looking down about 35 degrees, centered, filling about 55–60% of the frame width. Same lighting as shot 01. Follow the Structure exactly.
```

## 4. 工程合約書 `engineering-contract`｜方背硬殼精裝（站立）

**重點檢查**：硬殼、**方背**、站立時看得到書背、飛邊不在書背那一側

**01 正面全貌**（跟共用開頭一起貼）
```
Product: 工程合約書.
Structure: case-bound hardcover contract, about 3–4 cm thick. Rigid leather-covered boards about 3 mm thick extending about 3 mm past the page block on the top, bottom, and fore edge; flat square spine; clear hinge groove on the front cover next to the spine. Cream page block with plain edges.
Must NOT: not a softcover, no rounded spine, no screws, no ring binding.
Cover: deep chocolate brown leather (Honglai sample C20) with a soft natural grain.
Logo: the shape of image 1 as a single-color gold foil stamp (#D4AF37), centered on the upper third of the front cover.
Composition: ONE book only. It stands upright on its bottom edge, turned slightly so both the front cover and the flat spine on its LEFT side are visible, camera at eye level, centered.
```

**02 裝訂細節**
```
Shot 02 of the same product. Close-up of the top of the flat square spine and the board overhang above the page block on the fore edge side. Follow the Structure exactly. Keep the cover and logo identical to shot 01.
```

**03 翻開內頁**
```
Shot 03 of the same product: the SAME single book, simply opened in the middle and lying on its back, like an ordinary open book on a table. The two halves of the open pages face up; the front and back covers lie flat underneath the pages, so only a thin edge of the cover color shows around the pages. The front cover and logo are NOT visible in this shot. No extra covers, panels, flaps, inserts, endpaper sheets, or loose pages — just one open book. The pages open with a gentle curve at the gutter. Pages: cream, with abstract gray paragraph blocks and empty signature lines. Camera in front of the book, looking down about 35 degrees, centered, filling about 55–60% of the frame width. Same lighting as shot 01. Follow the Structure exactly.
```

## 5. 膠裝 `perfect-binding`｜軟皮膠裝

**重點檢查**：**只有一本**、沒有硬殼、沒有飛邊、封面和內頁齊平、方背、很薄、翻開會往書背彎

**01 正面全貌**（跟共用開頭一起貼）
```
Product: 膠裝.
Structure: a perfect-bound softcover: a thin flexible card cover wrapped around a square, flat glued spine on the LEFT; the whole book is only about 8–12 mm thick. The pages are glued at the spine, not sewn.
Must NOT: NOT a hardcover: no rigid boards, no cover overhang, no hinge groove, no headband, no rounded spine. The cover is exactly the same size as the pages, trimmed flush on all three open edges. Never more than one book.
Cover: matte soft-white card (#FAF8F1) whose lower third has soft organic wave shapes in light teal tints (#CFE3E0, #8FC1BC).
Logo: the shape of image 1 printed in one flat color (Honglai teal #207A75), small, upper center of the cover.
Composition: ONE single book only — NOT a stack, NOT two or three books on top of each other. It lies flat, front cover up, spine on the LEFT, the cover lying flat (not lifted or bent). Camera in front of the book, slightly to the left, looking down about 30 degrees, so the cover, the flat glued spine on the left, and the thin cover flush with the pages along the bottom edge are clearly visible.
```

**02 裝訂細節**
```
Shot 02 of the same product. Close-up of the square, flat glued spine and the bottom edge, showing that the thin cover is flush with the pages. Only this one book. Follow the Structure exactly. Keep the cover and logo identical to shot 01.
```

**03 翻開內頁**
```
Shot 03 of the same product: the SAME single book, simply opened in the middle and lying on its back, like an ordinary open book on a table. The two halves of the open pages face up; the thin soft cover lies underneath, flush with the pages, with no overhang. The front cover and logo are NOT visible in this shot. No extra covers, panels, flaps, inserts, endpaper sheets, or loose pages — just one open book. Because it is glued, the pages curve strongly toward the spine and do NOT lie flat. Pages: soft abstract text blocks and one light teal color block. Camera in front of the book, looking down about 35 degrees, centered, filling about 55–60% of the frame width. Same lighting as shot 01. Follow the Structure exactly.
```

## 6. 精裝 `hardcover`｜方背硬殼精裝（站立）

**重點檢查**：**方背（不是圓背）**、硬殼有飛邊、站立看得到書背、內頁沒有從書背那側露出來

**01 正面全貌**（跟共用開頭一起貼）
```
Product: 精裝.
Structure: a classic case-bound hardcover about 2–3 cm thick with a FLAT, SQUARE spine on the LEFT. Rigid boards about 3 mm thick extending about 3 mm past the pages on the top, bottom, and fore edge. A clear hinge groove on the front cover next to the spine. Cream headbands at the top and bottom of the spine.
Must NOT: no rounded spine, no curved fore edge, not a softcover, no dust jacket.
Cover: printed paper wrapped over rigid boards: light sand (#E8DCC6) with large soft organic shapes in warm wood brown (#926A46) at low opacity and one thin dashed flowing line.
Logo: the shape of image 1 printed in one flat color (warm wood brown #926A46), small, upper area of the cover.
Composition: ONE book only. It stands upright, closed, turned about 45 degrees so the front cover and the flat square spine on its LEFT side are both visible; the pages show only at the top edge and fore edge. Camera slightly above, centered.
```

**02 裝訂細節**
```
Shot 02 of the same product. Close-up of the top of the flat square spine: the headband, the square spine corners, the hinge groove, and the board overhang. Follow the Structure exactly. Keep the cover and logo identical to shot 01.
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
Structure: a thread-sewn softcover about 10–15 mm thick: the pages are folded signatures sewn together with thread, then wrapped in a thin flexible card cover glued at a flat spine on the LEFT. At the top and bottom of the spine you can see the separate folded signatures stacked side by side. It opens much flatter than a glued book.
Must NOT: NOT a hardcover: no rigid boards, no cover overhang, no hinge groove, no headband, no rounded spine. The cover is exactly the same size as the pages, trimmed flush on all three open edges.
Cover: textured cream paper (#FAF8F1) soft cover with a hand-drawn line illustration of two small birds in warm wood brown (#926A46) joined by a dashed flowing flight line.
Logo: the shape of image 1 printed in one flat color (warm wood brown #926A46), small, bottom center of the cover.
Composition: ONE book only, never stacked. It lies flat, front cover up, spine on the LEFT; camera from the bottom-left corner at about 35 degrees so the cover and the bottom of the spine with the stacked signature folds are visible.
```

**02 裝訂細節**
```
Shot 02 of the same product. Close-up of the bottom of the spine, showing the stacked folded signatures and the sewing thread between them. Follow the Structure exactly. Keep the cover and logo identical to shot 01.
```

**03 翻開內頁**
```
Shot 03 of the same product: the SAME single book, simply opened in the middle and lying on its back, like an ordinary open book on a table. The two halves of the open pages face up; the thin soft cover lies underneath, flush with the pages, with no overhang. The front cover and logo are NOT visible in this shot. No extra covers, panels, flaps, inserts, endpaper sheets, or loose pages — just one open book. Because it is sewn, it lies almost completely flat, and the sewing thread is visible in the center fold. Pages: blank cream. Camera in front of the book, looking down about 35 degrees, centered, filling about 55–60% of the frame width. Same lighting as shot 01. Follow the Structure exactly.
```

## 8. 線精裝 `sewn-hardcover`｜方背硬殼穿線

**重點檢查**：硬殼、**方背**、**攤平時看得到中縫縫線**

**01 正面全貌**（跟共用開頭一起貼）
```
Product: 線精裝.
Structure: a thread-sewn hardcover: folded signatures sewn with thread inside a rigid cloth-covered case about 3 mm thick, flat square spine on the LEFT, boards extending about 3 mm past the pages on the top, bottom, and fore edge, cream headbands. Its key feature is that it lies completely flat when opened.
Must NOT: not a softcover, no rounded spine.
Cover: Honglai teal bookcloth (#207A75) with a visible fine weave.
Logo: the shape of image 1 as a single-color gold foil stamp (#D4AF37), centered on the front cover.
Composition: ONE closed book only, never stacked. It lies flat, front cover up, spine on the LEFT; camera in front of the bottom edge, slightly to the left, looking down about 30 degrees, so the teal cloth cover, the board overhang, and the bottom of the sewn page block are visible.
```

**02 裝訂細節**
```
Shot 02 of the same product. Close-up of the top of the flat square spine: headband, sewn signatures, and board overhang. Follow the Structure exactly. Keep the cover and logo identical to shot 01.
```

**03 翻開內頁**
```
Shot 03 of the same product: the SAME single book, simply opened in the middle and lying on its back, like an ordinary open book on a table. The two halves of the open pages face up; the front and back covers lie flat underneath the pages, so only a thin edge of the cover color shows around the pages. The front cover and logo are NOT visible in this shot. No extra covers, panels, flaps, inserts, endpaper sheets, or loose pages — just one open book. Because it is sewn, it lies completely flat on its own, and the sewing thread is visible in the center fold. Pages: cream with soft abstract text blocks. Camera in front of the book, looking down about 35 degrees, centered, filling about 55–60% of the frame width. Same lighting as shot 01. Follow the Structure exactly.
```

## 9. 裸背線裝 `exposed-spine-sewn`｜裸背縫線

**重點檢查**：**沒有書背封皮**、縫線完全露出、前後是兩片灰紙板、裸背在左邊

**01 正面全貌**（跟共用開頭一起貼）
```
Product: 裸背線裝.
Structure: an exposed-spine book: there is NO spine cover at all. Two separate gray-board covers (about 1.5 mm thick) sit on the front and back, flush with the pages. The spine on the LEFT shows the folded signatures and the sewing thread loops completely bare, like a row of stitched paper folds. Signature edges show layers of cream, light teal, warm brown, and gold-yellow paper. It opens completely flat.
Must NOT: no spine cover, no wrapped case, no rounded spine, no headband, no cover overhang.
Cover: plain kraft gray-board front and back covers with a loose hand-drawn line of a bird and a dashed flight path screen-printed in Honglai teal (#207A75).
Logo: the shape of image 1 printed in one flat color (Honglai teal #207A75), small, near the bottom of the front cover.
Composition: ONE book only, never stacked. A three-quarter view from the front-left and slightly above, so the front cover and the bare sewn spine on the left are both clearly visible.
```

**02 裝訂細節**
```
Shot 02 of the same product. Close-up of a macro of the bare spine: folded signatures and sewing thread loops. Follow the Structure exactly. Keep the cover and logo identical to shot 01.
```

**03 翻開內頁**
```
Shot 03 of the same product: the SAME single book, simply opened in the middle and lying on its back, like an ordinary open book on a table. The two halves of the open pages face up; the two gray-board covers lie flat underneath, flush with the pages. The front cover and logo are NOT visible in this shot. No extra covers, panels, flaps, inserts, endpaper sheets, or loose pages — just one open book. It lies completely flat on its own, with the sewing thread visible in the center fold. Pages: one gold-yellow (#D4AF37) page on the left, a cream page with a simple line illustration on the right. Camera in front of the book, looking down about 35 degrees, centered, filling about 55–60% of the frame width. Same lighting as shot 01. Follow the Structure exactly.
```

## 10. 車線平裝 `machine-sewn-binding`｜中縫車線

**重點檢查**：**很薄、對摺、沒有書背厚度**、書脊上看得到**一條連續的車縫線**（不是釘書針）

**01 正面全貌**（跟共用開頭一起貼）
```
Product: 車線平裝.
Structure: a thin booklet only about 2–4 mm thick: a few sheets and a soft paper cover folded in half together and sewn through the center fold by ONE continuous straight line of sewing-machine stitches running the full height of the spine. The spine on the LEFT is just the folded edge, and the stitch line is clearly visible along it from top to bottom.
Must NOT: NOT a hardcover: no rigid boards, no cover overhang, no hinge groove, no headband. No flat spine, no glue, NO staples. The cover is exactly the same size as the pages, trimmed flush on all three open edges.
Cover: pale warm-gray paper soft cover; the stitching thread is gold-yellow (#D4AF37).
Logo: the shape of image 1 printed in one flat color (deep forest green #293E38), small, on the cover.
Composition: ONE booklet only, never stacked. It lies flat, front cover up, folded spine on the LEFT, slightly turned; camera from the front-left looking down about 35 degrees, so the cover and the gold-yellow stitch line along the folded spine are visible.
```

**02 裝訂細節**
```
Shot 02 of the same product. Close-up of a macro of the folded spine with the continuous gold-yellow machine stitches running along it. Follow the Structure exactly. Keep the cover and logo identical to shot 01.
```

**03 翻開內頁**
```
Shot 03 of the same product: the SAME single booklet, opened to the exact center spread and lying flat on its back. The continuous gold-yellow stitch line runs down the center fold from top to bottom. The front cover and logo are NOT visible. No extra covers, inserts, or loose pages. Pages: cream with abstract gray text blocks. Camera in front, looking down about 35 degrees, centered, filling about 55–60% of the frame width. Same lighting as shot 01. Follow the Structure exactly.
```

## 11. 古書裝訂 `traditional-thread-binding`｜四眼線裝

**重點檢查**：**右側四孔穿線**（古書是往左翻，裝訂邊在右邊）、軟和紙封面、只有一本、不要畫成經摺裝

**01 正面全貌**（跟共用開頭一起貼）
```
Product: 古書裝訂.
Structure: a traditional East Asian four-hole stab-bound book about 1 cm thick. IMPORTANT: this book is bound on the RIGHT edge (not the left). Soft washi cover flush with the pages; four evenly spaced holes along the RIGHT edge with silk thread passing through the holes and wrapping around the right edge in the classic four-hole pattern; pages are single sheets folded at the LEFT edge (the fore edge), so each page is double-layered.
Must NOT: NOT a hardcover: no rigid boards, no cover overhang, no hinge groove, no headband, no rounded spine, no glued spine, no binding on the left. Not an accordion-folded book.
Cover: soft beige washi paper cover with visible fibers, a narrow warm wood brown (#926A46) title slip near the upper LEFT, and warm brown silk thread.
Logo: the shape of image 1 printed in one flat color (cream on the brown title slip), small, on the title slip; no other text.
Composition: ONE book only, never stacked. It lies flat, shot from directly above at a slight angle, with the thread binding on the right edge clearly visible.
```

**02 裝訂細節**
```
Shot 02 of the same product. Close-up of the right binding edge: the four stitch holes and the silk thread wrapping around the edge. Follow the Structure exactly. Keep the cover and logo identical to shot 01.
```

**03 翻開內頁**
```
Shot 03 of the same product: the SAME single book, opened by turning the cover from LEFT to RIGHT, so the binding with the silk thread is in the center of the spread. The soft double-layer pages open gently and do not lie fully flat. The front cover and logo are NOT visible. No extra covers, inserts, or loose pages. Pages: blank cream with a faint vertical grid, no characters. Camera in front of the book, looking down about 35 degrees, centered, filling about 55–60% of the frame width. Same lighting as shot 01. Follow the Structure exactly.
```

## 12. 騎馬釘 `saddle-stitch`｜對摺騎馬釘

**重點檢查**：**對摺、很薄、兩根釘書針、沒有方背**

**01 正面全貌**（跟共用開頭一起貼）
```
Product: 騎馬釘.
Structure: a thin saddle-stitched booklet only about 2–4 mm thick: a few sheets folded in half and fastened with two metal staples through the fold. The spine on the LEFT is just the folded edge — thin and softly curved, with no flat spine width. The cover is the same paper weight as a magazine cover.
Must NOT: NOT a hardcover: no rigid boards, no cover overhang, no hinge groove, no headband. No flat square spine, no glue, no thread. The cover is exactly the same size as the pages, trimmed flush on all three open edges.
Cover: smooth white coated paper with two or three large rounded light teal (#CFE3E0, #8FC1BC) color blocks overlapping at the top like soft hills.
Logo: the shape of image 1 printed in one flat color (Honglai teal #207A75), small, on the cover.
Composition: ONE booklet only, never stacked. It lies flat, front cover up, folded spine on the LEFT, slightly turned; camera from the front-left looking down about 35 degrees, so the cover and the thin folded spine are visible.
```

**02 裝訂細節**
```
Shot 02 of the same product. Close-up of the folded spine with the two staples. Follow the Structure exactly. Keep the cover and logo identical to shot 01.
```

**03 翻開內頁**
```
Shot 03 of the same product: the SAME single booklet, opened to the exact center spread and lying flat on its back. The two staples are visible in the center fold. The front cover and logo are NOT visible. No extra covers, inserts, or loose pages. Pages: light teal color blocks and gray text blocks. Camera in front, looking down about 35 degrees, centered, filling about 55–60% of the frame width. Same lighting as shot 01. Follow the Structure exactly.
```

## 13. 線圈環裝 `ring-binding`｜雙線圈

**重點檢查**：**沒有書背、整排雙線圈在左邊、方孔**

**01 正面全貌**（跟共用開頭一起貼）
```
Product: 線圈環裝.
Structure: a wire-o bound book: loose sheets and card covers punched with a row of small square holes along the LEFT edge and held by a double-loop metal wire running the full height. There is NO spine — the wire loops are the spine. About 1 cm of pages.
Must NOT: NOT a hardcover: no rigid boards, no cover overhang, no hinge groove, no headband, no glued spine. The cover is exactly the same size as the pages, trimmed flush on all three open edges.
Cover: light sand (#E8DCC6) card cover with one thin dashed flowing line in warm brown; the binding wire is antique bronze.
Logo: the shape of image 1 printed in one flat color (warm wood brown #926A46), small, on the cover.
Composition: ONE book only, never stacked. It lies flat, wire on the LEFT, shot from the top-left at about 35 degrees so the cover and the full row of double wire loops are clearly visible.
```

**02 裝訂細節**
```
Shot 02 of the same product. Close-up of a macro of the double wire loops passing through the square holes. Follow the Structure exactly. Keep the cover and logo identical to shot 01.
```

**03 翻開內頁**
```
Shot 03 of the same product: the SAME single book opened and folded back 360 degrees around the wire, so one page lies flat on top and the front cover is hidden underneath. The page shows a simple abstract layout and a small light teal block. The wire loops are visible along the left edge. Nothing else in the frame. Camera in front, looking down about 35 degrees, centered, filling about 55–60% of the frame width. Same lighting as shot 01.
```

## 14. 蝴蝶平、精裝 `butterfly-book`｜厚頁攤平

**重點檢查**：**內頁是厚硬卡、攤開沒有中縫**、跨頁圖是同一張

**01 正面全貌**（跟共用開頭一起貼）
```
Product: 蝴蝶平、精裝.
Structure: a lay-flat hardcover photo book: each page is a thick rigid board made of two sheets mounted back to back, about 1 mm thick each, so the page block looks like a stack of cards. The pages are joined at the gutter so every spread opens completely flat with no curve and almost no visible gutter. Flat square spine on the LEFT.
Must NOT: no thin flexible pages, no curved pages at the gutter, no rounded spine.
Cover: soft-white printed hardcover with layered pastel light teal wave shapes and a touch of Honglai teal at the bottom.
Logo: the shape of image 1 printed in one flat color (Honglai teal #207A75), small, upper area of the cover.
Composition: ONE book only. It lies open and completely flat on a panoramic spread, shot from above at about 30 degrees, the thick rigid page edges visible at the side. The illustration flows across both pages with no break at the center.
```

**02 裝訂細節**
```
Shot 02 of the same product, now closed. Close-up of the fore edge on the right, showing the stack of thick rigid mounted pages. Follow the Structure exactly. Keep the cover and logo identical to the cover described in shot 01.
```

**03 翻開內頁**
```
Shot 03 of the same product: the SAME single book, opened in the middle and lying on its back. The thick rigid pages lie completely flat with almost no gutter. The front cover and logo are NOT visible. No extra covers, inserts, or loose pages. Pages: one continuous abstract landscape illustration in light teal, cream, and sand flowing across both pages without any break. Camera in front of the book, looking down about 35 degrees, centered, filling about 55–60% of the frame width. Same lighting as shot 01. Follow the Structure exactly.
```

## 15. 菜單螺絲裝 `menu-production`｜螺絲固定菜單

**重點檢查**：**左側兩顆螺絲、沒有書背**、內頁護貝、翻開時螺絲在左邊

**01 正面全貌**（跟共用開頭一起貼）
```
Product: 菜單螺絲裝.
Structure: a screw-bound restaurant menu: a thick rigid front cover and back cover (about 2 mm each) and several laminated sheets held together by two brass Chicago screws through holes near the LEFT edge. The screw heads are visible on the front cover. There is no spine — the left edge is the flat stack of cover and sheets.
Must NOT: no glued spine, no wrapped case, no rounded spine, no headband.
Cover: thick warm wood brown (#926A46) textured card cover; the screws are brass.
Logo: the shape of image 1 as a single-color gold foil stamp (#D4AF37), centered on the front cover.
Composition: ONE menu only, never stacked. It lies flat, shot from directly above at a slight angle, with the two brass screw heads near the left edge clearly visible.
```

**02 裝訂細節**
```
Shot 02 of the same product. Close-up of a macro of the brass screws through the cover and the stack of laminated sheets. Follow the Structure exactly. Keep the cover and logo identical to shot 01.
```

**03 翻開內頁**
```
Shot 03 of the same product: the SAME single menu with the front cover turned over to the LEFT, pivoting on the two screws, so the cover lies to the left (inside facing up) and the first laminated page lies on the right. The two screws are in the center between them. The logo is NOT visible. No extra covers or loose sheets. Pages: a generic menu layout of abstract gray lines and small warm brown dividers, no readable words or prices. Camera in front, looking down about 35 degrees, centered, filling about 55–60% of the frame width. Same lighting as shot 01. Follow the Structure exactly.
```

## 16. Q桿精裝 `q-rod-hardcover`｜硬殼＋Q 桿書背

**重點檢查**：前後是**硬殼**、**書背是一支 Q 桿夾條**（不是包布書背）、內頁沒有打孔

**01 正面全貌**（跟共用開頭一起貼）
```
Product: Q桿精裝.
Structure: a hardcover with a slide-bar spine: rigid front and back boards (about 2–3 mm thick, covered in bookcloth) with a stack of unpunched sheets between them, all clamped together along the LEFT edge by ONE plastic slide binder bar (a long U-shaped channel) that runs the full height and IS the spine. There is no wrapped cloth spine; the bar is clearly visible on the left edge. About 1 cm of pages.
Must NOT: no sewn or glued spine, no wrapped case spine, no screws, no rings, no punched holes, no metal mechanism inside.
Cover: cream bookcloth (#FAF8F1) boards; the slide bar is deep forest green (#293E38).
Logo: the shape of image 1 as a single-color gold foil stamp (#D4AF37), centered on the front cover.
Composition: ONE book only, never stacked. It lies flat, closed, front cover up, bar on the LEFT; camera from the front-left at about 30 degrees so the cover and the green slide bar along the left edge are visible.
```

**02 裝訂細節**
```
Shot 02 of the same product. Close-up of the left edge: the green U-shaped slide bar clamping the front board, the sheets, and the back board together. Follow the Structure exactly. Keep the cover and logo identical to shot 01.
```

**03 翻開內頁**
```
Shot 03 of the same product: the SAME single book with the front board lifted and bent back to the LEFT as far as the clamping bar allows, about 100 degrees, showing the first page. Because the bar clamps the pages, the book does NOT open flat. The logo is NOT visible. No extra covers or loose sheets. Pages: abstract gray text blocks. Camera in front, looking down about 35 degrees, centered, filling about 55–60% of the frame width. Same lighting as shot 01. Follow the Structure exactly.
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
Composition: ONE contract only, never stacked. It lies flat, shot from the front-left at about 30 degrees so the three screw heads and the stacked left edge are visible.
```

**02 裝訂細節**
```
Shot 02 of the same product. Close-up of a macro of the three screws passing through the front cover, the page stack, and the back cover. Follow the Structure exactly. Keep the cover and logo identical to shot 01.
```

**03 翻開內頁**
```
Shot 03 of the same product: the SAME single contract with the front cover and the first few pages turned over to the LEFT, pivoting on the three screws, so they lie to the left and the next page lies on the right. The three screws are in the center between them, and the pages stay fixed there. The logo is NOT visible. No extra covers or loose sheets. Pages: abstract gray paragraph blocks and empty signature lines. Camera in front, looking down about 35 degrees, centered, filling about 55–60% of the frame width. Same lighting as shot 01. Follow the Structure exactly.
```

---

## 修正用提示詞

在**同一個對話裡**貼對應的修正句，只改錯的地方。方括號裡的內容換成實際狀況。

**出現好幾本或疊在一起**
```
Show exactly ONE product. Not a stack, not two or three copies. Remove every extra copy, cover, board, loose page, and object. Keep this one product centered, with the same lighting and design.
```

**書背、封面位置不合理**
```
The structure is physically wrong: [錯在哪，例如 the spine is on the right / pages show on the spine side / there are two spines]. Fix it: the spine is on the [LEFT／RIGHT for 古書] edge of the front cover and connects the front and back covers along that one edge only; pages show only on the top, bottom, and fore edge. Keep the colors, logo, and background.
```

**又畫成精裝書了（軟皮類最常見）**
```
This is wrong: you drew a hardcover. This product has NO rigid boards and NO cover overhang. The cover is a thin flexible card exactly the same size as the pages, trimmed flush on all edges. Regenerate following the Structure exactly. Keep the colors, logo, and background.
```

**精裝畫成圓背**
```
The spine must be FLAT and SQUARE, not rounded. The fore edge of the pages is straight, not curved. Keep everything else the same.
```

**結構某個地方不對**
```
The [位置，例如 spine] is wrong. It must be: [正確樣子，例如 a flat square glued spine about 10 mm thick]. Look at image [3／4／5] for how it is built. Keep everything else the same.
```

**光線或位置跟其他產品不一致**
```
The lighting and placement do not match the rest of the series. Use one large soft key light from the upper LEFT and a soft fill from the right, natural slightly warm daylight, no overexposed white areas, soft contact shadow toward the lower RIGHT. Put the product exactly in the center, filling about 55–60% of the frame width. It must look like a real camera photograph, not a 3D render or isometric mockup. Keep the product, cover, and logo the same.
```

**構圖不對**
```
Use this composition instead: [貼上該產品 01 的 Composition 那一句]. Keep the product the same.
```

**商標變彩色、變形或跑錯位置**
```
Fix the logo: use the exact shape of image 1, in [single-color gold foil / one flat color: 顏色], only on the front cover, same size and position as described. Change nothing else.
```

**冒出文字、浮水印或其他標誌**
```
Remove every letter, word, number, watermark, and any logo other than the image 1 logo. Change nothing else.
```

**三張不像同一本**
```
This must be the exact same product as shot 01 in this conversation: same structure, cover, logo position, and size. Regenerate to match it.
```

**背景有道具或顏色不對**
```
Remove all props. The background must be a plain seamless cream #FAF8F1 studio backdrop with a soft natural shadow. Keep the product exactly the same.
```
