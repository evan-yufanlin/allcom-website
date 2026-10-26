// 緊急發電機室（docs/generator-spec.md）。
// 純計算模組：不依賴 React，可由 scripts/verify-generator.ts 以 node 直接執行。
import { CATALOGS, GENSETS, TANKS, TANK_SOURCE, seriesOf, type GenSet } from "../data/generators.ts";

/** 計算用機組（型錄機組或自訂機組） */
export interface GenUnit {
  label: string;
  standbyKw: number;
  /** [長, 寬, 高]（mm） */
  size: [number, number, number];
  /** 機組附油箱（L）；無或未列為 null */
  baseTank: number | null;
  /** 型錄滿載耗油量（L/h）；無則依係數估算 */
  fuel: number | null;
}

/** 操作面位置：長邊（前側）或發電機端 */
export type OpSide = "long" | "end";

/** 機組四周留設距離（mm）：散熱水箱端（排風側）、發電機端、前側（長邊）、後側（長邊，日用油箱側） */
export interface Clearances {
  radiator: number;
  alternator: number;
  front: number;
  back: number;
}

export interface GenInput {
  unit: GenUnit;
  opSide: OpSide;
  clear: Clearances;
  /** 運轉時數（h），不低於 2 */
  hours: number;
  /** 防液堤牆厚（mm） */
  dikeWall: number;
  /** 散熱水箱風量（m³/min） */
  radiatorFlow: number | null;
  /** 燃燒空氣量（m³/min） */
  combustionFlow: number | null;
  intakeVelocity: number;
  exhaustVelocity: number;
  freeRatio: number;
  ductVelocity: number;
}

export const MIN_HOURS = 2;
/** 機房內油箱合計上限（L，汎德慣例，低於管制量） */
export const ROOM_TANK_LIMIT = 950;
/** 柴油管制量（L） */
export const CONTROL_QTY = 1000;
/** 油箱充填率（110.6 決議） */
export const FILL_RATIO = 0.9;
/** 防液堤與油箱最小距離（mm） */
export const DIKE_OFFSET = 500;
export const DIKE_MIN_H = 200;
export const DIKE_MAX_H = 1500;
/** 110.6 決議：操作部 1 m、檢修面 0.6 m */
export const OP_CLEAR = 1000;
export const SERVICE_CLEAR = 600;

export const fmt = (n: number, digits = 2) => n.toLocaleString("zh-TW", { maximumFractionDigits: digits, minimumFractionDigits: 0 });

const ceil = (x: number) => Math.ceil(x - 1e-9);

export function defaultClearances(op: OpSide): Clearances {
  return op === "long"
    ? { radiator: SERVICE_CLEAR, alternator: SERVICE_CLEAR, front: OP_CLEAR, back: SERVICE_CLEAR }
    : { radiator: SERVICE_CLEAR, alternator: OP_CLEAR, front: SERVICE_CLEAR, back: SERVICE_CLEAR };
}

export function defaultGenInput(unit: GenUnit): GenInput {
  return {
    unit,
    opSide: "long",
    clear: defaultClearances("long"),
    hours: MIN_HOURS,
    dikeWall: 150,
    radiatorFlow: null,
    combustionFlow: null,
    intakeVelocity: 2.5,
    exhaustVelocity: 5,
    freeRatio: 0.4,
    ductVelocity: 8,
  };
}

export const unitOf = (g: GenSet): GenUnit => ({
  label: `${seriesOf(g.series).brand} ${g.model}（${g.engine}）`,
  standbyKw: g.standbyKw,
  size: g.size!,
  baseTank: g.baseTank,
  fuel: g.fuel,
});

// ---- 選型 ----

export type Basis = "kva" | "kw";

/** 各系列 Standby 容量 ≧ 需求之最小機型（同容量多種引擎全列）；型錄未列尺寸者略過。 */
export function pickGensets(required: number, basis: Basis): GenSet[] {
  const out: GenSet[] = [];
  const bySeries = new Map<string, GenSet[]>();
  for (const g of GENSETS) {
    if (!g.size) continue;
    const cap = basis === "kva" ? g.standbyKva : g.standbyKw;
    if (cap < required) continue;
    bySeries.set(g.series, [...(bySeries.get(g.series) ?? []), g]);
  }
  for (const list of bySeries.values()) {
    const cap = (g: GenSet) => (basis === "kva" ? g.standbyKva : g.standbyKw);
    const min = Math.min(...list.map(cap));
    out.push(...list.filter((g) => cap(g) === min));
  }
  return out;
}

