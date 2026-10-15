// 電信室空間檢討（docs/telecom-spec.md）。
// 純計算模組：不依賴 React，可由 scripts/verify-telecom.ts 以 node 直接執行。
import {
  A_BOXES,
  B_BOXES,
  C_BOXES,
  MDF_FRAME,
  MDF_TABLE,
  OLDF_TABLE,
  POWER_TABLE,
  ROOM_HEIGHT,
  ROOM_TABLE,
  USE_CLASSES,
  type BoxType,
} from "./telecomTables.ts";

export type Mode = "floors" | "houses" | "direct";
export type BoxMode = "bc" | "c" | "separate";
/** 表 8-1 類別 1～7、管委會（mc）、無人機械層（none） */
export type UseKey = 1 | 2 | 3 | 4 | 5 | 6 | 7 | "mc" | "none";

export interface FloorRow {
  label: string;
  floors: number;
  use: UseKey;
  units: number;
  /** 每層樓地板面積（m²） */
  area: number;
}

export interface TelecomInput {
  mode: Mode;
  above: number;
  below: number;
  fiber: boolean;
  ftth: boolean;
  singleOwner: boolean;
  /** 未引進光纜之住宅每單位超過 4 對時採用 4 對（8.3.1.3） */
  capResidential: boolean;
  boxMode: BoxMode;
  mdfDouble: boolean;
  rows: FloorRow[];
  houses: { count: number; area: number };
  direct: { pairs: number; cores: number };
  room: { length: number | null; width: number | null };
}

export interface RowResult extends FloorRow {
  unitArea: number;
  unitPairs: number;
  unitPairsNote: string;
  unitCores: number;
  unitCoax: number;
  floorPairs: number;
  floorCores: number;
  floorCoax: number;
  /** 各層配線對數（× 5/3 進位） */
  floorDist: number;
  pairs: number;
  cores: number;
  coax: number;
  dist: number;
}

export interface BoxPick {
  role: string;
  need: string;
  box: BoxType | null;
}

export interface FloorBoxes {
  label: string;
  floors: number;
  p: number;
  c: number;
  v: number;
  boxes: BoxPick[];
}

export interface TelecomResult {
  input: TelecomInput;
  rows: RowResult[];
  sumPairs: number | null;
  inPairs: number;
  cores: number;
  coax: number;
  dist: number | null;
  room: {
    required: boolean;
    reasons: string[];
    byPairs: number;
    byCores: number | null;
    row: number;
    area: number | null;
    minSide: number;
    height: number;
    check: { area: number; ok: boolean; areaOk: boolean; sideOk: boolean } | null;
  };
  pipes: { size: number; count: number; lines: string[]; flags: string[] };
  floorBoxes: FloorBoxes[];
  mainBox: BoxPick[] | null;
  mdf: { id: string | null; frames: number | null; double: boolean; width: number | null; depth: number; note: string } | null;
  oldf: { id: string; cabinets: number; kind: string } | null;
  power: (typeof POWER_TABLE)[number] | null;
  notes: string[];
}

export const fmt = (n: number, digits = 2) =>
  n.toLocaleString("zh-TW", { maximumFractionDigits: digits, minimumFractionDigits: 0 });

const ceil = (x: number) => Math.ceil(x - 1e-9);

export const coefOf = (use: UseKey, fiber: boolean) => {
  if (use === "mc" || use === "none") return 0;
  const u = USE_CLASSES[use - 1];
  return fiber ? u.fiber : u.noFiber;
};

export const USE_NAME = (use: UseKey) =>
  use === "mc" ? "管委會" : use === "none" ? "無人機械層（免計）" : `${use}. ${USE_CLASSES[use - 1].name}`;

// ---- 各層推算 ----

