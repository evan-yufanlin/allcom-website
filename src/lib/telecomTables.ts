// 電信室空間檢討：技術規範與管理規則之對照表（docs/telecom-spec.md）。

export const SOURCES = {
  rules: "建築物電信設備及空間設置使用管理規則",
  spec: "建築物屋內外電信設備設置技術規範（2021）",
} as const;

/** 表 8-1 建築物使用類別電話電纜對數估計係數（對/m²） */
export const USE_CLASSES = [
  { id: 1, name: "證券業、市場攤位", noFiber: 0.1, fiber: 0.05 },
  { id: 2, name: "商業用、辦公用", noFiber: 0.1, fiber: 0.05 },
  { id: 3, name: "住宅用（含透天式獨戶店鋪、住宅）", noFiber: 0.03, fiber: 0.015 },
  { id: 4, name: "醫院、飯店、旅社、休閒娛樂場所", noFiber: 0.02, fiber: 0.02 },
  { id: 5, name: "學校、工廠、教室等之辦公室部分", noFiber: 0.02, fiber: 0.02 },
  { id: 6, name: "工廠、教室、宗教聚會場所、大型購物中心", noFiber: 0.006, fiber: 0.006 },
  { id: 7, name: "停車場、緊急避難所、倉庫、農舍、電氣及機械機房", noFiber: 0.002, fiber: 0.002 },
] as const;

/** 表 13-1 電信室面積一覽表（上限 max 為 null 表示以上） */
export const ROOM_TABLE: { pairsMax: number | null; pairsLabel: string; coresMax: number | null; coresLabel: string; area: number | null; minSide: number }[] = [
  { pairsMax: 200, pairsLabel: "200 以下（但必須設置電信室者）", coresMax: 96, coresLabel: "49～96", area: 3.6, minSide: 1.5 },
  { pairsMax: 600, pairsLabel: "201～600", coresMax: 300, coresLabel: "97～300", area: 7, minSide: 1.5 },
  { pairsMax: 1000, pairsLabel: "601～1000", coresMax: 600, coresLabel: "301～600", area: 14, minSide: 2.5 },
  { pairsMax: 2000, pairsLabel: "1001～2000", coresMax: 1200, coresLabel: "601～1200", area: 20, minSide: 2.5 },
  { pairsMax: 4000, pairsLabel: "2001～4000", coresMax: 2400, coresLabel: "1201～2400", area: 30, minSide: 2.5 },
  { pairsMax: 6000, pairsLabel: "4001～6000", coresMax: 4800, coresLabel: "2401～4800", area: 43, minSide: 2.5 },
  { pairsMax: null, pairsLabel: "6001 以上", coresMax: null, coresLabel: "4801 以上", area: null, minSide: 2.5 },
];

export const ROOM_HEIGHT = 2.1;

/** 表 13-2 建築物電信室電源設備需求表 */
export const POWER_TABLE: { max: number | null; label: string; kva: number | null; mccb: string; circuits: number; outlets: number; supply: string }[] = [
  { max: 50, label: "50 以下（須設電信室者）", kva: 3, mccb: "2P30AT", circuits: 3, outlets: 2, supply: "1φ3W 220/110V" },
  { max: 100, label: "51～100", kva: 4, mccb: "2P30AT", circuits: 3, outlets: 2, supply: "1φ3W 220/110V" },
  { max: 200, label: "101～200", kva: 6, mccb: "2P30AT", circuits: 3, outlets: 2, supply: "1φ3W 220/110V" },
  { max: 400, label: "201～400", kva: 11, mccb: "2P50AT", circuits: 3, outlets: 3, supply: "1φ3W 220/110V" },
  { max: 600, label: "401～600", kva: 14, mccb: "2P75AT", circuits: 3, outlets: 4, supply: "1φ3W 220/110V" },
  { max: 1000, label: "601～1000", kva: 16, mccb: "2P75AT", circuits: 3, outlets: 4, supply: "1φ3W 220/110V" },
  { max: 2000, label: "1001～2000", kva: 18, mccb: "2P75AT", circuits: 6, outlets: 4, supply: "1φ3W 220/110V" },
  { max: 4000, label: "2001～4000", kva: 50, mccb: "3P100AT", circuits: 12, outlets: 6, supply: "3φ4W 380/220V" },
  { max: 6000, label: "4001～6000", kva: 50, mccb: "3P100AT", circuits: 18, outlets: 6, supply: "3φ4W 380/220V" },
  { max: null, label: "6001 以上", kva: null, mccb: "另洽電信事業", circuits: 0, outlets: 0, supply: "—" },
];

