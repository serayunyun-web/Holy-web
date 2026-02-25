/* ===============================
   模擬資料（之後可換成資料庫）
================================ */
const data = {
    "100": {
        name: "論文精裝",
        products: {
            "101": {
                name: "製版燙金(全版)",
                notice: "※ 全版燙金以實際燙金面積為準，特殊色另計。",
                prices: { 1: 1185, 2: 1320, 3: 1455 }
            },
            "102": {
                name: "製版燙金(共版)",
                notice: "※ 共版燙金將提供頭版及日期，若標題姓名面積較大將依面積計算，特殊色另計。",
                prices: { 1: 935, 2: 1070, 3: 1205 }
            },
            "103": {
                name: "製版燙金(有版)",
                notice: "※ 燙金版由客戶提供，特殊色另計。",
                prices: { 1: 435, 2: 570, 3: 705 }
            },
            "104": {
                name: "數位燙金",
                notice: "※ 3本以下（含）數位燙金均為500元，特殊色另計。",
                prices: { 1: 500, 4: 570, 5: 640 }
            }
        }
    },

    "200": {
        name: "彩色精裝",
        notice: "※ 此價格不包含打釘、封面材料加價及內頁厚度高於2cm，打樣每本收+30元",
        products: {
            "201": { name: "A4 / B5", prices: { 1: 135, 2: 270, 3: 405 } },
            "202": { name: "A4R / B5R", prices: { 1: 150, 2: 300, 3: 450 } },
            "203": { name: "B4 / 25×25mm", prices: { 1: 170, 2: 340, 3: 510 } },
            "204": { name: "A3 / 30×30mm", prices: { 1: 190, 2: 380, 3: 570 } },
            "205": { name: "A5 / A5R", prices: { 1: 125, 2: 250, 3: 325 } }
        }
    },
    "300": {
        name: "彩色平裝",
        notice: "※ 此價格不包含打釘、封面材料加價及內頁厚度高於2cm，打樣每本收+20元",
        products: {
            "301": { name: "A4 / B5", prices: { 1: 45, 2: 90, 3: 135 } },
            "302": { name: "A4R / B5R", prices: { 1: 50, 2: 100, 3: 150 } },
            "303": { name: "B4 / 25×25mm", prices: { 1: 65, 2: 130, 3: 195 } },
            "304": { name: "A3 / 30×30mm", prices: { 1: 70, 2: 140, 3: 210 } },
            "305": { name: "A5 / A5R", prices: { 1: 40, 2: 80, 3: 120 } }
        }
    },
    "400": {
        name: "縫線精裝",
        notice: "※ 此價格不包含圓被、封面材料，台數3台內(含)，打樣每本收+30元",
        products: {
            "401": { name: "A4 / B5", prices: { 1: 165, 2: 330, 3: 495 } },
            "402": { name: "A4R / B5R", prices: { 1: 185, 2: 370, 3: 555 } },
            "403": { name: "A5", prices: { 1: 155, 2: 310, 3: 465 } },
            "404": { name: "A5R/ A6 ", prices: { 1: 140, 2: 280, 3: 420 } }
        }
    },
    "500": {
        name: "施工本裱冊",
        notice: "※ 此基本價格為10張內，會以每10張加價，不同尺寸加價不同，建議先與我們諮詢!",
        products: {
            "501": { name: "專用皮 A1→A2", prices: { 1: 170, 2: 340, 3: 510 } },
            "502": { name: "專用皮 A2→A3", prices: { 1: 110, 2: 220, 3: 330 } },
            "503": { name: "專用皮 A3→A4", prices: { 1: 80, 2: 160, 3: 240 } },
            "504": { name: "厚軟皮 A1→A2", prices: { 1: 210, 2: 420, 3: 630 } },
            "505": { name: "厚軟皮 A2→A3", prices: { 1: 130, 2: 260, 3: 390 } },
            "506": { name: "厚軟皮 A3→A4", prices: { 1: 90, 2: 180, 3: 270 } },
            "507": { name: "雲彩紙 A1→A2", prices: { 1: 140, 2: 280, 3: 420 } },
            "508": { name: "雲彩紙 A2→A3", prices: { 1: 90, 2: 180, 3: 270 } },
            "509": { name: "雲彩紙 A3→A4", prices: { 1: 70, 2: 140, 3: 210 } },
            "510": { name: "皮面精裝 A1→A2", prices: { 1: 400, 2: 800, 3: 1200 } },
            "511": { name: "皮面精裝 A2→A3", prices: { 1: 260, 2: 520, 3: 780 } },
            "512": { name: "皮面精裝 A3→A4", prices: { 1: 180, 2: 370, 3: 555 } }
        }
    },
};

