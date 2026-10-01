export type NewsCategory = "法規異動" | "政策動態" | "公司動態";

export interface NewsAttachment {
  label: string;
  // 檔案請放在 public/documents/ 下，這裡填相對路徑，例如 "/documents/xxx.pdf"。
  href: string;
}

export interface NewsItem {
  date: string;
  category: NewsCategory;
  title: string;
  summary?: string;
  attachment?: NewsAttachment;
}

// 輕量靜態清單，直接編輯此檔案即可更新消息（第一期不接 CMS）。
// 每則消息可選擇附上原始公文/對照表 PDF（attachment），比照舊官網做法。
export const news: NewsItem[] = [
  {
    date: "2026.03",
    category: "法規異動",
    title: "NCC 電信管線設計規範修正重點整理",
    summary: "彙整本次修正對電信管線設計的實務影響，並附上公告原文供下載。",
    // attachment: { label: "下載公告原文 PDF", href: "/documents/ncc-xxx.pdf" },
  },
  {
    date: "2026.02",
    category: "政策動態",
    title: "台電高壓受電容量申請新制上路，對廠辦設計的影響",
    summary: "整理新制申請流程重點，並附上台電公告對照表供下載。",
    // attachment: { label: "下載對照表 PDF", href: "/documents/taipower-xxx.pdf" },
  },
  {
    date: "2026.01",
    category: "公司動態",
    title: "電子零組件廠新建工程機電監造啟動",
  },
];
