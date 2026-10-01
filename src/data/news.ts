export type NewsCategory = "法規異動" | "政策動態" | "公司動態";

export interface NewsItem {
  date: string;
  category: NewsCategory;
  title: string;
}

// 輕量靜態清單，直接編輯此檔案即可更新消息（第一期不接 CMS）。
export const news: NewsItem[] = [
  {
    date: "2026.03",
    category: "法規異動",
    title: "NCC 電信管線設計規範修正重點整理",
  },
  {
    date: "2026.02",
    category: "政策動態",
    title: "台電高壓受電容量申請新制上路，對廠辦設計的影響",
  },
  {
    date: "2026.01",
    category: "公司動態",
    title: "信邦電子銅鑼廠新建工程機電監造啟動",
  },
];
