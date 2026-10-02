export type NewsCategory = "法規異動" | "政策動態" | "公司動態";

export interface NewsAttachment {
  label: string;
  // 檔案請放在 public/documents/ 下，這裡填相對路徑，例如 "/documents/xxx.pdf"。
  href: string;
  // 下載時的預設檔名（選填）。
  fileName?: string;
}

export interface NewsPageImage {
  // 公文頁面圖片，放在 public/news/<slug>/ 下。
  src: string;
  width: number;
  height: number;
}

export interface NewsItem {
  // 有 slug 才會產生內頁 /news/<slug>。
  slug?: string;
  date: string;
  category: NewsCategory;
  title: string;
  summary?: string;
  // 內頁「重點整理」，每項一段；子項目用 children。
  points?: { text: string; children?: string[] }[];
  // 內頁公文圖片（由 PDF 逐頁轉 JPG）。
  pages?: NewsPageImage[];
  attachment?: NewsAttachment;
}

const a4 = (src: string): NewsPageImage => ({ src, width: 1241, height: 1754 });

// 輕量靜態清單，直接編輯此檔案即可更新消息（第一期不接 CMS）。
// 每則消息可選擇附上原始公文/對照表 PDF（attachment），比照舊官網做法。
export const news: NewsItem[] = [
  {
    slug: "2026-09-taipei-sewer-pipe-marking",
    date: "2026.09.30",
    category: "法規異動",
    title: "臺北市污水管材識別新制，115年10月1日起實施",
    summary:
      "建築線內污水管渠，除橘紅色塑化類管材外，新增可採「管材性能合格」並具污水管或 SP 標示、水流方向箭頭及橘紅色環之識別管材。",
    points: [
      {
        text: "建築線內污水管渠，除原本的「橘紅色塑化類管材」外，新增可採用「管材性能合格」並具備下列識別之管材：",
        children: ["「污水管」或「SP」標示", "實際水流方向箭頭", "橘紅色環"],
      },
      { text: "適用範圍：臺北市建築物污水下水道用戶排水設備設置之設計及變更設計審查。" },
      {
        text: "依據：臺北市政府工務局衛生下水道工程處 115年9月30日北市工衛營字第1153051435號函，附件為施工注意事項（115.09.30 修正）。",
      },
    ],
    pages: [1, 2, 3].map((n) => a4(`/news/2026-09-taipei-sewer-pipe-marking/p${n}.jpg`)),
    attachment: {
      label: "下載公文 PDF",
      href: "/documents/2026-09-taipei-sewer-pipe-marking.pdf",
      fileName: "臺北市衛工處_污水管材識別新制_1153051435.pdf",
    },
  },
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

export const newsWithPage = news.filter((n): n is NewsItem & { slug: string } => Boolean(n.slug));
