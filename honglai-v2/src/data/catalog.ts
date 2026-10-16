export type CatalogTone = "teal" | "brown";

export type ProductCategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  image: string | null;
  displayOrder: number;
  isActive: boolean;
  isPlaceholder: boolean;
};

export type ProductImage = {
  id: string;
  src: string | null;
  alt: string;
  label: string;
  tone: CatalogTone;
  displayOrder: number;
  isPlaceholder: boolean;
};

export type ProductDetailSections = {
  introduction: readonly string[];
  materials: readonly string[];
  specifications: readonly string[];
  processing: readonly string[];
  notes: readonly string[];
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  description: string;
  categoryIds: readonly string[];
  cardImage: string | null;
  gallery: readonly ProductImage[];
  basicInfo: readonly { label: string; value: string }[];
  details: ProductDetailSections;
  tone: CatalogTone;
  displayOrder: number;
  isActive: boolean;
  isPlaceholder: boolean;
};

export const catalogFilter = {
  id: "all",
  name: "全部產品",
  icon: "全",
  description: "顯示目前所有啟用的產品方向",
} as const;

export const productCategories: readonly ProductCategory[] = [
  { id: "cat-thesis", slug: "book-binding", name: "書籍裝訂", description: "論文、作品集、工程合約書與一般書冊", icon: "冊", image: null, displayOrder: 10, isActive: true, isPlaceholder: true },
  { id: "cat-certificate", slug: "certificate", name: "證書夾", description: "暫定分類｜證書收納與展示用途", icon: "證", image: null, displayOrder: 20, isActive: true, isPlaceholder: true },
  { id: "cat-construction", slug: "construction", name: "施工本", description: "暫定分類｜施工圖與工程資料裝訂", icon: "工", image: null, displayOrder: 30, isActive: true, isPlaceholder: true },
  { id: "cat-menu", slug: "menu", name: "菜單", description: "暫定分類｜餐飲菜單製作與裝訂", icon: "菜", image: null, displayOrder: 40, isActive: true, isPlaceholder: true },
] as const;

const placeholderDetails = (productName: string): ProductDetailSections => ({
  introduction: [`【暫存內容】${productName}的正式產品介紹尚待鴻萊確認，目前頁面僅展示資訊架構。`],
  materials: ["【暫存內容】可選材質與顏色尚待提供正式資料。"],
  specifications: ["【暫存內容】尺寸、頁數、數量與其他規格將依實際需求確認。"],
  processing: ["【暫存內容】可搭配的印刷與後加工方式尚待鴻萊確認。"],
  notes: ["本頁不顯示未確認價格，也不構成正式報價或訂單。", "正式價格、規格與交期須經鴻萊人工審核，並由客戶確認後才安排製作。"],
});

const gallery = (slug: string, title: string, tone: CatalogTone): readonly ProductImage[] => [
  { id: `${slug}-main`, src: null, alt: `${title}主圖佔位`, label: `${title}主圖`, tone, displayOrder: 10, isPlaceholder: true },
  { id: `${slug}-detail`, src: null, alt: `${title}細節圖佔位`, label: `${title}細節`, tone: tone === "teal" ? "brown" : "teal", displayOrder: 20, isPlaceholder: true },
  { id: `${slug}-usage`, src: null, alt: `${title}使用情境圖佔位`, label: `${title}使用情境`, tone, displayOrder: 30, isPlaceholder: true },
];

export const products: readonly Product[] = [
  {
    id: "prd-thesis-binding", slug: "thesis-binding", title: "論文裝訂",
    description: "【暫存內容】論文精裝、彩色精裝與平裝等製作需求。",
    categoryIds: ["cat-thesis"], cardImage: null, gallery: gallery("thesis-binding", "論文裝訂", "teal"),
    basicInfo: [{ label: "資料狀態", value: "開發階段暫存內容" }, { label: "價格與交期", value: "提交需求後由專人確認" }],
    details: placeholderDetails("論文裝訂"), tone: "teal", displayOrder: 10, isActive: true, isPlaceholder: true,
  },
  {
    id: "prd-certificate-folder", slug: "certificate-folder", title: "證書夾",
    description: "【暫存內容】依證書尺寸與使用情境確認材質及加工方式。",
    categoryIds: ["cat-certificate"], cardImage: null, gallery: gallery("certificate-folder", "證書夾", "brown"),
    basicInfo: [{ label: "資料狀態", value: "開發階段暫存內容" }, { label: "價格與交期", value: "提交需求後由專人確認" }],
    details: placeholderDetails("證書夾"), tone: "brown", displayOrder: 20, isActive: true, isPlaceholder: true,
  },
  {
    id: "prd-construction-book", slug: "construction-book", title: "施工本",
    description: "【暫存內容】施工圖裱冊與不同尺寸、封面材質的製作服務。",
    categoryIds: ["cat-construction"], cardImage: null, gallery: gallery("construction-book", "施工本", "teal"),
    basicInfo: [{ label: "資料狀態", value: "開發階段暫存內容" }, { label: "價格與交期", value: "提交需求後由專人確認" }],
    details: placeholderDetails("施工本"), tone: "teal", displayOrder: 30, isActive: true, isPlaceholder: true,
  },
  {
    id: "prd-menu-production", slug: "menu-production", title: "菜單製作",
    description: "【暫存內容】螺絲裝菜單與可替換內頁等裝訂方向。",
    categoryIds: ["cat-menu"], cardImage: null, gallery: gallery("menu-production", "菜單製作", "brown"),
    basicInfo: [{ label: "資料狀態", value: "開發階段暫存內容" }, { label: "價格與交期", value: "提交需求後由專人確認" }],
    details: placeholderDetails("菜單製作"), tone: "brown", displayOrder: 40, isActive: true, isPlaceholder: true,
  },
] as const;

export const activeCategories = productCategories.filter((category) => category.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
export const activeProducts = products.filter((product) => product.isActive).sort((a, b) => a.displayOrder - b.displayOrder);

export function getProductBySlug(slug: string) {
  return activeProducts.find((product) => product.slug === slug);
}

export function getRelatedProducts(product: Product, limit = 3) {
  const sharedCategory = activeProducts.filter((candidate) => candidate.id !== product.id && candidate.categoryIds.some((id) => product.categoryIds.includes(id)));
  const remaining = activeProducts.filter((candidate) => candidate.id !== product.id && !sharedCategory.some((item) => item.id === candidate.id));
  return [...sharedCategory, ...remaining].slice(0, limit);
}
