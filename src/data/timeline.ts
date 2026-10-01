export interface TimelineItem {
  year: string;
  text: string;
}

// 案件/業主匿名化處理，不具名呈現。
export const timeline: TimelineItem[] = [
  { year: "2011", text: "成立汎德電機冷凍空調技師事務所" },
  { year: "2016", text: "改制為汎德工程顧問股份有限公司" },
  { year: "2014–16", text: "承接半導體廠區辦公大樓 MEP 標機電設計" },
  { year: "2018–20", text: "完成公家機構資訊中心新建工程機電設計" },
  { year: "2020–23", text: "港區風力發電設備廠房一、二期機電空調設計" },
];