function rowResult(r: FloorRow, i: TelecomInput): RowResult {
  const single = i.singleOwner && r.use !== "mc";
  const units = r.use === "mc" ? 1 : single ? 1 : Math.max(1, r.units);
  const unitArea = r.area / units;
  const coef = coefOf(r.use, i.fiber);
  const raw = unitArea * coef;
  let unitPairs = 0;
  let note = "";

  if (r.use === "none") note = "無人機械層免計（8.3.1.5）";
  else if (r.use === "mc") {
    unitPairs = 2;
    note = "管委會以 2 對計";
  } else if (r.use === 7) {
    unitPairs = Math.max(ceil(raw), 2);
    note = `${fmt(unitArea)} × ${coef} ＝ ${fmt(raw)}${ceil(raw) < 2 ? " → 不足 2 對以 2 對計" : ` → ${ceil(raw)} 對`}`;
  } else if (single) {
    unitPairs = Math.max(ceil(raw), 4);
    note = `${fmt(unitArea)} × ${coef} ＝ ${fmt(raw)}${ceil(raw) < 4 ? " → 單獨所有權每層至少 4 對" : ` → ${ceil(raw)} 對`}`;
  } else if (r.use === 3 && i.fiber) {
    unitPairs = 2;
    note = `${fmt(unitArea)} × ${coef} ＝ ${fmt(raw)} → 設有光纜之住宅以 2 對計`;
  } else {
    const v = Math.max(ceil(raw), 2);
    unitPairs = r.use === 3 && i.capResidential && v > 4 ? 4 : v;
    note = `${fmt(unitArea)} × ${coef} ＝ ${fmt(raw)} → ${
      ceil(raw) < 2 ? "不足 2 對以 2 對計" : unitPairs < v ? `${v} 對，住宅得採用 4 對` : `${unitPairs} 對`
    }`;
  }

  let unitCores = 0;
  if (i.fiber && r.use !== "none" && r.use !== 7) {
    unitCores = single ? 4 : (r.use === 1 || r.use === 2) && unitArea >= 300 ? 6 : 4;
  }
  let unitCoax = 0;
  if (!i.ftth && r.use !== "none" && r.use !== 7) {
    unitCoax = r.use === "mc" || r.use === 1 || r.use === 2 || r.use === 3 ? 1 : 0;
  }

  const floorPairs = unitPairs * units;
  const floorCores = unitCores * units;
  const floorCoax = unitCoax * units;
  const floorDist = ceil((floorPairs * 5) / 3);
  const n = Math.max(1, r.floors);
  return {
    ...r,
    units,
    unitArea,
    unitPairs,
    unitPairsNote: note,
    unitCores,
    unitCoax,
    floorPairs,
    floorCores,
    floorCoax,
    floorDist,
    pairs: floorPairs * n,
    cores: floorCores * n,
    coax: floorCoax * n,
    dist: floorDist * n,
  };
}

function houseResult(i: TelecomInput): RowResult {
  const { count, area } = i.houses;
  const coef = coefOf(3, i.fiber);
  const raw = area * coef;
  let unitPairs: number;
  let note: string;
  if (i.fiber) {
    unitPairs = 2;
    note = `${fmt(area)} × ${coef} ＝ ${fmt(raw)} → 設有光纜之住宅以 2 對計`;
  } else {
    const v = Math.max(ceil(raw), 2);
    unitPairs = i.capResidential && v > 4 ? 4 : v;
    note = `${fmt(area)} × ${coef} ＝ ${fmt(raw)} → ${unitPairs < v ? `${v} 對，住宅得採用 4 對` : `${unitPairs} 對`}`;
  }
  const n = Math.max(1, count);
  const unitCores = i.fiber ? 4 : 0;
  const unitCoax = i.ftth ? 0 : 1;
  return {
    label: "各戶",
    floors: 1,
    use: 3,
    units: n,
    area: area * n,
    unitArea: area,
    unitPairs,
    unitPairsNote: note,
    unitCores,
    unitCoax,
    floorPairs: unitPairs * n,
    floorCores: unitCores * n,
    floorCoax: unitCoax * n,
    floorDist: ceil((unitPairs * 5) / 3) * n,
    pairs: unitPairs * n,
    cores: unitCores * n,
    coax: unitCoax * n,
    dist: ceil((unitPairs * 5) / 3) * n,
  };
}

// ---- 選型 ----

