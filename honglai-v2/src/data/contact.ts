/** 公司聯絡資料：聯絡頁、快速按鈕與營業狀態共用。 */
const mapQuery = "鴻萊興業 台中市南區有恆街55號";

export const contactInfo = {
  phoneDisplay: "(04) 2471-3063",
  phoneHref: "tel:+886424713063",
  email: "hongguan8888@gmail.com",
  lineId: "24713063",
  /** LINE 官方帳號加好友連結；拿到後填入，聯絡頁會自動改成「加入好友」按鈕。 */
  lineAddUrl: null as string | null,
  /** LINE QR Code 圖片路徑（例如 /images/contact/line-qr.png）；填入後聯絡頁會顯示 QR Code。 */
  lineQrImage: null as string | null,
  address: "台中市南區有恆街 55 號",
  mapEmbedUrl: `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&hl=zh-TW&z=17&output=embed`,
  mapDirectionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery)}`,
} as const;

/** 營業時間（台灣時間）：週一至週五，午休 12:00–13:30；週六、週日與國定假日公休。 */
export const businessHours = {
  weekdays: [1, 2, 3, 4, 5],
  open: "08:00",
  lunchStart: "12:00",
  lunchEnd: "13:30",
  close: "17:30",
} as const;
