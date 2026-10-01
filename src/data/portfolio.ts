export type PortfolioCategory = "公共工程" | "廠辦" | "住宅開發";

export interface PortfolioItem {
  id: string;
  category: PortfolioCategory;
  title: string;
  description: string;
}

// 決定將案名/業主匿名化處理，不具名呈現。
export const portfolio: PortfolioItem[] = [
  // 廠辦
  {
    id: "fab-office",
    category: "廠辦",
    title: "半導體廠區辦公大樓新建工程",
    description: "MEP 標機電系統規劃設計｜40,000 M²",
  },
  {
    id: "postal-center",
    category: "廠辦",
    title: "公家機構資訊中心新建工程",
    description: "機電系統整合設計｜28,355 M²",
  },
  {
    id: "wind-plant",
    category: "廠辦",
    title: "港區風力發電設備廠房（一、二期）",
    description: "機電空調系統設計｜合計約 14,248 M²",
  },
  {
    id: "pharma-park",
    category: "廠辦",
    title: "國際藥廠生產園區機電工程",
    description: "機電系統規劃設計｜21,659 M²",
  },
  {
    id: "electronics-plant",
    category: "廠辦",
    title: "電子零組件廠新建工程",
    description: "機電空調系統設計（含無塵室 10K）｜61,000 M²",
  },
  {
    id: "electronics-plant-2",
    category: "廠辦",
    title: "電子廠二期新建工程",
    description: "機電系統規劃設計｜25,000 M²",
  },
  {
    id: "pharma-warehouse",
    category: "廠辦",
    title: "製藥廠倉庫新建工程",
    description: "機電系統規劃設計",
  },
  {
    id: "compound-semi",
    category: "廠辦",
    title: "化合物半導體廠電氣工程",
    description: "電氣系統設計｜7,000 KW",
  },
  {
    id: "factory-expansion",
    category: "廠辦",
    title: "廠房新建工程",
    description: "機電系統規劃設計",
  },

  // 公共工程
  {
    id: "county-library",
    category: "公共工程",
    title: "縣立圖書館新建工程",
    description: "機電設計｜7,000 M²",
  },
  {
    id: "elementary-school",
    category: "公共工程",
    title: "國小校園整體規劃暨老舊校舍拆除重建工程",
    description: "機電設計",
  },
  {
    id: "university-lab",
    category: "公共工程",
    title: "大學海洋生物培育館新建工程",
    description: "機電空調設計",
  },
  {
    id: "hospital-renovation",
    category: "公共工程",
    title: "醫院急診大樓及醫療大樓裝修案",
    description: "機電空調設計｜9,500 萬",
  },
  {
    id: "medical-center",
    category: "公共工程",
    title: "醫學中心門診整修工程",
    description: "機電設計",
  },
  {
    id: "public-market",
    category: "公共工程",
    title: "公有零售市場及攤集場(區)水電設備改善工程",
    description: "設計監造技術服務（開口契約）｜約 3,460 萬",
  },

  // 住宅開發
  {
    id: "residential-green",
    category: "住宅開發",
    title: "集合住宅新建工程",
    description: "綠建築候選標章（銀級）空調節能評估",
  },
  {
    id: "residential-highrise",
    category: "住宅開發",
    title: "高層集合住宅新建工程",
    description: "機電系統規劃設計",
  },
  {
    id: "mixed-use-building",
    category: "住宅開發",
    title: "住商大樓統包工程",
    description: "機電系統規劃設計",
  },
];

export const portfolioCategories: PortfolioCategory[] = ["廠辦", "公共工程", "住宅開發"];
