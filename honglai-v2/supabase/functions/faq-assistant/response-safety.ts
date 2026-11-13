export type UnsafeAnswerReason = "price" | "promise" | "case_decision" | "secret";

export function unsafeAnswerReason(answer: string): UnsafeAnswerReason | null {
  const normalized = answer.normalize("NFKC").toLocaleLowerCase("zh-Hant");
  if (
    /(?:nt\$|新台幣|台幣|售價|單價|總價|報價|費用).{0,12}\d|\d.{0,8}(?:元|塊錢)|折扣.{0,8}\d+\s*%/iu.test(normalized)
  ) return "price";
  if (/(一定|保證|絕對).{0,12}(完成|交貨|出貨|可製作|做得到)/u.test(normalized)) return "promise";
  if (/(同意|核准|確定|判定).{0,12}(退款|補印|賠償|退換貨|瑕疵)/u.test(normalized)) return "case_decision";
  if (/api\s*key|gemini_api_key|系統提示詞全文|內部密鑰|內部金鑰/iu.test(normalized)) return "secret";
  return null;
}
