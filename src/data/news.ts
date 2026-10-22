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
    slug: "2026-10-taipower-supply-capacity",
    date: "2026.10.16",
    category: "政策動態",
    title: "台電重申用電計畫書核供容量之保留與有效期限，逾期未申請或未繳費部分即予釋出",
    summary:
      "核供容量並非永久保留；用戶須於核供函有效期限內提出正式用電申請並完成繳費，逾期須重新提出用電計畫書，由台電重新檢討。",
    points: [
      {
        text: "依營業規章第5條第3項，新增設用電合計契約容量達 1,000 瓩者，須事先提出新增設用電計畫書，經台電檢討供電引接方式後，始辦理正式申請用電手續。",
      },
      {
        text: "因近期用電計畫書案件大幅增加、電網可供容量有限，台電重申核供容量及有效期限之處理原則：",
        children: [
          "核供容量依當時系統供電裕度檢討核定，並非永久保留；用戶應於核供函有效期限內向各區營業處提出正式用電申請，並於繳費通知函所定期限內完成繳費，始得保留該契約容量。",
          "有效期限屆滿尚未提出正式申請者，核供函所載引供方式及核供容量失其效力；未申請或未繳費部分之契約容量，於期限屆滿後即予釋出。",
          "日後如仍有用電需求，須重新提出用電計畫書，依當時供電情形及申請順序重新檢討，不以原核供函內容為準。",
        ],
      },
      {
        text: "規劃用電時應據實評估用電需求及時程，並留意核供函有效期限；如有特高壓用電需求，建議及早提出，避免影響供電期程。",
      },
      {
        text: "另依營業規章第71條，外線工程除用戶選擇自備外，係由用戶繳付線路設置費由台電施設；線路所有權屬台電，並得視需要引供其他用戶。",
      },
      { text: "依據：台灣電力公司 115年10月16日電業字第1158122520號函。" },
    ],
    pages: [1, 2].map((n) => a4(`/news/2026-10-taipower-supply-capacity/p${n}.jpg`)),
    attachment: {
      label: "下載公文 PDF",
      href: "/documents/2026-10-taipower-supply-capacity.pdf",
      fileName: "台電_用電計畫書核供容量保留及有效期限_1158122520.pdf",
    },
  },
  {
    slug: "2026-10-taipower-inspection-rules",
    date: "2026.10.01",
    category: "法規異動",
    title: "台電修正「新增設用戶用電設備檢驗要點」，115年10月9日起受理新制竣工報告",
    summary:
      "配合用戶用電設備檢驗辦法修正，竣工試驗報告須由法定單位出具；由用電設備檢驗維護業出具者，須檢附公會會員證明單。",
    points: [
      {
        text: "配合經濟部 115年4月9日修正之「用戶用電設備檢驗辦法」第8條，台電修正檢驗要點第五點：送電前之竣工試驗報告，應由下列單位之一出具：",
        children: [
          "中央主管機關或其認可之檢驗機構",
          "登記合格之用電設備檢驗維護業",
          "監造電機技師之執業機構或所屬機關（本次新增）",
        ],
      },
      {
        text: "自 115年10月9日起，竣工試驗報告由用電設備檢驗維護業出具者，須檢附公會會員證明單，黏貼於竣工報告單背面之黏貼處。",
      },
      {
        text: "修正前版本之竣工報告單得沿用，惟須於背面黏貼處加註「用電設備檢驗維護工程工業同業公會會員證明（竣工用）」字樣。",
      },
      {
        text: "依據：台灣電力公司 115年10月1日電配字第1158118256號函。完整 PDF 含修正後檢驗要點、第五點修正對照表及相關附件。",
      },
    ],
    pages: [1, 2].map((n) => a4(`/news/2026-10-taipower-inspection-rules/p${n}.jpg`)),
    attachment: {
      label: "下載完整 PDF（含附件，57 頁）",
      href: "/documents/2026-10-taipower-inspection-rules.pdf",
      fileName: "台電_新增設用戶用電設備檢驗要點修正_1158118256.pdf",
    },
  },
  {
    slug: "2026-10-taipower-rgms-online-review",
    date: "2026.10.01",
    category: "政策動態",
    title: "台電試行「圖文管理系統（RGMS）設計資料審查線上化」，彰化、高雄區營業處先行",
    summary:
      "115年10月5日至116年2月3日試行，彰化區及高雄區營業處服務區內之新設、既設等各類案件，可於 RGMS 系統線上送審用電設備設計資料。",
    points: [
      { text: "試行期間：115年10月5日至116年2月3日。" },
      { text: "試辦範圍：台電彰化區營業處及高雄區營業處服務區內，包含新設、既設等各類型案件。" },
      { text: "系統網址：https://service.taipower.com.tw/rgms" },
      {
        text: "區處檢驗課收件後，依「用戶用電設備檢驗辦法」第5條第2項進行重點審查，並依第7條規定之審查期限完成審查並回復申請者。",
      },
      {
        text: "依據：台灣電力公司配電處 115年10月1日配字第1158119661號函。函附之試運行啟始會議紀錄及系統操作說明未收錄於本頁。",
      },
    ],
    pages: [a4("/news/2026-10-taipower-rgms-online-review/p1.jpg")],
    attachment: {
      label: "下載公文 PDF",
      href: "/documents/2026-10-taipower-rgms-online-review.pdf",
      fileName: "台電配電處_RGMS設計資料審查線上化試行_1158119661.pdf",
    },
  },
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
    slug: "2026-04-taiwan-water-annex-11-1",
    date: "2026.04.23",
    category: "法規異動",
    title: "台水修正申裝作業要點附件十一之一「各種建築物面積推算法用水量對照表」",
    summary:
      "115年3月版附件十一之一因排版偏移，建築物用途與一日平均使用水量對應錯誤；台水重新檢送修正版，自即日起以修正版本為準。",
    points: [
      {
        text: "台水 115年4月9日函頒修正「用戶用水設備申裝作業要點」（115年3月版），其中附件十一之一因排版格式偏移，致「建築物用途」與「一日平均使用水量」等對應內容產生誤差。",
      },
      { text: "台水檢送修正後之附件十一之一（115年4月）及修正對照表，自即日起應以修正版本為準，前次發布之同份表格停止適用。" },
      {
        text: "修正後各建築物用途之數值與臺北自來水事業處規範表2-9 相同；本公司「給水水理計算」工具已依修正版更新原始表格。",
      },
      { text: "依據：台灣自來水公司 115年4月23日台水營字第1150013983號函（承辦人聯絡資料已略去）。" },
    ],
    pages: [a4("/news/2026-04-taiwan-water-annex-11-1/p1.jpg"), a4("/news/2026-04-taiwan-water-annex-11-1/p2.jpg"), { src: "/news/2026-04-taiwan-water-annex-11-1/p3.jpg", width: 1754, height: 1241 }],
    attachment: {
      label: "下載完整 PDF（含修正後表格及修正對照表）",
      href: "/documents/2026-04-taiwan-water-annex-11-1.pdf",
      fileName: "台水_申裝作業要點附件十一之一修正_1150013983.pdf",
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
