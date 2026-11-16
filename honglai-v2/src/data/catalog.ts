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

export type ProductSpecGroup = { label: string; items: readonly string[] };

export type ProductDetailSections = {
  /** 左欄規格清單，例如「結構」「適合」「留意」 */
  specs: readonly ProductSpecGroup[];
  /** 右欄產品介紹，每段用 \n 斷成數個短句，建議 2～4 段 */
  story: readonly string[];
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
  /** 設為 false 時只保留產品介紹頁，不出現在查價與線上下單 */
  isOrderable?: boolean;
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

const productNotes = ["本頁不顯示未確認價格，也不構成正式報價或訂單。", "正式價格、規格與交期須經鴻萊人工審核，並由客戶確認後才安排製作。"] as const;

/** 產品正式介紹：左欄「結構／適合／留意」，右欄每段以 \n 斷句 */
const bindingDetails = (structure: readonly string[], suitable: readonly string[], caution: readonly string[], story: readonly string[]): ProductDetailSections => ({
  specs: [
    { label: "結構", items: structure },
    { label: "適合", items: suitable },
    { label: "留意", items: caution },
  ],
  story,
  notes: productNotes,
});

const screwStructure = ["裝訂｜打孔後以對鎖螺絲固定", "內頁｜可拆開增減、調整順序"] as const;

/** 每個產品固定 4 個拍攝角度；01～03 必要，04 可省略（把該筆移除即可）。檔名：/images/products/{slug}-0N.webp */
const galleryShots = [
  { key: "01", label: "正面全貌" },
  { key: "02", label: "書背／裝訂細節" },
  { key: "03", label: "翻開內頁" },
  { key: "04", label: "材質特寫" },
] as const;

/** 已放進 public/images/products 的正式照片張數（依 01、02、03… 順序）。新增照片後在這裡登記即可。 */
const productPhotoCount: Record<string, number> = {
  "thesis-binding": 3,
  "certificate-folder": 3,
  "construction-book": 3,
  "engineering-contract": 3,
  "perfect-binding": 3,
  "hardcover": 3,
  "sewn-softcover": 3,
  "sewn-hardcover": 3,
  "exposed-spine-sewn": 3,
  "machine-sewn-binding": 3,
  "traditional-thread-binding": 3,
  "saddle-stitch": 3,
  "ring-binding": 3,
  "butterfly-book": 3,
  "menu-production": 3,
  "screw-contract": 3,
};

const photoPath = (slug: string, key: string) => `/images/products/${slug}-${key}.webp`;

const cardImageFor = (slug: string) => (productPhotoCount[slug] ? photoPath(slug, "01") : null);

const gallery = (slug: string, title: string, tone: CatalogTone): readonly ProductImage[] => {
  const photoCount = productPhotoCount[slug] ?? 0;
  const shots = photoCount > 0 ? galleryShots.slice(0, photoCount) : galleryShots;
  return shots.map((shot, index) => ({
    id: `${slug}-${shot.key}`, src: photoCount > 0 ? photoPath(slug, shot.key) : null, alt: `${title}｜${shot.label}`, label: shot.label,
    tone: index % 2 === 0 ? tone : tone === "teal" ? "brown" : "teal", displayOrder: (index + 1) * 10, isPlaceholder: photoCount === 0,
  }));
};

export const products: readonly Product[] = [
  {
    id: "prd-thesis-binding", slug: "thesis-binding", title: "論文",
    description: "依學校規範製作平裝或精裝論文，可燙印校名、題目與姓名。",
    categoryIds: ["cat-books"], cardImage: cardImageFor("thesis-binding"), gallery: gallery("thesis-binding", "論文", "teal"),
    basicInfo: [{ label: "估價方式", value: "需人工詢價" }, { label: "價格與交期", value: "提交需求後由專人確認" }],
    details: bindingDetails(
      ["平裝｜膠裝", "精裝｜硬殼封面・方背", "加工｜燙金"],
      ["碩博士畢業論文、學位論文、研究報告"],
      ["封面顏色與燙金內容依各校規定", "請先向系所與圖書館確認格式"],
      [
        "畢業前的最後一哩路\n從內頁到封面\n一本一本仔細裝訂成冊",
        "依照學校規定挑選封面顏色\n燙上校名、題目與姓名\n交出去的，是幾年的心血",
        "平裝、精裝都能做\n一本也接\n不用擔心數量太少",
      ],
    ),
    tone: "teal", displayOrder: 10, isActive: true, isPlaceholder: false, quoteMode: "manual",
  },
  {
    id: "prd-certificate-folder", slug: "certificate-folder", title: "證書夾",
    description: "紙面或皮面證書夾，可燙印校徽、Logo 與文字。",
    categoryIds: ["cat-business", "cat-creative"], cardImage: cardImageFor("certificate-folder"), gallery: gallery("certificate-folder", "證書夾", "brown"),
    basicInfo: [{ label: "估價方式", value: "需人工詢價" }, { label: "價格與交期", value: "提交需求後由專人確認" }],
    details: bindingDetails(
      ["樣式｜兩片式、泡棉兩片式、三角式、磁扣翻蓋式", "開啟｜左右翻、上下翻", "固定｜四角、緞帶或內袋"],
      ["畢業證書、聘書、獎狀、感謝狀、結婚書約"],
      ["請提供證書實際尺寸", "燙金內容需事先確認文字與 Logo"],
      [
        "一張證書\n代表的是一段努力\n值得好好收著",
        "紙面、皮面都能選\n燙上校徽、公司 Logo 或文字\n拿在手上就是正式的份量",
        "兩片式簡潔大方\n加一層泡棉更有厚度\n三角或緞帶固定內頁，取放都方便",
      ],
    ),
    tone: "brown", displayOrder: 20, isActive: true, isPlaceholder: false, quoteMode: "manual",
  },
  {
    id: "prd-construction-book", slug: "construction-book", title: "工程施工本",
    description: "大型工程圖摺疊成冊，方便帶到現場翻閱。",
    categoryIds: ["cat-business"], cardImage: cardImageFor("construction-book"), gallery: gallery("construction-book", "工程施工本", "teal"),
    basicInfo: [{ label: "估價方式", value: "需人工詢價" }, { label: "價格與交期", value: "提交需求後由專人確認" }],
    details: bindingDetails(
      ["圖面｜A1、A2、A3 工程圖摺疊成冊", "封面｜施工本專用皮、厚軟皮、透明膠片", "裝訂｜膠裝、螺絲裝、打孔裝冊"],
      ["建築施工圖冊、土木工程圖、施工資料本"],
      ["請提供原始圖面尺寸與張數", "摺圖方式依裝訂後尺寸決定"],
      [
        "一張張大圖\n精準摺成好拿的尺寸\n再和文字說明合成一本",
        "帶到工地現場\n攤開就是完整圖面\n收起來整齊不散亂",
        "封面用耐磨的施工本專用皮\n經得起現場反覆翻閱\n也可以燙上工程名稱",
      ],
    ),
    tone: "teal", displayOrder: 30, isActive: true, isPlaceholder: false, quoteMode: "manual",
  },
  {
    id: "prd-engineering-contract", slug: "engineering-contract", title: "工程合約書",
    description: "合約本文與附件依序裝訂成冊，頁面固定、方便蓋騎縫章。",
    categoryIds: ["cat-business"], cardImage: cardImageFor("engineering-contract"), gallery: gallery("engineering-contract", "工程合約書", "brown"),
    basicInfo: [{ label: "估價方式", value: "需人工詢價" }, { label: "價目表來源", value: "5-2" }],
    details: bindingDetails(
      ["裝訂｜膠裝、平裝、精裝", "內容｜合約本文與附件依序裝訂成冊", "加工｜封面燙金"],
      ["工程合約、投標文件、價格分析表、工程圖說附件"],
      ["公家機關或特定專案若有指定格式，請先提供規範", "一式多份請註明份數"],
      [
        "合約本文、價格分析表、工程圖說\n依照順序\n一頁一頁裝訂成冊",
        "裝訂後頁面固定、不能抽換\n方便蓋騎縫章\n讓每一份合約都完整可信",
        "一式多份也能一次完成\n封面燙上工程名稱\n正式又好辨認",
      ],
    ),
    tone: "brown", displayOrder: 40, isActive: true, isPlaceholder: false,
    sourceCategory: "工程合約書", priceSourceRefs: ["5-2"], quoteMode: "manual",
  },
  {
    id: "prd-perfect-binding", slug: "perfect-binding", title: "膠裝",
    description: "用膠將內頁黏合於書背，最常見也最經濟的書冊裝訂方式。",
    categoryIds: ["cat-books", "cat-creative"], cardImage: cardImageFor("perfect-binding"), gallery: gallery("perfect-binding", "膠裝", "teal"),
    basicInfo: [{ label: "估價方式", value: "需人工詢價" }, { label: "價目表來源", value: "7-1、7-2" }],
    details: bindingDetails(
      ["內頁｜書背上膠黏合", "封面｜軟質封面包覆", "書背｜平整，可印書名"],
      ["報告、講義、型錄、一般書冊"],
      ["攤開幅度有限", "書背側內頁需多留白邊"],
      [
        "內頁沿著書背一次上膠\n再以封面整片包覆\n成冊快速，也最經濟",
        "書背平整方正\n可以印上書名\n放上書架也一眼就找得到",
        "適合以閱讀為主的書冊\n若需要整本壓平書寫\n可以改選線裝類的裝訂",
      ],
    ),
    tone: "teal", displayOrder: 50, isActive: true, isPlaceholder: false,
    sourceCategory: "彩色膠裝", priceSourceRefs: ["7-1", "7-2"], quoteMode: "manual",
  },
  {
    id: "prd-hardcover", slug: "hardcover", title: "精裝",
    description: "硬紙板為底、包上封面材料的方背精裝，耐用又有份量。",
    categoryIds: ["cat-books", "cat-creative"], cardImage: cardImageFor("hardcover"), gallery: gallery("hardcover", "精裝", "brown"),
    basicInfo: [{ label: "估價方式", value: "需人工詢價" }, { label: "價格與交期", value: "提交需求後由專人確認" }],
    details: bindingDetails(
      ["封面｜硬紙板包覆封面材料", "書背｜方背"],
      ["論文、紀念冊、收藏書、正式文件"],
      ["工序較多，交期與費用較高"],
      [
        "以硬紙板為底\n包上封面材料\n讓書冊站得挺、拿得穩",
        "方正的書背線條俐落\n可以搭配皮革與燙金\n正式場合也拿得出手",
        "厚實的外殼守住內頁\n適合需要長久保存的\n每一份重要紀錄",
      ],
    ),
    tone: "brown", displayOrder: 60, isActive: true, isPlaceholder: false, quoteMode: "manual",
  },
  {
    id: "prd-sewn-softcover", slug: "sewn-softcover", title: "線平裝",
    description: "內頁先穿線再上膠包封，比膠裝更耐翻、不易掉頁。",
    categoryIds: ["cat-books", "cat-creative", "cat-finishing"], cardImage: cardImageFor("sewn-softcover"), gallery: gallery("sewn-softcover", "線平裝", "teal"),
    basicInfo: [{ label: "估價方式", value: "需人工詢價" }, { label: "價格與交期", value: "提交需求後由專人確認" }],
    details: bindingDetails(
      ["內頁｜先穿線再上膠", "封面｜軟質封面"],
      ["教材、手冊、經常翻閱的書冊"],
      ["書背側內頁需留足白邊"],
      [
        "內頁先以線串起\n再上膠包上封面\n外表輕巧、內裡牢靠",
        "縫線分擔每一次翻頁的拉力\n就算天天翻閱\n也不容易掉頁",
      ],
    ),
    tone: "teal", displayOrder: 70, isActive: true, isPlaceholder: false, quoteMode: "manual",
  },
  {
    id: "prd-sewn-hardcover", slug: "sewn-hardcover", title: "線精裝",
    description: "穿線書芯搭配精裝硬殼，牢固與質感一次到位。",
    categoryIds: ["cat-books", "cat-creative", "cat-finishing"], cardImage: cardImageFor("sewn-hardcover"), gallery: gallery("sewn-hardcover", "線精裝", "brown"),
    basicInfo: [{ label: "估價方式", value: "需人工詢價" }, { label: "價格與交期", value: "提交需求後由專人確認" }],
    details: bindingDetails(
      ["書芯｜穿線", "封面｜精裝硬殼・方背"],
      ["厚書、畫冊、典藏用書"],
      ["工序最多，建議預留較充裕的製作時間"],
      [
        "穿線的書芯\n配上精裝硬殼\n牢固與質感一次到位",
        "經得起反覆翻閱\n也經得起時間\n是想好好留下來的書，最安心的選擇",
      ],
    ),
    tone: "brown", displayOrder: 80, isActive: true, isPlaceholder: false, quoteMode: "manual",
  },
  {
    id: "prd-exposed-spine-sewn", slug: "exposed-spine-sewn", title: "裸背線裝",
    description: "書背不包封、縫線外露，翻開可 180° 完全攤平。",
    categoryIds: ["cat-books", "cat-creative", "cat-finishing"], cardImage: cardImageFor("exposed-spine-sewn"), gallery: gallery("exposed-spine-sewn", "裸背線裝", "teal"),
    basicInfo: [{ label: "估價方式", value: "需人工詢價" }, { label: "價格與交期", value: "提交需求後由專人確認" }],
    details: bindingDetails(
      ["書背｜不包覆，縫線外露", "開合｜可 180° 攤平"],
      ["筆記本、手帳、作品集、食譜"],
      ["書背無法印字"],
      [
        "拿掉書背的包覆\n讓縫線直接露出來\n翻開就能平平攤在桌上",
        "跨頁的畫面完整相連\n寫字時也不用一手壓著",
        "一疊疊書帖與縫線在書背交錯\n本身就是一道風景",
      ],
    ),
    tone: "teal", displayOrder: 90, isActive: true, isPlaceholder: false, quoteMode: "manual",
  },
  {
    id: "prd-machine-sewn-binding", slug: "machine-sewn-binding", title: "車線平裝",
    description: "沿書脊車縫一道線固定內頁，輕薄簡潔，線跡也是設計。",
    categoryIds: ["cat-books", "cat-creative", "cat-finishing"], cardImage: cardImageFor("machine-sewn-binding"), gallery: gallery("machine-sewn-binding", "車線平裝", "brown"),
    basicInfo: [{ label: "估價方式", value: "需人工詢價" }, { label: "價目表來源", value: "9-2" }],
    details: bindingDetails(
      ["固定｜沿書脊車縫一道線", "頁數｜中縫裝訂需為 4 的倍數"],
      ["薄本手冊、小誌、邀請卡冊、設計刊物"],
      ["適合薄本，頁數多時縫線吃不住"],
      [
        "不用釘，也不用膠\n一道車縫線\n就把書頁收成一冊",
        "線跡清楚可見\n顏色可以和封面搭配\n帶著一點手作的溫度",
      ],
    ),
    tone: "brown", displayOrder: 100, isActive: true, isPlaceholder: false,
    sourceCategory: "車線裝", priceSourceRefs: ["9-2"], quoteMode: "manual",
  },
  {
    id: "prd-traditional-thread-binding", slug: "traditional-thread-binding", title: "古書裝訂",
    description: "傳統四眼、六眼線裝與經摺裝，適合族譜、詩集與經文。",
    categoryIds: ["cat-books", "cat-creative", "cat-finishing"], cardImage: cardImageFor("traditional-thread-binding"), gallery: gallery("traditional-thread-binding", "古書裝訂", "teal"),
    basicInfo: [{ label: "估價方式", value: "需人工詢價" }, { label: "價格與交期", value: "提交需求後由專人確認" }],
    details: bindingDetails(
      ["線裝｜書頁對摺疊齊，書脊側打孔穿線", "四眼裝｜一般尺寸", "六眼裝｜大尺寸或厚本，上下角各多打一孔", "經摺裝｜長幅紙張正反摺疊，前後加硬封面"],
      ["族譜、詩集、字帖、經文、紀念文集"],
      ["線裝與經摺裝內頁皆只能單面印刷", "書背不能印字"],
      [
        "延續傳統的裝幀方式\n書頁對摺、摺口朝外\n每一頁都是厚實的雙層紙",
        "一般尺寸用四眼裝\n書本大一點、厚一點\n就在上下角各多打一孔，成為六眼裝\n讓書角更穩、不易翹起",
        "線跡落在封面上\n簡單的幾道線，就是最古典的裝飾\n拆開線還能補頁重裝\n讓重要的文字一代一代傳下去",
        "經摺裝則把長幅紙張\n像風琴一樣一正一反摺疊\n前後再加上硬封面\n攤開能一路連續閱讀，收起來又整齊方正",
      ],
    ),
    tone: "teal", displayOrder: 110, isActive: true, isPlaceholder: false, quoteMode: "manual", isOrderable: false,
  },
  {
    id: "prd-saddle-stitch", slug: "saddle-stitch", title: "騎馬釘",
    description: "紙張對摺後於書脊打釘，輕薄、快速，翻開可完全攤平。",
    categoryIds: ["cat-business", "cat-creative", "cat-finishing"], cardImage: cardImageFor("saddle-stitch"), gallery: gallery("saddle-stitch", "騎馬釘", "brown"),
    basicInfo: [{ label: "估價方式", value: "需人工詢價" }, { label: "價格與交期", value: "提交需求後由專人確認" }],
    details: bindingDetails(
      ["裝訂｜紙張對摺，書脊打釘", "頁數｜需為 4 的倍數"],
      ["型錄、簡介、活動手冊、刊物"],
      ["適合薄本，頁數多時中間會鼓起"],
      [
        "紙張對摺\n在書脊打上釘\n簡單、快速又輕薄",
        "翻開可以完全攤平\n拿在手上輕巧好翻\n最適合發送與展示",
      ],
    ),
    tone: "brown", displayOrder: 120, isActive: true, isPlaceholder: false, quoteMode: "manual",
  },
  {
    id: "prd-ring-binding", slug: "ring-binding", title: "線圈環裝",
    description: "打孔穿入線圈，可 360° 翻轉，也能完全攤平。",
    categoryIds: ["cat-books", "cat-business", "cat-finishing"], cardImage: cardImageFor("ring-binding"), gallery: gallery("ring-binding", "線圈環裝", "teal"),
    basicInfo: [{ label: "估價方式", value: "需人工詢價" }, { label: "價目表來源", value: "P13" }],
    details: bindingDetails(
      ["裝訂｜打孔後穿入線圈", "開合｜可 360° 翻轉"],
      ["筆記本、桌曆、手冊、邊看邊寫的文件"],
      ["線圈粗細依整本厚度挑選"],
      [
        "打孔後穿入線圈\n每一頁都能自由翻轉",
        "可以平攤在桌上\n也能對摺到背面\n單手拿著就能書寫",
        "搭配透明封面\n翻得再勤\n也不怕磨損",
      ],
    ),
    tone: "teal", displayOrder: 130, isActive: true, isPlaceholder: false,
    sourceCategory: "線圈／環裝", priceSourceRefs: ["P13"], quoteMode: "manual",
  },
  {
    id: "prd-butterfly-book", slug: "butterfly-book", title: "蝴蝶平、精裝",
    description: "每頁對摺裱貼，跨頁無接縫、可完全攤平，適合作品集與相片書。",
    categoryIds: ["cat-books", "cat-creative"], cardImage: cardImageFor("butterfly-book"), gallery: gallery("butterfly-book", "蝴蝶平、精裝", "brown"),
    basicInfo: [{ label: "估價方式", value: "需人工詢價" }, { label: "價目表來源", value: "10-1、10-2、10-x" }],
    details: bindingDetails(
      ["內頁｜每頁對摺裱貼", "跨頁｜無接縫", "開合｜可完全攤平"],
      ["作品集、攝影集、相片書、紀念冊"],
      ["頁面較厚，總頁數不宜太多"],
      [
        "每一頁對摺後背對背裱貼\n翻開時跨頁是同一張紙\n中間沒有任何接縫",
        "大圖可以放心橫跨兩頁\n攤在桌上\n畫面完整延伸",
        "裱貼的頁面厚實挺拔\n經得起一再翻看\n適合收藏最珍貴的畫面",
      ],
    ),
    tone: "brown", displayOrder: 140, isActive: true, isPlaceholder: false,
    sourceCategory: "蝶冊", priceSourceRefs: ["10-1", "10-2", "10-x"], quoteMode: "manual",
  },
  {
    id: "prd-menu-production", slug: "menu-production", title: "菜單螺絲裝",
    description: "螺絲固定式菜單，換季調價只要抽換單頁，不必整本重印。",
    categoryIds: ["cat-business", "cat-creative"], cardImage: cardImageFor("menu-production"), gallery: gallery("menu-production", "菜單螺絲裝", "teal"),
    basicInfo: [{ label: "估價方式", value: "需人工詢價" }, { label: "價格與交期", value: "提交需求後由專人確認" }],
    details: bindingDetails(
      [...screwStructure, "加工｜可搭配護貝內頁與護角"],
      ["餐廳、咖啡廳、飲料店菜單"],
      ["翻頁比較緊", "裝訂邊需留足白邊"],
      [
        "換季、調價的時候\n只要抽換那一頁\n不必整本重印",
        "搭配護貝內頁與護角\n耐油污、耐翻\n天天上桌也撐得住",
      ],
    ),
    tone: "teal", displayOrder: 150, isActive: true, isPlaceholder: false, quoteMode: "manual",
  },
  {
    id: "prd-q-rod-hardcover", slug: "q-rod-hardcover", title: "Q桿精裝",
    description: "精裝硬殼搭配 Q 桿書背，內頁免打孔、可隨時抽換。",
    categoryIds: ["cat-business", "cat-finishing"], cardImage: cardImageFor("q-rod-hardcover"), gallery: gallery("q-rod-hardcover", "Q桿精裝", "brown"),
    basicInfo: [{ label: "估價方式", value: "需人工詢價" }, { label: "價格與交期", value: "提交需求後由專人確認" }],
    details: bindingDetails(
      ["封面｜精裝硬殼", "書背｜換成 Q 桿夾條", "內頁｜免打孔"],
      ["提案本、報價資料、需要持續更新的文件"],
      ["適合頁數少的文件", "夾住的一側需留白邊", "無法完全攤平"],
      [
        "保留精裝的硬殼封面\n把書背換成一支 Q 桿\n內頁一夾就固定",
        "不打孔、不破壞紙張\n資料更新時抽換那幾頁就好\n正式又有彈性",
      ],
    ),
    tone: "brown", displayOrder: 160, isActive: true, isPlaceholder: false, quoteMode: "manual",
  },
  {
    id: "prd-screw-contract", slug: "screw-contract", title: "鎖螺絲合約書",
    description: "以對鎖螺絲固定成冊，結構穩固，內頁可拆裝增減。",
    categoryIds: ["cat-business", "cat-finishing"], cardImage: cardImageFor("screw-contract"), gallery: gallery("screw-contract", "鎖螺絲合約書", "teal"),
    basicInfo: [{ label: "估價方式", value: "需人工詢價" }, { label: "價目表來源", value: "11-1、11-2、附表11" }],
    details: bindingDetails(
      screwStructure,
      ["合約書、樣品冊、色卡、作品集"],
      ["翻頁比較緊，適合翻閱查找", "裝訂邊需留足白邊"],
      [
        "轉開螺絲\n就能加頁、抽頁、調整順序\n內容更新不必整本重做",
        "金屬螺絲外露\n俐落又有份量\n厚卡紙、硬板封面都能牢牢固定",
      ],
    ),
    tone: "teal", displayOrder: 170, isActive: true, isPlaceholder: false,
    sourceCategory: "螺絲裝", priceSourceRefs: ["11-1", "11-2", "附表11"], quoteMode: "manual",
  },
] as const;

/** 封面可選精裝皮革的產品，詳細頁會顯示「查看精裝皮革樣品」連結 */
export const leatherCoverSlugs: ReadonlySet<string> = new Set([
  "thesis-binding", "certificate-folder", "construction-book", "engineering-contract", "hardcover", "sewn-hardcover",
  "butterfly-book", "menu-production", "q-rod-hardcover", "screw-contract",
]);

export const activeCategories =productCategories.filter((category) => category.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
export const activeProducts = products.filter((product) => product.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
/** 可在查價與線上下單選擇的產品 */
export const orderableProducts = activeProducts.filter((product) => product.isOrderable !== false);

export function getProductBySlug(slug: string) {
  return activeProducts.find((product) => product.slug === slug);
}

export function getRelatedProducts(product: Product, limit = 3) {
  const sharedCategory = activeProducts.filter((candidate) => candidate.id !== product.id && candidate.categoryIds.some((id) => product.categoryIds.includes(id)));
  const remaining = activeProducts.filter((candidate) => candidate.id !== product.id && !sharedCategory.some((item) => item.id === candidate.id));
  return [...sharedCategory, ...remaining].slice(0, limit);
}