/** 表 6-13 引進管管徑適用表 */
export const PIPE_TABLE = [
  { kind: "架空電纜", range: "—", mm: 28, inch: "1" },
  { kind: "地下電纜", range: "10 對以下電話電纜或單戶透天建築物之同軸電纜", mm: 28, inch: "1" },
  { kind: "地下電纜", range: "30 對以下電話電纜或同軸電纜", mm: 41, inch: "1½" },
  { kind: "地下電纜", range: "200 對以下電話電纜", mm: 52, inch: "2" },
  { kind: "地下電纜", range: "300～600 對電話電纜", mm: 80, inch: "3" },
  { kind: "光纜", range: "24 心以下", mm: 28, inch: "1" },
  { kind: "光纜", range: "96 心以下", mm: 41, inch: "1½" },
  { kind: "光纜", range: "超過 96 心", mm: 52, inch: "2" },
];

/** 表 6-14 主幹線纜對數適用管徑參照表 */
export const RISER_TABLE = [
  { kind: "電纜", range: "30 對以下", mm: 28 as number | null, inch: "1" },
  { kind: "電纜", range: "100 對以下", mm: 41 as number | null, inch: "1½" },
  { kind: "電纜", range: "200 對以下", mm: 52 as number | null, inch: "2" },
  { kind: "電纜", range: "300 對以上", mm: null as number | null, inch: "採用線架或線槽" },
  { kind: "電纜", range: "同軸電纜", mm: 41 as number | null, inch: "1½" },
  { kind: "光纜", range: "24 心以下", mm: 28 as number | null, inch: "1" },
  { kind: "光纜", range: "96 心以下", mm: 41 as number | null, inch: "1½" },
  { kind: "光纜", range: "超過 96 心", mm: 52 as number | null, inch: "2" },
];

export interface BoxType {
  id: string;
  /** 內部尺寸 寬×高×深（cm） */
  size: [number, number, number];
  /** 單獨收容端子數（對） */
  p: number;
  /** 單獨收容光纜心數 */
  c: number;
  /** 單獨收容同軸電纜線數 */
  v: number;
  /** 共用時之收容量；null 表示不可共用 */
  shared: { p: number; c: number; v: number } | null;
  /** 收容垂直管數 */
  pipes?: number;
}

/** 表 6-9 主配線箱種類及其收容電信線數（一） */
export const B_BOXES: BoxType[] = [
  { id: "B-12", size: [30, 35, 10], p: 10, c: 0, v: 0, shared: null, pipes: 2 },
  { id: "B-22", size: [30, 40, 10], p: 20, c: 0, v: 0, shared: null, pipes: 2 },
  { id: "B-23", size: [38, 40, 10], p: 20, c: 0, v: 0, shared: null, pipes: 3 },
  { id: "B-32", size: [40, 45, 10], p: 30, c: 8, v: 0, shared: { p: 10, c: 2, v: 0 }, pipes: 2 },
  { id: "B-33", size: [48, 45, 10], p: 30, c: 12, v: 0, shared: { p: 20, c: 4, v: 0 }, pipes: 3 },
  { id: "B-54", size: [56, 45, 10], p: 50, c: 24, v: 0, shared: { p: 20, c: 8, v: 0 }, pipes: 4 },
  { id: "B-84", size: [56, 65, 10], p: 80, c: 36, v: 0, shared: { p: 40, c: 16, v: 0 }, pipes: 4 },
  { id: "B-104", size: [56, 80, 10], p: 100, c: 48, v: 0, shared: { p: 60, c: 24, v: 0 }, pipes: 4 },
  { id: "B-155", size: [63, 80, 10], p: 150, c: 60, v: 0, shared: { p: 80, c: 36, v: 0 }, pipes: 5 },
  { id: "B-205", size: [63, 100, 10], p: 200, c: 72, v: 0, shared: { p: 100, c: 48, v: 0 }, pipes: 5 },
  { id: "B-305", size: [63, 120, 10], p: 300, c: 96, v: 0, shared: { p: 150, c: 60, v: 0 }, pipes: 5 },
  { id: "B-406", size: [93, 145, 10], p: 400, c: 192, v: 0, shared: { p: 200, c: 96, v: 0 }, pipes: 6 },
];

/** 表 6-10 主配線箱種類及其收容電信線數（二） */
export const C_BOXES: BoxType[] = [
  { id: "C-33", size: [48, 45, 14], p: 0, c: 0, v: 2, shared: null, pipes: 3 },
  { id: "C-54", size: [56, 45, 14], p: 0, c: 0, v: 6, shared: null, pipes: 4 },
  { id: "C-84", size: [56, 65, 14], p: 0, c: 0, v: 8, shared: { p: 20, c: 8, v: 2 }, pipes: 4 },
  { id: "C-104", size: [56, 80, 14], p: 0, c: 0, v: 12, shared: { p: 40, c: 12, v: 3 }, pipes: 4 },
  { id: "C-155", size: [63, 80, 14], p: 0, c: 0, v: 16, shared: { p: 60, c: 16, v: 4 }, pipes: 5 },
  { id: "C-205", size: [63, 100, 14], p: 0, c: 0, v: 24, shared: { p: 80, c: 32, v: 8 }, pipes: 5 },
  { id: "C-305", size: [63, 120, 14], p: 0, c: 0, v: 32, shared: { p: 100, c: 48, v: 12 }, pipes: 5 },
  { id: "C-406", size: [93, 145, 14], p: 0, c: 0, v: 48, shared: { p: 150, c: 64, v: 16 }, pipes: 6 },
];