const pick = (list: BoxType[], ok: (b: BoxType) => boolean) => list.find(ok) ?? null;

function boxesFor(p: number, c: number, v: number, mode: BoxMode, kind: "main" | "total"): BoxPick[] {
  const out: BoxPick[] = [];
  const PC = kind === "main" ? B_BOXES : A_BOXES;
  const V = kind === "main" ? C_BOXES : A_BOXES;
  const single = (list: BoxType[], key: "p" | "c" | "v", need: number) => pick(list, (b) => b[key] >= need);
  if (mode === "c") {
    const list = kind === "main" ? C_BOXES : A_BOXES;
    out.push({
      role: "電話、光纜、同軸共用",
      need: `${p}P＋${c}C＋${v}V`,
      box: pick(list, (b) => b.shared !== null && b.shared.p >= p && b.shared.c >= c && b.shared.v >= v),
    });
    return out;
  }
  if (mode === "bc") {
    if (p > 0 || c > 0)
      out.push(
        c > 0
          ? { role: "電話、光纜共用", need: `${p}P＋${c}C`, box: pick(PC, (b) => b.shared !== null && b.shared.p >= p && b.shared.c >= c) }
          : { role: "電話", need: `${p}P`, box: single(PC, "p", p) },
      );
  } else {
    if (p > 0) out.push({ role: "電話", need: `${p}P`, box: single(PC, "p", p) });
    if (c > 0) out.push({ role: "光纜", need: `${c}C`, box: single(PC, "c", c) });
  }
  if (v > 0) out.push({ role: "同軸", need: `${v}V`, box: single(V, "v", v) });
  return out;
}

function roomRow(pairs: number, cores: number) {
  const byPairs = ROOM_TABLE.findIndex((r) => r.pairsMax === null || pairs <= r.pairsMax);
  const byCores = cores > 48 ? ROOM_TABLE.findIndex((r) => r.coresMax === null || cores <= r.coresMax) : null;
  return { byPairs, byCores, row: Math.max(byPairs, byCores ?? -1) };
}

// ---- 主計算 ----

