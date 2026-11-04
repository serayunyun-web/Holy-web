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
  sourceCategory?: string;
  priceSourceRefs?: readonly string[];
  quoteMode?: "manual";
};

export const catalogFilter = {
  id: "all",
  name: "全部產品",
  icon: "全",
  description: "顯示目前所有啟用的產品方向",
} as const;

export const productCategories: readonly ProductCategory[] = [
  { id: "cat-books", slug: "books", name: "論文／書冊", description: "論文、作品集與各式書冊製作", icon: "冊", image: null, displayOrder: 10, isActive: true, isPlaceholder: false },
  { id: "cat-business", slug: "business", name: "工程／企業", description: "工程文件、企業文宣與商務製作", icon: "企", image: null, displayOrder: 20, isActive: true, isPlaceholder: false },
  { id: "cat-creative", slug: "creative", name: "創作／生活", description: "個人創作、展示與生活應用", icon: "創", image: null, displayOrder: 30, isActive: true, isPlaceholder: false },
  { id: "cat-finishing", slug: "finishing", name: "加工服務", description: "裝訂、打孔與文件加工服務", icon: "製", image: null, displayOrder: 40, isActive: true, isPlaceholder: false },
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
    categoryIds: ["cat-books"], cardImage: null, gallery: gallery("thesis-binding", "論文裝訂", "teal"),
    basicInfo: [{ label: "資料狀態", value: "開發階段暫存內容" }, { label: "價格與交期", value: "提交需求後由專人確認" }],
    details: placeholderDetails("論文裝訂"), tone: "teal", displayOrder: 10, isActive: true, isPlaceholder: true,
  },
  {
    id: "prd-certificate-folder", slug: "certificate-folder", title: "證書夾",
    description: "【暫存內容】依證書尺寸與使用情境確認材質及加工方式。",
    categoryIds: ["cat-business", "cat-creative"], cardImage: null, gallery: gallery("certificate-folder", "證書夾", "brown"),
    basicInfo: [{ label: "資料狀態", value: "開發階段暫存內容" }, { label: "價格與交期", value: "提交需求後由專人確認" }],
    details: placeholderDetails("證書夾"), tone: "brown", displayOrder: 20, isActive: true, isPlaceholder: true,
  },
  {
    id: "prd-construction-book", slug: "construction-book", title: "施工本",
    description: "【暫存內容】施工圖裱冊與不同尺寸、封面材質的製作服務。",
    categoryIds: ["cat-business"], cardImage: null, gallery: gallery("construction-book", "施工本", "teal"),
    basicInfo: [{ label: "資料狀態", value: "開發階段暫存內容" }, { label: "價格與交期", value: "提交需求後由專人確認" }],
    details: placeholderDetails("施工本"), tone: "teal", displayOrder: 30, isActive: true, isPlaceholder: true,
  },
  {
    id: "prd-menu-production", slug: "menu-production", title: "菜單製作",
    description: "【暫存內容】螺絲裝菜單與可替換內頁等裝訂方向。",
    categoryIds: ["cat-business", "cat-creative"], cardImage: null, gallery: gallery("menu-production", "菜單製作", "brown"),
    basicInfo: [{ label: "資料狀態", value: "開發階段暫存內容" }, { label: "價格與交期", value: "提交需求後由專人確認" }],
    details: placeholderDetails("菜單製作"), tone: "brown", displayOrder: 40, isActive: true, isPlaceholder: true,
  },
  {
    id: "prd-engineering-contract", slug: "engineering-contract", title: "工程合約書",
    description: "提供工程合約書平裝、精裝及封面加工服務，可依文件需求選擇製作方式。",
    categoryIds: ["cat-business"], cardImage: null, gallery: gallery("engineering-contract", "工程合約書", "teal"),
    basicInfo: [{ label: "估價方式", value: "需人工詢價" }, { label: "價目表來源", value: "5-2" }],
    details: placeholderDetails("工程合約書"), tone: "teal", displayOrder: 50, isActive: true, isPlaceholder: true,
    sourceCategory: "工程合約書", priceSourceRefs: ["5-2"], quoteMode: "manual",
  },
  {
    id: "prd-color-perfect-binding", slug: "color-perfect-binding", title: "彩色膠裝",
    description: "適合企劃書、作品集與各式書冊製作，提供不同封面及裝訂形式。",
    categoryIds: ["cat-books", "cat-creative"], cardImage: null, gallery: gallery("color-perfect-binding", "彩色膠裝", "brown"),
    basicInfo: [{ label: "估價方式", value: "需人工詢價" }, { label: "價目表來源", value: "7-1、7-2" }],
    details: placeholderDetails("彩色膠裝"), tone: "brown", displayOrder: 60, isActive: true, isPlaceholder: true,
    sourceCategory: "彩色膠裝", priceSourceRefs: ["7-1", "7-2"], quoteMode: "manual",
  },
  {
    id: "prd-sewn-binding", slug: "sewn-binding", title: "縫線裝訂",
    description: "提供多種縫線書冊裝訂方式，可依書冊結構與製作需求選擇。",
    categoryIds: ["cat-books", "cat-creative", "cat-finishing"], cardImage: null, gallery: gallery("sewn-binding", "縫線裝訂", "teal"),
    basicInfo: [{ label: "估價方式", value: "需人工詢價" }, { label: "價目表來源", value: "8-1、8-2、9-1" }],
    details: placeholderDetails("縫線裝訂"), tone: "teal", displayOrder: 70, isActive: true, isPlaceholder: true,
    sourceCategory: "縫線裝", priceSourceRefs: ["8-1", "8-2", "9-1"], quoteMode: "manual",
  },
  {
    id: "prd-machine-sewn-binding", slug: "machine-sewn-binding", title: "車線裝訂",
    description: "以車線方式固定書冊，適合需要特殊裝訂形式的文件與作品。",
    categoryIds: ["cat-books", "cat-creative", "cat-finishing"], cardImage: null, gallery: gallery("machine-sewn-binding", "車線裝訂", "brown"),
    basicInfo: [{ label: "估價方式", value: "需人工詢價" }, { label: "價目表來源", value: "9-2" }],
    details: placeholderDetails("車線裝訂"), tone: "brown", displayOrder: 80, isActive: true, isPlaceholder: true,
    sourceCategory: "車線裝", priceSourceRefs: ["9-2"], quoteMode: "manual",
  },
  {
    id: "prd-butterfly-book", slug: "butterfly-book", title: "蝴蝶書／蝶冊",
    description: "提供直裱、厚裱等蝶冊製作方式，適合圖文作品及展示型書冊。",
    categoryIds: ["cat-books", "cat-creative"], cardImage: null, gallery: gallery("butterfly-book", "蝴蝶書／蝶冊", "teal"),
    basicInfo: [{ label: "估價方式", value: "需人工詢價" }, { label: "價目表來源", value: "10-1、10-2、10-x" }],
    details: placeholderDetails("蝴蝶書／蝶冊"), tone: "teal", displayOrder: 90, isActive: true, isPlaceholder: true,
    sourceCategory: "蝶冊", priceSourceRefs: ["10-1", "10-2", "10-x"], quoteMode: "manual",
  },
  {
    id: "prd-screw-binding", slug: "screw-binding", title: "螺絲裝訂",
    description: "提供螺絲固定式裝訂，適用於菜單、合約書及其他文件製作。",
    categoryIds: ["cat-business", "cat-creative", "cat-finishing"], cardImage: null, gallery: gallery("screw-binding", "螺絲裝訂", "brown"),
    basicInfo: [{ label: "估價方式", value: "需人工詢價" }, { label: "價目表來源", value: "11-1、11-2、附表11" }],
    details: placeholderDetails("螺絲裝訂"), tone: "brown", displayOrder: 100, isActive: true, isPlaceholder: true,
    sourceCategory: "螺絲裝", priceSourceRefs: ["11-1", "11-2", "附表11"], quoteMode: "manual",
  },
  {
    id: "prd-file-binder", slug: "file-binder", title: "檔案夾／活頁夾",
    description: "提供檔案夾、活頁夾及快撈夾等製作服務，可依需求選擇規格。",
    categoryIds: ["cat-business", "cat-creative"], cardImage: null, gallery: gallery("file-binder", "檔案夾／活頁夾", "teal"),
    basicInfo: [{ label: "估價方式", value: "需人工詢價" }, { label: "價目表來源", value: "P12" }],
    details: placeholderDetails("檔案夾／活頁夾"), tone: "teal", displayOrder: 110, isActive: true, isPlaceholder: true,
    sourceCategory: "檔案夾", priceSourceRefs: ["P12"], quoteMode: "manual",
  },
  {
    id: "prd-triangle-desk-calendar", slug: "triangle-desk-calendar", title: "三角桌曆",
    description: "提供三角桌曆製作，適合企業文宣及個人創作應用。",
    categoryIds: ["cat-business", "cat-creative"], cardImage: null, gallery: gallery("triangle-desk-calendar", "三角桌曆", "brown"),
    basicInfo: [{ label: "估價方式", value: "需人工詢價" }, { label: "價目表來源", value: "P13" }],
    details: placeholderDetails("三角桌曆"), tone: "brown", displayOrder: 120, isActive: true, isPlaceholder: true,
    sourceCategory: "三角桌曆", priceSourceRefs: ["P13"], quoteMode: "manual",
  },
  {
    id: "prd-double-loop-binding", slug: "double-loop-binding", title: "雙線圈裝訂",
    description: "提供雙線圈書冊裝訂加工，可依尺寸及線圈規格選擇。",
    categoryIds: ["cat-books", "cat-creative", "cat-finishing"], cardImage: null, gallery: gallery("double-loop-binding", "雙線圈裝訂", "teal"),
    basicInfo: [{ label: "估價方式", value: "需人工詢價" }, { label: "價目表來源", value: "P13" }],
    details: placeholderDetails("雙線圈裝訂"), tone: "teal", displayOrder: 130, isActive: true, isPlaceholder: true,
    sourceCategory: "雙線圈", priceSourceRefs: ["P13"], quoteMode: "manual",
  },
  {
    id: "prd-ring-binding", slug: "ring-binding", title: "環裝裝訂",
    description: "提供環裝書冊加工，可依尺寸及相關材料規格製作。",
    categoryIds: ["cat-books", "cat-creative", "cat-finishing"], cardImage: null, gallery: gallery("ring-binding", "環裝裝訂", "brown"),
    basicInfo: [{ label: "估價方式", value: "需人工詢價" }, { label: "價目表來源", value: "P13" }],
    details: placeholderDetails("環裝裝訂"), tone: "brown", displayOrder: 140, isActive: true, isPlaceholder: true,
    sourceCategory: "環裝", priceSourceRefs: ["P13"], quoteMode: "manual",
  },
  {
    id: "prd-punch-binding", slug: "punch-binding", title: "打孔裝冊",
    description: "提供文件打孔與裝冊加工，實際規格及費用依製作條件確認。",
    categoryIds: ["cat-finishing"], cardImage: null, gallery: gallery("punch-binding", "打孔裝冊", "teal"),
    basicInfo: [{ label: "估價方式", value: "需人工詢價" }, { label: "價目表來源", value: "P12" }],
    details: placeholderDetails("打孔裝冊"), tone: "teal", displayOrder: 150, isActive: true, isPlaceholder: true,
    sourceCategory: "打孔裝冊", priceSourceRefs: ["P12"], quoteMode: "manual",
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
