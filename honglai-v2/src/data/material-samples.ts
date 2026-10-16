export type SampleKind = "cover" | "corner";

export type MaterialSample = {
  kind: SampleKind;
  code: string;
  name: string;
  image: string;
  appliesTo: readonly string[];
  description: string;
  enabled: boolean;
};

// 正式照片與編號尚未提供。資料加入前，樣品頁只顯示「資料待補」。
export const materialSamples: readonly MaterialSample[] = [];

export const sampleKindNames: Record<SampleKind, string> = {
  cover: "皮面／膠皮",
  corner: "護角",
};