/** 表 6-8 總配線箱種類及其收容之電信線數（用戶側端子；共用欄為用戶側） */
export const A_BOXES: BoxType[] = [
  { id: "A-04-1", size: [45, 50, 14], p: 40, c: 12, v: 4, shared: { p: 20, c: 8, v: 0 } },
  { id: "A-04-2", size: [30, 60, 14], p: 40, c: 12, v: 4, shared: { p: 20, c: 8, v: 0 } },
  { id: "A-06", size: [45, 80, 14], p: 60, c: 16, v: 8, shared: { p: 40, c: 12, v: 0 } },
  { id: "A-1", size: [63, 80, 14], p: 100, c: 24, v: 12, shared: { p: 60, c: 8, v: 2 } },
  { id: "A-2-1", size: [103, 80, 14], p: 200, c: 36, v: 16, shared: { p: 100, c: 12, v: 3 } },
  { id: "A-2-2", size: [63, 145, 14], p: 200, c: 36, v: 16, shared: { p: 100, c: 12, v: 3 } },
  { id: "A-4", size: [93, 145, 14], p: 400, c: 36, v: 24, shared: { p: 200, c: 24, v: 6 } },
];

/** 表 6-15 總配線架種類 */
export const MDF_TABLE: { id: string; inPairs: number; outPairs: number; single: number; double: number | null }[] = [
  { id: "MDF-2", inPairs: 200, outPairs: 300, single: 2, double: null },
  { id: "MDF-4", inPairs: 400, outPairs: 500, single: 3, double: null },
  { id: "MDF-6", inPairs: 600, outPairs: 800, single: 5, double: 3 },
  { id: "MDF-8", inPairs: 800, outPairs: 1000, single: 5, double: 3 },
  { id: "MDF-10", inPairs: 1000, outPairs: 1300, single: 6, double: 3 },
  { id: "MDF-12", inPairs: 1200, outPairs: 1500, single: 7, double: 4 },
  { id: "MDF-14", inPairs: 1400, outPairs: 1800, single: 8, double: 4 },
  { id: "MDF-16", inPairs: 1600, outPairs: 2000, single: 8, double: 4 },
  { id: "MDF-18", inPairs: 1800, outPairs: 2300, single: 9, double: 5 },
  { id: "MDF-20", inPairs: 2000, outPairs: 2500, single: 10, double: 5 },
  { id: "MDF-22", inPairs: 2200, outPairs: 2800, single: 11, double: 6 },
  { id: "MDF-24", inPairs: 2400, outPairs: 3000, single: 12, double: 6 },
  { id: "MDF-26", inPairs: 2600, outPairs: 3300, single: 13, double: 7 },
  { id: "MDF-28", inPairs: 2800, outPairs: 3500, single: 14, double: 7 },
  { id: "MDF-30", inPairs: 3000, outPairs: 3800, single: 15, double: 8 },
  { id: "MDF-32", inPairs: 3200, outPairs: 4000, single: 16, double: 8 },
  { id: "MDF-34", inPairs: 3400, outPairs: 4300, single: 17, double: 9 },
  { id: "MDF-36", inPairs: 3600, outPairs: 4500, single: 18, double: 9 },
];

/** 圖 6-3 總配線架構（mm） */
export const MDF_FRAME = { width: 190, height: 2000, depthSingle: 320, depthDouble: 640 };

/** 表 6-16 光終端配線架種類 */
export const OLDF_TABLE: { id: string; cores: number; cabinets: number; kind: string }[] = [
  { id: "OLDF-048", cores: 48, cabinets: 1, kind: "壁掛式 19 吋 15U" },
  { id: "OLDF-3", cores: 300, cabinets: 1, kind: "落地型 19 吋 41U" },
  { id: "OLDF-6", cores: 600, cabinets: 2, kind: "落地型 19 吋 41U" },
  { id: "OLDF-12", cores: 1200, cabinets: 4, kind: "落地型 19 吋 41U" },
  { id: "OLDF-18", cores: 1800, cabinets: 6, kind: "落地型 19 吋 41U" },
  { id: "OLDF-24", cores: 2400, cabinets: 8, kind: "落地型 19 吋 41U" },
  { id: "OLDF-30", cores: 3000, cabinets: 10, kind: "落地型 19 吋 41U" },
  { id: "OLDF-36", cores: 3600, cabinets: 12, kind: "落地型 19 吋 41U" },
];

/** 規則第 9 條 */
export const RULE9 = {
  room: [
    "用戶側光纜總心數超過四十八心。",
    "地上層五樓以上且設有地下室之建築物，引進電話電纜總對數超過二十對。",
  ],
  fiber: [
    "公有建築物。",
    "集合住宅。",
    "總樓地板面積在一千平方公尺以上，且為公共集會類、商業類、學校教學場所（宿舍除外）、辦公服務類或住宅之建築物。",
  ],
};
