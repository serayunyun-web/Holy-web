import { withBase } from "@/lib/base-path";
export type SampleKind = "cover" | "corner";

export type LeatherSeriesId = "grain" | "jade" | "pearl" | "silk" | "cloud" | "solid";

export type LeatherSeries = {
  id: LeatherSeriesId;
  name: string;
  prefix: string;
  description: string;
};

export type MaterialSample = {
  kind: SampleKind;
  code: string;
  name: string;
  /** 目前為從色卡照片裁切的暫用圖，之後可換成單張近拍 */
  image: string;
  series?: LeatherSeriesId;
  /** true＝可數位燙金（也可傳統燙金）；false＝僅傳統燙金 */
  digitalFoil?: boolean;
  appliesTo: readonly string[];
  description: string;
  enabled: boolean;
};

export const leatherSeries: readonly LeatherSeries[] = [
  { id: "grain", name: "皮紋系列", prefix: "C／D", description: "數位燙金專用皮。紋路較淺、表面平整，燙金圖文能完整附著、細節清楚。" },
  { id: "jade", name: "翡翠系列", prefix: "J", description: "帶有細緻拉絲紋理與金屬光澤，質感沉穩。" },
  { id: "pearl", name: "珠光系列", prefix: "P", description: "表面帶有細密亮粉光澤，色彩鮮明。" },
  { id: "silk", name: "絲光系列", prefix: "B", description: "柔和的絲緞光澤，顏色選擇多。" },
  { id: "cloud", name: "雲龍系列", prefix: "Y", description: "仿和紙纖維紋路，每一片紋理都略有不同。" },
  { id: "solid", name: "單色系列", prefix: "B／N", description: "低調細緻的單色皮面，適合正式文件。" },
];

const ALL_HARDCOVER = ["所有精裝產品"] as const;

const leather = (series: LeatherSeriesId, digitalFoil: boolean, codes: readonly string[]): MaterialSample[] => {
  const seriesName = leatherSeries.find((item) => item.id === series)!.name;
  return codes.map((code) => ({
    kind: "cover", code, name: seriesName, image: withBase(`/images/samples/leather/${code.toLowerCase()}.webp`),
    series, digitalFoil, appliesTo: ALL_HARDCOVER, description: "", enabled: true,
  }));
};

export const materialSamples: readonly MaterialSample[] = [
  ...leather("grain", true, ["C10", "D11", "C20", "D28", "D91", "C30", "C31", "D33", "D35", "D36", "C40", "D42", "D47", "D55", "D56", "C60", "C61", "D65", "D69", "D87"]),
  ...leather("jade", false, ["J10", "J20", "J30", "J40", "J50", "J60", "J80"]),
  ...leather("pearl", false, ["P26", "P35", "P36", "P46", "P55", "P65", "P85"]),
  ...leather("silk", false, ["B10", "B22", "B32", "B42", "B52", "B62", "B82", "B92"]),
  ...leather("cloud", false, ["Y12", "Y22", "Y33", "Y42", "Y43", "Y62", "Y63", "Y93"]),
  ...leather("solid", false, ["B20", "B30", "B31", "B50", "B60", "B90", "N40"]),
  {
    kind: "cover", code: "施工本專用皮", name: "單色系列", image: withBase("/images/samples/leather/construction.webp"),
    series: "solid", digitalFoil: false, appliesTo: ["工程施工本"], description: "工程施工本專用皮面。", enabled: true,
  },
];

export const sampleKindNames: Record<SampleKind, string> = {
  cover: "精裝皮革",
  corner: "護角",
};