// ---- 計算 ----

export interface Tank {
  capacity: number;
  size: [number, number, number];
  leg: number;
}

export interface Dike {
  /** 與油箱距離（mm） */
  offset: number;
  inner: [number, number];
  outer: [number, number];
  /** 計算所需堤高（mm） */
  needHeight: number;
  height: number;
}

export interface Louver {
  flow: number;
  velocity: number;
  freeArea: number;
  grossArea: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GenResult {
  input: GenInput;
  /** 耗油量（L/h） */
  fuelRate: number;
  /** 依係數估算（暫定） */
  fuelEstimated: boolean;
  factor: number | null;
  hours: number;
  /** 所需油量（L）＝ 耗油量 × 時數 */
  needFuel: number;
  /** 所需容積（L）＝ 所需油量 ÷ 0.9 */
  needVolume: number;
  baseTank: number;
  /** 獨立日用油箱需求、可設上限（L） */
  sepNeed: number;
  sepLimit: number;
  tank: Tank | null;
  dike: Dike | null;
  /** 機房內油箱合計（L） */
  roomTank: number;
  storage: number;
  roomMultiple: number;
  storageMultiple: number;
  length: number;
  width: number;
  area: number;
  lengthLine: string;
  widthLine: string;
  /** 平面配置（mm，原點為機房左上角；左為散熱水箱端、上為後側） */
  layout: { gen: Rect; dike: Rect | null; tank: Rect | null };
  exhaust: Louver | null;
  intake: Louver | null;
  exhaustDuct: number | null;
  intakeDuct: number | null;
  warnings: string[];
}

export function estimateFactor(kw: number) {
  return kw < 500 ? 0.31 : 0.27;
}

function louver(flow: number, velocity: number, ratio: number): Louver {
  const freeArea = velocity > 0 ? flow / 60 / velocity : 0;
  return { flow, velocity, freeArea, grossArea: ratio > 0 ? freeArea / ratio : 0 };
}

function makeDike(t: Tank, wall: number): Dike {
  const k = t.leg + t.size[2];
  const offset = Math.max(DIKE_OFFSET, k / 5);
  const inner: [number, number] = [t.size[0] + 2 * offset, t.size[1] + 2 * offset];
  const needHeight = (t.capacity * 1e6) / (inner[0] * inner[1]);
  return { offset, inner, outer: [inner[0] + 2 * wall, inner[1] + 2 * wall], needHeight, height: Math.max(DIKE_MIN_H, ceil(needHeight)) };
}

export function calculateGenerator(i: GenInput): GenResult {
  const u = i.unit;
  const warnings: string[] = [];
  const [L, W] = u.size;

  // 耗油量
  const fuelEstimated = !(u.fuel && u.fuel > 0);
  const factor = fuelEstimated ? estimateFactor(u.standbyKw) : null;
  const fuelRate = fuelEstimated ? u.standbyKw * factor! : u.fuel!;

  // 時數與油量
  const hours = Math.max(MIN_HOURS, i.hours || 0);
  if ((i.hours || 0) < MIN_HOURS) warnings.push(`運轉時數低於 ${MIN_HOURS} 小時（用戶用電設備裝置規則第 979 條、消防設備緊急電源最長 2 小時），以 ${MIN_HOURS} 小時計。`);
  const needFuel = fuelRate * hours;
  const needVolume = needFuel / FILL_RATIO;

  // 日用油箱
  const baseTank = u.baseTank ?? 0;
  const sepNeed = Math.max(0, needVolume - baseTank);
  const sepLimit = Math.max(0, ROOM_TANK_LIMIT - baseTank);
  let tank: Tank | null = null;
  if (sepNeed > 1e-9) {
    const fits = TANKS.filter((t) => t.capacity <= sepLimit);
    tank = fits.find((t) => t.capacity >= sepNeed - 1e-9) ?? fits[fits.length - 1] ?? null;
    if (tank) tank = { capacity: tank.capacity, size: [...tank.size], leg: tank.leg };
  }
  const dike = tank ? makeDike(tank, i.dikeWall) : null;
  if (dike && dike.needHeight > DIKE_MAX_H) warnings.push(`防液堤所需高度 ${fmt(dike.needHeight, 0)} mm 超過 ${DIKE_MAX_H} mm，請加大防液堤面積。`);
  const roomTank = baseTank + (tank?.capacity ?? 0);
  const storage = Math.max(0, needVolume - roomTank);
  const roomMultiple = roomTank / CONTROL_QTY;
  const storageMultiple = storage / CONTROL_QTY;
  if (roomTank >= CONTROL_QTY)
    warnings.push(`機房內油箱合計 ${fmt(roomTank, 0)} L，已達管制量（${fmt(roomMultiple)} 倍），應依公共危險物品設置標準設儲存場所。`);
  if (storage > 0 && storage >= CONTROL_QTY)
    warnings.push(`儲油槽 ${fmt(storage, 1)} L 已達管制量（${fmt(storageMultiple)} 倍），應依公共危險物品設置標準第 20 條設儲存場所。`);
  if (storage > 0 && (storage > 40 * CONTROL_QTY || storage > 20000)) warnings.push("儲油槽超過管制量 40 倍或 20,000 L，不得採室內儲槽（辦法第 33 條）。");

  // 留設距離提醒
  const c = i.clear;
  const minOf = (k: keyof Clearances) => (i.opSide === "long" ? (k === "front" ? OP_CLEAR : SERVICE_CLEAR) : k === "alternator" ? OP_CLEAR : SERVICE_CLEAR);
  for (const k of Object.keys(CLEAR_LABEL) as (keyof Clearances)[]) {
    if (c[k] < minOf(k)) warnings.push(`${clearLabel(k, i.opSide)} ${fmt(c[k], 0)} mm 小於 110.6 決議 ${fmt(minOf(k), 0)} mm。`);
  }

  // 機房尺寸與配置
  const genRun = c.radiator + L + c.alternator;
  const dikeL = dike ? dike.outer[0] : 0;
  const dikeW = dike ? dike.outer[1] : 0;
  const length = Math.max(genRun, dikeL);
  const width = c.front + W + c.back + dikeW;
  const gen: Rect = { x: c.radiator, y: dikeW + c.back, w: L, h: W };
  const dikeRect = dike ? { x: length - dikeL, y: 0, w: dikeL, h: dikeW } : null;
  const tankRect =
    dike && tank ? { x: dikeRect!.x + i.dikeWall + dike.offset, y: i.dikeWall + dike.offset, w: tank.size[0], h: tank.size[1] } : null;
  const lengthLine =
    dikeL > genRun
      ? `max（${fmt(c.radiator, 0)} ＋ ${fmt(L, 0)} ＋ ${fmt(c.alternator, 0)}，防液堤外長 ${fmt(dikeL, 0)}）＝ ${fmt(length, 0)} mm`
      : `${fmt(c.radiator, 0)} ＋ ${fmt(L, 0)} ＋ ${fmt(c.alternator, 0)} ＝ ${fmt(length, 0)} mm`;
  const widthLine = `${fmt(c.front, 0)} ＋ ${fmt(W, 0)} ＋ ${fmt(c.back, 0)}${dike ? ` ＋ 防液堤外寬 ${fmt(dikeW, 0)}` : ""} ＝ ${fmt(width, 0)} mm`;

  // 百葉
  const rad = i.radiatorFlow && i.radiatorFlow > 0 ? i.radiatorFlow : null;
  const comb = i.combustionFlow && i.combustionFlow > 0 ? i.combustionFlow : 0;
  const exhaust = rad ? louver(rad, i.exhaustVelocity, i.freeRatio) : null;
  const intake = rad ? louver(rad + comb, i.intakeVelocity, i.freeRatio) : null;
  const duct = (q: number) => (i.ductVelocity > 0 ? q / 60 / i.ductVelocity : 0);
  if (rad && !comb) warnings.push("未輸入燃燒空氣量，進氣量僅計散熱水箱風量。");

  return {
    input: i,
    fuelRate,
    fuelEstimated,
    factor,
    hours,
    needFuel,
    needVolume,
    baseTank,
    sepNeed,
    sepLimit,
    tank,
    dike,
    roomTank,
    storage,
    roomMultiple,
    storageMultiple,
    length,
    width,
    area: (length * width) / 1e6,
    lengthLine,
    widthLine,
    layout: { gen, dike: dikeRect, tank: tankRect },
    exhaust,
    intake,
    exhaustDuct: exhaust ? duct(exhaust.flow) : null,
    intakeDuct: intake ? duct(intake.flow) : null,
    warnings,
  };
}

// ---- 說明文字 ----

export const CLEAR_LABEL: Record<keyof Clearances, string> = {
  radiator: "散熱水箱端（排風側）",
  alternator: "發電機端",
  front: "前側長邊",
  back: "後側長邊（日用油箱側）",
};

export function clearLabel(k: keyof Clearances, op: OpSide) {
  const isOp = (op === "long" && k === "front") || (op === "end" && k === "alternator");
  return `${CLEAR_LABEL[k]}${isOp ? "・操作面" : ""}`;
}

export const SOURCES = {
  rule: "用戶用電設備裝置規則（114年5月9日修正，第九章自115年5月9日施行）",
  equipment: "建築技術規則建築設備編（111年12月29日修正）",
  fire: "各類場所消防安全設備設置標準（113年4月24日修正）",
  hazmat: "公共危險物品及可燃性高壓氣體製造儲存處理場所設置標準暨安全管理辦法（113年7月16日修正）",
  moi: "內政部110年6月消防安全法令執法疑義研討會決議提案三（110.7.6 內授消字第1100824408號函）",
  louver: "Airolite（Greenheck）Louver Fundamentals 應用指南",
} as const;

export const FIRE_DURATIONS: { item: string; time: string; cite: string }[] = [
  { item: "室內消防栓、自動撒水、泡沫等", time: "30 分鐘", cite: "第 38 條" },
  { item: "排煙設備", time: "30 分鐘", cite: "第 188、189 條" },
  { item: "公共危險物品場所消防栓、撒水、水霧", time: "45 分鐘", cite: "第 209～212 條" },
  { item: "氣體滅火設備", time: "1 小時", cite: "第 95 條" },
  { item: "防災監控系統綜合操作裝置", time: "2 小時", cite: "第 192 條之 1" },
];

export const DEFINITIONS: { term: string; def: string; basis: string }[] = [
  { term: "百葉總面積", def: "百葉外框之寬 × 高，即外牆應留設之開口大小。", basis: "Louver Fundamentals P.1" },
  { term: "淨開口面積（free area）", def: "百葉總面積扣除葉片及邊框阻擋後，空氣可自由通過之面積。", basis: "Louver Fundamentals P.1" },
  { term: "開口率", def: "淨開口面積 ÷ 百葉總面積。", basis: "Louver Fundamentals P.1" },
  { term: "淨開口風速", def: "風量 ÷ 淨開口面積；本工具輸入之百葉風速即為淨開口風速。", basis: "Louver Fundamentals P.3" },
];

export const NOTES = {
  clearance: "預設距離依110.6決議：操作部（前面）1 m 以上、供檢修之面 0.6 m 以上；可調大以預留配電盤（前方低壓 1.0 m、高壓 1.2 m）、蓄電池（距機組 0.6 m、距牆 0.1 m）等空間。",
  size: "型錄尺寸為開放型參考值；防音型、屋外型尺寸較大，請洽廠商。",
  fuel: "未列耗油量之機型依 Standby kW 估算（暫定）：未滿 500 kW 取 0.31 L/kWh，500 kW 以上取 0.27 L/kWh（依中興電工型錄滿載耗油量回推）。",
  tank: "機房內油箱（機組附油箱＋獨立日用油箱）合計以 950 L 為上限（低於柴油管制量 1,000 L）；油箱可用油量以容積 90% 計（110.6 決議）。",
  dike: "防液堤（110.6 決議，參考尺寸）：容量為油箱容量 100% 以上、高度 200～1,500 mm、與油箱距離 K/5 或 500 mm 以上（K 為油箱上側距地面高度）。",
  hours: "運轉時數不低於 2 小時：用戶用電設備裝置規則第 979 條（全載運轉至少二小時之日用燃料），且涵蓋消防設備緊急電源最長時間（防災監控 2 小時）。",
  louver: "型錄無散熱風量、燃燒空氣量，請依廠商資料輸入；風速、開口率為設計假設值，非法規值。",
} as const;

export const REMINDERS = [
  "機房以 1 小時以上防火時效之牆壁、樓板及防火門窗區劃（110.6 決議；設備編第 7 條之 1）。",
  "進、排風管應為專用，原則上不貫穿防火區劃（必須貫穿時依設計施工編第 85 條）。",
  "引擎排氣管應為專用，直接排至屋外或連接煙囪，不得接一般排氣管道，並注意斷熱。",
  "通風換氣設備、機房照明及燃料輸送幫浦之電源，應能由發電機（緊急電源系統）供電。",
  "日用油箱設防液堤及集液設施（200 × 200 mm、深 100 mm 以上），標示「少量公共危險物品，嚴禁煙火」；送油管出口閥裝置於 1,500 mm 以下。",
  "全載一日耗油量是否構成一般處理場所（辦法第 7 條），依主管機關認定。",
  "機房淨高未計算：機組高度另加排氣管、消音器、導風罩及吊裝空間，依廠商資料檢討。",
  "發電機容量應依緊急電源容量計算基準核算。",
];

export const SOURCE_LIST = [
  `${SOURCES.rule}：第 979 條`,
  `${SOURCES.equipment}：第 7 條之 1`,
  `${SOURCES.fire}：第 38、95、188、189、192 條之 1、209～212 條`,
  `${SOURCES.hazmat}：第 7、20、33、41 條、附表一（柴油第四類第二石油類管制量 1,000 L）`,
  SOURCES.moi,
  `${CATALOGS.teco}；${CATALOGS.chem}`,
  TANK_SOURCE,
  `${SOURCES.louver}：P.1、P.3`,
];

export function fuelLines(r: GenResult): string[] {
  const u = r.input.unit;
  const out = [
    r.fuelEstimated
      ? `耗油量 ＝ ${fmt(u.standbyKw)} kW × ${r.factor} L/kWh ＝ ${fmt(r.fuelRate, 1)} L/h（暫定）`
      : `耗油量 ＝ 型錄滿載 ${fmt(r.fuelRate, 1)} L/h`,
    `所需容積 ＝ ${fmt(r.fuelRate, 1)} × ${fmt(r.hours, 1)} h ÷ 0.9 ＝ ${fmt(r.needVolume, 1)} L`,
  ];
  if (r.baseTank > 0) out.push(`機組附油箱 ${fmt(r.baseTank, 0)} L${r.baseTank >= r.needVolume ? " ≧ 所需容積，不另設日用油箱" : ""}`);
  if (r.tank && r.dike) {
    out.push(
      `日用油箱：需求 ${fmt(r.sepNeed, 1)} L（上限 ${fmt(r.sepLimit, 0)} L）→ ${fmt(r.tank.capacity, 0)} L（${r.tank.size.join("×")} mm，腳架 ${r.tank.leg}）`,
      `防液堤內 ＝ (${r.tank.size[0]} ＋ 2×${fmt(r.dike.offset, 0)}) × (${r.tank.size[1]} ＋ 2×${fmt(r.dike.offset, 0)}) ＝ ${fmt(r.dike.inner[0], 0)} × ${fmt(r.dike.inner[1], 0)} mm`,
      `防液堤高 ＝ ${fmt(r.tank.capacity, 0)} L ÷ 堤內面積 ＝ ${fmt(r.dike.needHeight, 0)} mm → ${fmt(r.dike.height, 0)} mm（最低 200）`,
    );
  } else if (r.sepNeed > 0 && !r.tank) {
    out.push(`機房內已無可設日用油箱之容量（上限 950 L）`);
  }
  out.push(
    `機房內油箱合計 ${fmt(r.roomTank, 0)} L ÷ 1,000 L ＝ 管制量 ${fmt(r.roomMultiple)} 倍`,
    r.storage > 0
      ? `儲油槽 ＝ ${fmt(r.needVolume, 1)} − ${fmt(r.roomTank, 0)} ＝ ${fmt(r.storage, 1)} L（管制量 ${fmt(r.storageMultiple)} 倍）`
      : "儲油槽：機房內油箱已足，不需設置",
  );
  return out;
}

export function louverLines(r: GenResult): string[] {
  const i = r.input;
  const pct = fmt(i.freeRatio * 100, 1);
  const l = (name: string, x: NonNullable<GenResult["exhaust"]>, duct: number) =>
    `${name}：風量 ${fmt(x.flow, 1)} m³/min ÷ 60 ÷ ${x.velocity} ＝ 淨開口 ${fmt(x.freeArea)} m²；÷ ${pct}% ＝ 百葉總面積 ${fmt(x.grossArea)} m²；風管 ${fmt(duct)} m²`;
  return [l("排氣（散熱水箱風量）", r.exhaust!, r.exhaustDuct!), l("進氣（散熱＋燃燒空氣）", r.intake!, r.intakeDuct!)];
}

export const DISCLAIMER = "本計算結果僅供規劃設計參考，實際機組、油箱及通風設備仍應依相關法規及設備廠商資料檢討。";