export function calculateTelecom(i: TelecomInput): TelecomResult {
  const notes: string[] = [];
  const rows = i.mode === "floors" ? i.rows.map((r) => rowResult(r, i)) : i.mode === "houses" ? [houseResult(i)] : [];
  const sumPairs = i.mode === "direct" ? null : rows.reduce((s, r) => s + r.pairs, 0);
  const inPairs = i.mode === "direct" ? i.direct.pairs : ceil(((sumPairs ?? 0) * 4) / 3);
  const cores = i.mode === "direct" ? i.direct.cores : rows.reduce((s, r) => s + r.cores, 0);
  const coax = rows.reduce((s, r) => s + r.coax, 0);
  // 配線對數以樓層為單位（同一樓層多列合併）× 5/3 進位（8.4.1(2)）
  const perFloor = new Map<string, { floors: number; p: number }>();
  for (const r of rows) {
    const g = perFloor.get(r.label) ?? { floors: r.floors, p: 0 };
    g.p += r.floorPairs;
    perFloor.set(r.label, g);
  }
  const dist =
    i.mode === "direct"
      ? null
      : i.mode === "houses"
        ? rows.reduce((s, r) => s + r.dist, 0)
        : [...perFloor.values()].reduce((s, g) => s + ceil((g.p * 5) / 3) * Math.max(1, g.floors), 0);

  // 電信室
  const reasons: string[] = [];
  if (cores > 48) reasons.push(`用戶側光纖總心數 ${cores} 心，超過 48 心（第 9 條第 1 項第 1 款）`);
  if (i.above >= 5 && i.below >= 1 && inPairs > 20)
    reasons.push(`地上 ${i.above} 層且設有地下室，引進電話電纜總對數 ${inPairs} 對，超過 20 對（第 9 條第 1 項第 2 款）`);
  const required = reasons.length > 0;
  const rr = roomRow(inPairs, cores);
  const tr = ROOM_TABLE[rr.row];
  const L = i.room.length;
  const W = i.room.width;
  const check =
    required && L && W && L > 0 && W > 0
      ? (() => {
          const area = L * W;
          const areaOk = tr.area === null ? true : area >= tr.area - 1e-9;
          const sideOk = Math.min(L, W) >= tr.minSide - 1e-9;
          return { area, areaOk, sideOk, ok: areaOk && sideOk };
        })()
      : null;
  if (required && i.below >= 2) notes.push("地下層兩層以上，電信室以設於非最底層樓層為原則（第 9 條第 2 項）。");

  // 引進管
  const flags: string[] = [];
  const houseSingle = i.mode === "houses" && i.houses.count <= 1;
  const phoneSize = inPairs <= 10 ? 28 : inPairs <= 30 ? 41 : inPairs <= 200 ? 52 : 80;
  if (inPairs > 200 && inPairs < 300) flags.push("表 6-13 未列 201～299 對，暫以 80 mm 估計，請與電信業者洽辦確認。");
  const phoneCount = inPairs > 600 ? ceil(inPairs / 600) : 1;
  if (inPairs > 600) flags.push(`表 6-13 未列 600 對以上，暫以每 600 對 1 管 80 mm 估計（參考設計範例四），請與電信業者洽辦確認。`);
  const fiberSize = cores <= 24 ? 28 : cores <= 96 ? 41 : 52;
  const coaxSize = i.ftth ? 0 : houseSingle ? 28 : 41;
  const size = Math.max(phoneSize, fiberSize, coaxSize);
  const parts = [
    `電話電纜 ${phoneCount} 管（${inPairs} 對 → ${phoneSize} mm）`,
    `光纜 1 管（${i.fiber ? `${cores} 心` : "未設光纜，仍須預留"} → ${fiberSize} mm）`,
    ...(i.ftth ? [] : [`同軸電纜 1 管（→ ${coaxSize} mm）`]),
    ...(houseSingle ? [] : ["預備管 1 管"]),
    ...(required ? ["設置電信室另增加 4 管"] : []),
  ];
  const raw = phoneCount + 1 + (i.ftth ? 0 : 1) + (houseSingle ? 0 : 1) + (required ? 4 : 0);
  const min = required ? 8 : houseSingle ? 3 : 4;
  const count = Math.max(raw, min);
  const pipeLines = [
    ...parts,
    `合計 ${raw} 管${raw < min ? `，未達下限 ${min} 管，以 ${min} 管計` : ""}；同一處各引進管管徑相同，取 ${size} mm`,
  ];

  // 各層主配線箱
  const floorBoxes: FloorBoxes[] = [];
  if (i.mode === "floors") {
    const groups = new Map<string, { floors: number; p: number; c: number; v: number }>();
    for (const r of rows) {
      const g = groups.get(r.label) ?? { floors: r.floors, p: 0, c: 0, v: 0 };
      g.p += r.floorPairs;
      g.c += r.floorCores;
      g.v += r.floorCoax;
      groups.set(r.label, g);
    }
    for (const [label, g] of groups) {
      if (g.p + g.c + g.v === 0) continue;
      floorBoxes.push({ label, ...g, boxes: boxesFor(g.p, g.c, g.v, i.boxMode, "main") });
    }
  }
  const mainBox = required ? null : boxesFor(inPairs, cores, coax, i.boxMode, "total");

  // MDF、OLDF、電源
  let mdf: TelecomResult["mdf"] = null;
  let oldf: TelecomResult["oldf"] = null;
  let power: TelecomResult["power"] = null;
  if (required) {
    const m = MDF_TABLE.find((x) => x.inPairs >= inPairs && (dist === null || x.outPairs >= dist)) ?? null;
    const dbl = i.mdfDouble && m !== null && m.double !== null;
    const frames = m ? (dbl ? m.double! : m.single) : null;
    mdf = {
      id: m?.id ?? null,
      frames,
      double: dbl,
      width: frames ? frames * MDF_FRAME.width : null,
      depth: dbl ? MDF_FRAME.depthDouble : MDF_FRAME.depthSingle,
      note: m
        ? `${i.mdfDouble && !dbl ? "MDF-2、MDF-4 無雙側型，以單側計。" : ""}依 8.4.1 公式計算之最低需求；實際依選用電纜規格加總可能較大（參考設計範例四）。`
        : "超過 MDF-36，依比例設計（表 6-15 備註 1）。",
    };
    if (cores > 0) {
      const o = cores <= 48 ? OLDF_TABLE[0] : OLDF_TABLE.slice(1).find((x) => x.cores >= cores);
      if (o) oldf = { id: o.id, cabinets: o.cabinets, kind: o.kind };
      else {
        const cab = ceil(cores / 300);
        oldf = { id: "超過 OLDF-36", cabinets: cab % 2 ? cab + 1 : cab, kind: "落地型 19 吋 41U（每 300 心 1 只，取偶數）" };
      }
    }
    power = POWER_TABLE.find((p) => p.max === null || inPairs <= p.max) ?? null;
  }

  return {
    input: i,
    rows,
    sumPairs,
    inPairs,
    cores,
    coax,
    dist,
    room: {
      required,
      reasons,
      byPairs: rr.byPairs,
      byCores: rr.byCores,
      row: rr.row,
      area: tr.area,
      minSide: tr.minSide,
      height: ROOM_HEIGHT,
      check,
    },
    pipes: { size, count, lines: pipeLines, flags },
    floorBoxes,
    mainBox,
    mdf,
    oldf,
    power,
    notes,
  };
}

