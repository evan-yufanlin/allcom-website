export interface PortfolioItem {
  id: string;
  category: string;
  title: string;
  description: string;
}

// 案名與業主是否公開呈現尚待確認（匿名化處理方式待決定），
// 目前先以真實案件佔位，正式上線前需覆核。
export const portfolio: PortfolioItem[] = [
  {
    id: "f12p7",
    category: "半導體廠辦・機電設計",
    title: "台積電 F12P7 辦公大樓新建工程",
    description: "MEP 標機電系統規劃設計",
  },
  {
    id: "post-office",
    category: "公共工程・機電設計",
    title: "中華郵政資訊中心新建工程",
    description: "28,355 M² 機電系統整合設計",
  },
  {
    id: "taichung-port",
    category: "廠辦・機電空調設計",
    title: "台中港風力發電設備廠房（一、二期）",
    description: "西門子歌美颯廠房機電空調系統設計",
  },
  {
    id: "wangzhou",
    category: "集合住宅・綠建築評估",
    title: "旺洲極品集合住宅新建工程",
    description: "綠建築候選標章（銀級）空調節能評估",
  },
];