/* ===============================
   DOM 元素
================================ */
const categorySelect = document.getElementById("category");
const productSelect = document.getElementById("product");
const qtyInput = document.getElementById("qty");
const priceDiv = document.getElementById("price");
const priceNote = document.getElementById("priceNote");

/* ===============================
   工具：重置顯示
================================ */
function resetPrice() {
    priceDiv.innerText = "請選擇條件以顯示價格";
    if (priceNote) {
        priceNote.innerText = "";
        priceNote.style.display = "none";
    }
}

/* ===============================
   核心計價邏輯
   規則：
   - 命中表格 → 直接用
   - 超過最大級距 → 用最後兩級距的「總價差」往後推
================================ */
function calcPrice(prices, qty) {
    const levels = Object.keys(prices).map(Number).sort((a, b) => a - b);

    // 命中級距
    if (prices[qty] !== undefined) {
        return prices[qty];
    }

    // 若級距不足 2 個，退回平均單價
    if (levels.length < 2) {
        const maxLv = levels[levels.length - 1];
        return Math.round((prices[maxLv] / maxLv) * qty);
    }

    const last = levels[levels.length - 1];
    const prev = levels[levels.length - 2];

    // 超過最大級距 → 用最後差距外推
    if (qty > last) {
        const step = prices[last] - prices[prev];
        return prices[last] + (qty - last) * step;
    }

    // 落在級距中間（保險）
    let nearest = levels[0];
    for (let lv of levels) {
        if (qty >= lv) nearest = lv;
    }
    return prices[nearest];
}

/* ===============================
   初始化：載入大類
================================ */
function initCategory() {
    categorySelect.innerHTML = '<option value="">請選擇大類</option>';
    for (const cid in data) {
        categorySelect.innerHTML +=
            `<option value="${cid}">${data[cid].name}</option>`;
    }
}

/* ===============================
   大類變更 → 載入產品
================================ */
categorySelect.addEventListener("change", () => {
    productSelect.innerHTML = '<option value="">請選擇規格</option>';
    qtyInput.value = "";
    resetPrice();

    const cid = categorySelect.value;
    if (!cid) return;

    const products = data[cid].products;
    for (const pid in products) {
        productSelect.innerHTML +=
            `<option value="${pid}">${products[pid].name}</option>`;
    }
});

/* ===============================
   產品變更 → 重置
================================ */
productSelect.addEventListener("change", () => {
    qtyInput.value = "";
    resetPrice();
});

/* ===============================
   數量輸入 → 計算價格 + 顯示注意事項
================================ */
qtyInput.addEventListener("input", () => {
    const cid = categorySelect.value;
    const pid = productSelect.value;
    const qty = parseInt(qtyInput.value, 10);

    if (!cid || !pid || !Number.isInteger(qty) || qty <= 0) {
        resetPrice();
        return;
    }

    const product = data[cid].products[pid];
    const total = calcPrice(product.prices, qty);

    priceDiv.innerText = `查價結果：NT$ ${total}`;

    // notice 顯示優先順序：產品 → 大類 → 預設
    if (priceNote) {
        const productNotice = product.notice;
        const categoryNotice = data[cid].notice;

        priceNote.innerText =
            productNotice ||
            categoryNotice ||
            "※ 此價格為試算參考，實際金額依現場報價為準。";

        priceNote.style.display = "block";
    }
});

/* ===============================
   初始化
================================ */
initCategory();
resetPrice();