export function defaultTelecomInput(): TelecomInput {
  return {
    mode: "floors",
    above: 0,
    below: 0,
    fiber: true,
    ftth: false,
    singleOwner: false,
    capResidential: true,
    boxMode: "bc",
    mdfDouble: false,
    rows: [],
    houses: { count: 1, area: 0 },
    direct: { pairs: 0, cores: 0 },
    room: { length: null, width: null },
  };
}

// ---- 說明文字 ----

export const BOX_MODE_NAME: Record<BoxMode, string> = {
  bc: "電話、光纜共用 B 型＋同軸 C 型",
  c: "電話、光纜、同軸共用 C 型",
  separate: "分開設置（電話 B 型、光纜 B 型、同軸 C 型）",
};

export const REMINDERS = [
  "電信室面積除表 13-1 外，另需考量總配線架、光終端配線架、電源設備及其工作空間（13.1.3）。",
  "用戶自用之 PBX、網路設施等，應另依實際需求預留獨立空間（13.2.1）。",
  "電信室不得設於衛浴室下方或與（污）水槽共用一道牆；高壓電力、水管、污水管、瓦斯及排煙等管線不得穿越（13.2.2、13.2.3）。",
  "應設於維修人員進出方便、通風排水良好、不淹水、乾燥之處；地板應具能減少灰塵之光滑表面處理（13.2.4）。",
  "應為密閉式並具防火、防水、排水設施；消防設施依消防法規辦理，惟不得使用撒水器（13.2.5）。",
  "面積 14 m² 以上：隔間採砌磚牆，預留鐵或鋁製單扇防火門（約寬 0.9 m、高 1.8 m）；未滿 14 m²：隔間及出入門採防火材質（13.2.6）。",
  "電信室室外應有 1 m 以上寬度之通道，可自由進出通往樓梯或其他通道（13.2.7）。",
  "應預留空間供放置空調設備；大樓設有緊急發電機者，得設置緊急電源迴路（13.2.8、13.2.9）。",
  "地上與地下總樓層超過十層或佈纜距離超過 90 m 時，得於適當樓層設置主配線箱（室）-IC（13.2.13）。",
];

export const PIPE_REMINDERS = [
  "引進管彎曲半徑應為管外徑 6 倍以上，各彎曲點角度和不得超過 180°；地下引進管長度以 25 m 為限（15.2）。",
  "管徑較大者得以多管數等面積容量替代；重要或特殊建築物得分散多路由引進（15.1.3）。",
];

export const DISCLAIMER = "本計算結果僅供規劃設計參考，實際電信設備及空間仍以洽辦電信事業、有線廣播電視系統經營者及審驗機構審查結果為準。";
