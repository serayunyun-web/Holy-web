import type { BusinessRuleResult } from "./types.ts";
import { normalizeSearchText } from "./retrieval.ts";

const PROMPT_INJECTION = /忽略.{0,8}(規則|指示)|api\s*key|系統提示詞|system\s*prompt|你是管理員|假冒管理員|顯示.{0,8}(密鑰|金鑰)|執行.{0,8}(程式|指令)|繞過.{0,8}(限制|規則)/iu;
const OUT_OF_SCOPE = /天氣|小說|笑話|食譜|股票|運勢|星座|寫程式|與印刷無關|翻譯文章/iu;
const AFTER_SALES = /退款|退費|補印|賠償|退換貨|瑕疵|印刷有問題|訂單進度|訂單狀態|查詢訂單/iu;
const DELIVERY_PROMISE = /明天.{0,6}(完成|交貨|出貨|拿到)|幾天內.{0,6}(完成|交貨|出貨)|急件.{0,8}(一定|可以|能)|指定.{0,8}(日期|時間).{0,8}(完成|交貨)|一定.{0,8}(完成|交貨|出貨)/iu;
const MANUAL_QUOTE = /企業|公司大量|大量|特殊客製|客製需求|資料不足|特殊皮革|特殊材質|特殊加工|特殊技術/iu;
const PRICE_INTENT = /多少錢|價格|報價|單價|總價|費用|加工費|打樣費|折扣|打折|加價|預算|價錢/iu;

const answers = {
  price: "關於價格，請使用網站的線上估價功能查看可估價品項；若屬企業、大量、客製或資料不足的需求，會由專人進一步確認。",
  manualQuote: "這類需求需要由專人確認實際規格與製作條件，建議透過聯絡我們或人工詢價提供需求資料。",
  deliveryPromise: "實際交期需要依產品規格、數量與當時排程由專人確認，AI 小幫手無法承諾固定完成或出貨時間。",
  afterSales: "實際訂單、瑕疵、退款、補印、賠償或進度屬於個案，需由專人核對訂單資料後協助處理。",
  outOfScope: "我是鴻萊興業網站的 AI 小幫手，主要協助印刷、裝訂、製作注意事項與估價流程相關問題。",
  promptInjection: "我只能依照鴻萊興業正式 FAQ 與既定客服規則回答，無法顯示內部設定、金鑰或忽略安全規則。",
} as const;

function hasManualQuantity(message: string) {
  if (/證書夾/u.test(message)) return false;
  for (const match of message.matchAll(/(\d{1,6})\s*(本|份|個|組)/gu)) {
    if (Number(match[1]) >= 40) return true;
  }
  return false;
}

export function evaluateBusinessRules(message: string): BusinessRuleResult {
  const normalized = normalizeSearchText(message);
  if (PROMPT_INJECTION.test(normalized)) {
    return { kind: "promptInjection", action: "none", requiresHuman: false, answer: answers.promptInjection };
  }
  if (OUT_OF_SCOPE.test(normalized)) {
    return { kind: "outOfScope", action: "none", requiresHuman: false, answer: answers.outOfScope };
  }
  if (AFTER_SALES.test(normalized)) {
    return { kind: "afterSales", action: "contact", requiresHuman: true, answer: answers.afterSales };
  }
  if (DELIVERY_PROMISE.test(normalized)) {
    return { kind: "deliveryPromise", action: "contact", requiresHuman: true, answer: answers.deliveryPromise };
  }
  if (MANUAL_QUOTE.test(normalized) || hasManualQuantity(normalized)) {
    return { kind: "manualQuote", action: "contact", requiresHuman: true, answer: answers.manualQuote };
  }
  if (PRICE_INTENT.test(normalized)) {
    return { kind: "price", action: "estimate", requiresHuman: false, answer: answers.price };
  }
  return { kind: "faq", action: "none", requiresHuman: false, answer: null };
}

export const noReliableAnswer = "不好意思，目前沒有足夠的資料可以確認這項需求，建議您透過聯絡我們與專人確認。";
