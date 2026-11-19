export const digitalFoil = {
  date: "2026.11.18",
  highlights: ["堅固耐刮", "無痕清晰", "快速實惠"],
  videoTitle: "堅固性測試影片",
  paragraphs: [
    "【堅固耐刮、無痕清晰、快速實惠】是數位燙金的核心優勢。影片展示實際耐刮與牢固度測試，燙金層不掉色、不脫落，字樣依然清晰銳利。",
    "適用於論文精裝、作品集等高質感裝訂需求，兼具美觀、效率與實用性。",
  ],
  video: { src: "/videos/digital-foil-test.mp4", poster: "/videos/digital-foil-test-poster.webp" },
  comparisonNote: "以下為常見燙金方式之差異比較，實際效果仍會依材質、設計與製作條件有所不同，歡迎洽詢我們取得專業建議。",
  comparison: [
    { item: "堅固度", digital: "高，耐刮不易脫落", zinc: "高，壓紋深但視材質而定" },
    { item: "清晰度", digital: "極佳，細字與線條表現優秀", zinc: "佳，細節受版材限制" },
    { item: "製作時間", digital: "快速，無需開版", zinc: "較長，需製作鋅版" },
    { item: "價格", digital: "較實惠，小量製作友善", zinc: "成本較高，適合大量製作" },
  ],
} as const;
