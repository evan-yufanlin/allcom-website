export type PortfolioCategory = "公共工程" | "廠辦" | "住宅開發";

export interface PortfolioItem {
  id: string;
  category: PortfolioCategory;
  title: string;
  description: string;
}

// 決定不做匿名化，直接使用真實案名與業主；內容整理自公司簡介與舊官網「實績」頁。
// 上線前仍需逐一與業主確認是否同意公開列名。
export const portfolio: PortfolioItem[] = [
  // 廠辦
  {
    id: "f12p7",
    category: "廠辦",
    title: "台積電 F12P7 辦公大樓新建工程",
    description: "MEP 標機電系統規劃設計｜40,000 M²",
  },
  {
    id: "post-office",
    category: "廠辦",
    title: "中華郵政資訊中心新建工程",
    description: "機電系統整合設計｜28,355 M²",
  },
  {
    id: "taichung-port",
    category: "廠辦",
    title: "台中港風力發電設備廠房（一、二期）",
    description: "西門子歌美颯廠房機電空調系統設計｜合計約 14,248 M²",
  },
  {
    id: "merck-jade-park",
    category: "廠辦",
    title: "默克 Jade Park – Package B",
    description: "機電系統規劃設計｜21,659 M²",
  },
  {
    id: "xinbon",
    category: "廠辦",
    title: "信邦電子銅鑼廠房新建工程",
    description: "機電空調系統設計（含無塵室 10K）｜61,000 M²",
  },
  {
    id: "bozhi",
    category: "廠辦",
    title: "博智電子龍潭二廠新建工程",
    description: "機電系統規劃設計｜25,000 M²",
  },
  {
    id: "otsuka",
    category: "廠辦",
    title: "大塚製藥中壢廠倉庫新建工程",
    description: "機電系統規劃設計",
  },
  {
    id: "gcs",
    category: "廠辦",
    title: "格棋化合物半導體二廠電氣工程",
    description: "電氣系統設計｜7,000 KW",
  },
  {
    id: "shinkong",
    category: "廠辦",
    title: "新光鶯歌廠房新建工程",
    description: "機電系統規劃設計",
  },

  // 公共工程
  {
    id: "yilan-library",
    category: "公共工程",
    title: "宜蘭縣立圖書館新建工程",
    description: "機電設計｜7,000 M²",
  },
  {
    id: "longshan-elementary",
    category: "公共工程",
    title: "新竹市龍山國小校園整體規劃暨老舊校舍拆除重建工程",
    description: "機電設計",
  },
  {
    id: "ntou",
    category: "公共工程",
    title: "國立海洋大學海洋生物培育館新建工程",
    description: "機電空調設計",
  },
  {
    id: "miaoli-hospital",
    category: "公共工程",
    title: "苗栗醫院急診大樓及醫療大樓裝修案",
    description: "機電空調設計｜9,500 萬",
  },
  {
    id: "vgh-taipei",
    category: "公共工程",
    title: "臺北榮民總醫院第一門診 2 樓整修工程",
    description: "機電設計",
  },
  {
    id: "new-taipei-market",
    category: "公共工程",
    title: "新北市公有零售市場及攤集場(區)水電設備改善工程",
    description: "設計監造技術服務（開口契約）｜約 3,460 萬",
  },

  // 住宅開發
  {
    id: "wangzhou",
    category: "住宅開發",
    title: "旺洲極品集合住宅新建工程",
    description: "綠建築候選標章（銀級）空調節能評估",
  },
  {
    id: "shulin",
    category: "住宅開發",
    title: "樹林區東昇段集合住宅新建工程（高層建築）",
    description: "機電系統規劃設計",
  },
  {
    id: "shimen-irrigation",
    category: "住宅開發",
    title: "臺灣石門農田水利會：桃園市八德區福興段 920 地號興建住商大樓統包工程",
    description: "機電系統規劃設計",
  },
];

export const portfolioCategories: PortfolioCategory[] = ["廠辦", "公共工程", "住宅開發"];
