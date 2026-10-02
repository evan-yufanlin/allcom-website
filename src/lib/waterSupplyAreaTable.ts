// 僅供畫面參考，不出現在 PDF（不列入 PDF 字型子集來源）。
// ---- 各種建築物面積推算法用水量對照表（北水表2-9；台水附件十一之一數值相同） ----

export interface AreaTableRow {
  use: string;
  litres: string;
  hours: string;
  user: string;
  density: string;
  ratio: string;
}

const D = "〃";

/** 依北水表2-9 之對位謄錄；空白欄位為表列未訂。 */
export const AREA_TABLE: AreaTableRow[] = [
  { use: "辦公室", litres: "100～120", hours: "8", user: "等於在勤者1人", density: "0.2人/m²", ratio: "辦公室60；一般55～57" },
  { use: "政府辦公室・銀行", litres: "100～120", hours: "8", user: "等於僱員1人", density: "0.2人/m²", ratio: "和辦公室相同" },
  { use: "醫院", litres: "高級1,000以上；中級500以上；其他250以上", hours: "10", user: "等於1病床（外來客8、職員120、看護160）", density: "相當人病床3.5人", ratio: "45～48" },
  { use: "寺院・教會", litres: "10", hours: "2", user: "1次參會者", density: "", ratio: "" },
  { use: "劇場", litres: "30", hours: "5", user: "等於客席1人", density: "", ratio: "53～55" },
  { use: "電視院", litres: "10", hours: "3", user: "等於總人員", density: "相當客席1.5人", ratio: "" },
  { use: "百貨公司", litres: "3", hours: "8", user: "等於客人1人", density: "1.0人/m²", ratio: "55～60" },
  { use: "店鋪", litres: "100", hours: "7", user: "店員100ℓ；常住160ℓ", density: "0.16人/m²", ratio: "" },
  { use: "小賣市場", litres: "40", hours: "6", user: "等於客人1人", density: "", ratio: "" },
  { use: "大眾餐廳", litres: "15", hours: "7", user: D, density: "1.0人/m²", ratio: "" },
  { use: "料理店", litres: "30", hours: "5", user: D, density: "1.0人/m²", ratio: "" },
  { use: "酒吧", litres: "30", hours: "6", user: D, density: "", ratio: "" },
  { use: "社交俱樂部", litres: "30", hours: "", user: D, density: "", ratio: "" },
  { use: "夜間俱樂部", litres: "120～350", hours: "", user: "等於客席1人", density: "", ratio: "" },
  { use: "住宅", litres: "160～200", hours: "8～10", user: "等於居住者1人", density: "0.16人/m²", ratio: "50～53" },
  { use: "高級住宅", litres: "250", hours: "8～10", user: D, density: "0.16人/m²", ratio: "42～45" },
  { use: "公寓", litres: "160～250", hours: "8～10", user: D, density: "0.16人/m²", ratio: "45～50" },
  { use: "公寓（無廚房）", litres: "100", hours: "8～10", user: D, density: "", ratio: "" },
  { use: "宿舍", litres: "120", hours: "8", user: D, density: "0.2人", ratio: "" },
  { use: "大飯店", litres: "250～300", hours: "10", user: "等於客數", density: "0.17人", ratio: "" },
  { use: "旅館", litres: "200", hours: "10", user: D, density: "0.24人", ratio: "" },
  { use: "俱樂部住宅", litres: "150～200", hours: "", user: "來訪者", density: "15～150人", ratio: "" },
  { use: "小、中學", litres: "40～50", hours: "5～6", user: "等於學生", density: "0.25～0.14人", ratio: "58～60" },
  { use: "高等學校以上", litres: "80（教師1人相當100）", hours: "6", user: D, density: "0.1人", ratio: "" },
  { use: "研究所", litres: "100～200", hours: "8", user: "等於所員1人", density: "0.06人", ratio: "" },
  { use: "圖書館", litres: "25", hours: "6", user: "等於閱覽者1人", density: "0.4人", ratio: "" },
  { use: "工廠", litres: "60～140（男80，女100）", hours: "8", user: "等於輪班1人", density: "座作業0.2人；立作業0.1人", ratio: "" },
  { use: "停車場、車站", litres: "3", hours: "15", user: "乘降客數", density: "", ratio: "" },
];

export const AREA_TABLE_IMAGES = {
  taipei: { src: "/tools/water-supply/taipei-table-2-9.jpg", label: "北水表2-9 原始表格" },
  taiwan: { src: "/tools/water-supply/taiwan-annex-11-1.jpg", label: "台水附件十一之一 原始表格" },
} as const;
