// 自設變電站空間檢討（docs/substation-spec.md）。
// 純計算模組：不依賴 React，可由 scripts/verify-substation.ts 以 node 直接執行。
import { LV_TRANSFORMERS } from "../data/transformers.ts";

export type Group = "panel" | "oil" | "cast" | "lv" | "custom";
export type Door = "single" | "double" | "none";
export type Facing = "down" | "up";

export interface Equip {
  name: string;
  group: Group;
  width: number;
  depth: number;
  height?: number;
  door: Door;
}

export interface LibraryItem extends Equip {
  id: string;
  /** 下拉選單分組（未設定時依 group） */
  menu?: string;
}

export const SOURCE = "配電盤廠商提供之標準圖（尺寸由圖面判讀）";

export const GROUP_NAME: Record<Group, string> = {
  panel: "配電盤",
  oil: "油浸式變壓器",
  cast: "模鑄式變壓器",
  lv: "低壓變壓器",
  custom: "自訂",
};

export const DOOR_NAME: Record<Door, string> = { single: "單門", double: "雙開門", none: "無門" };

const panel = (name: string, width = 1200): LibraryItem => ({ id: `panel-${name}`, name, group: "panel", width, depth: 1800, door: "single" });

const OIL: [number, number, number][] = [
  [150, 800, 1190],
  [200, 900, 1240],
  [300, 900, 1340],
  [400, 1000, 1465],
  [500, 1100, 1585],
  [750, 1200, 1810],
  [1000, 1200, 1920],
  [1500, 1500, 2160],
  [2000, 1600, 2240],
  [2500, 2500, 1970],
  [3000, 2500, 1860],
];

const CAST: [string, number, number, number][] = [
  ["400 以下", 1900, 1600, 2350],
  ["500～750", 2100, 1800, 2350],
  ["1250～1500", 2300, 1800, 2600],
  ["2000", 2500, 1800, 2600],
  ["2500", 2900, 1800, 2700],
  ["3000", 2900, 2000, 2950],
];

export const LIBRARY: LibraryItem[] = [
  panel("MOF", 1600),
  ...["DS", "MVCB", "VCB", "MR", "MP", "SC", "EMP"].map((n) => panel(n)),
  ...OIL.map(([kva, width, depth]): LibraryItem => ({
    id: `oil-${kva}`,
    name: `油 ${kva}kVA`,
    group: "oil",
    width,
    depth,
    door: "none",
  })),
  ...CAST.map(([kva, width, depth, height]): LibraryItem => ({
    id: `cast-${kva}`,
    name: `模鑄 ${kva}kVA`,
    group: "cast",
    width,
    depth,
    height,
    door: "double",
  })),
  ...(["cast", "dry"] as const).flatMap((k) =>
    (["IP00", "IP20"] as const).flatMap((ip) =>
      LV_TRANSFORMERS[k].map(([kva, h0, l0, w0, , h2, l2, w2]): LibraryItem => {
        const type = k === "cast" ? "低壓模鑄" : "低壓乾式";
        const menu = `${k === "cast" ? "低壓模鑄式" : "低壓乾式"} ${ip}${ip === "IP00" ? "（無外箱）" : "（附外箱）"}`;
        return {
          id: `lv-${k}-${ip.toLowerCase()}-${kva}`,
          name: `${type} ${ip} ${kva}kVA`,
          menu,
          group: "lv",
          width: ip === "IP00" ? l0 : l2,
          depth: ip === "IP00" ? w0 : w2,
          height: ip === "IP00" ? h0 : h2,
          door: "none",
        };
      }),
    ),
  ),
];

export const libraryItem = (id: string) => {
  const it = LIBRARY.find((x) => x.id === id);
  if (!it) throw new Error(`unknown equipment ${id}`);
  return it;
};

export interface Clearances {
  front: number;
  rear: number;
  faceToFace: number;
  backToBack: number;
  left: number;
  right: number;
}

/** 用戶用電設備裝置規則第 1009 條第 4 款（115.11.4 修正）：高壓電度表接線箱前方工作空間（mm）；高壓電度表裝於 MOF 盤內 */
export const METER_HV_CLEAR = 1500;

export const DEFAULT_CLEARANCES: Clearances = { front: 1800, rear: 800, faceToFace: 2000, backToBack: 800, left: 1500, right: 500 };

export const CLEARANCE_LABEL: Record<keyof Clearances, string> = {
  front: "盤前操作通道",
  rear: "盤後維修通道",
  faceToFace: "列與列前側面對面",
  backToBack: "列與列背對背",
  left: "左端離牆（MOF、變壓器側）",
  right: "右端離牆",
};

export interface RowInput {
  facing: Facing;
  items: Equip[];
}

export interface PlacedItem extends Equip {
  x: number;
  /** 設備上緣 y（前緣對齊，較淺之設備靠前側） */
  y: number;
}

export interface RowResult {
  index: number;
  facing: Facing;
  y: number;
  depth: number;
  length: number;
  items: PlacedItem[];
}

export interface Gap {
  label: string;
  size: number;
  y: number;
}

export interface SubstationResult {
  clearances: Clearances;
  rows: RowResult[];
  /** 由上而下之深度分段（間距與列深交錯） */
  segments: { label: string; size: number; y: number; kind: "gap" | "row" }[];
  length: number;
  depth: number;
  area: number;
  lengthLine: string;
  depthLine: string;
  warnings: string[];
}

export const doorRadius = (e: Equip) => (e.door === "single" ? e.width : e.door === "double" ? e.width / 2 : 0);

const fmt = (n: number) => n.toLocaleString("zh-TW", { maximumFractionDigits: 1 });

/** 兩側為前側（true）或背側（false）時之間距；null 表示牆。 */
function gapBetween(c: Clearances, a: boolean | null, b: boolean | null): { size: number; label: string } {
  if (a === null || b === null) {
    const side = a ?? b;
    return side ? { size: c.front, label: "盤前" } : { size: c.rear, label: "盤後" };
  }
  if (a && b) return { size: c.faceToFace, label: "面對面" };
  if (!a && !b) return { size: c.backToBack, label: "背對背" };
  return { size: c.front, label: "盤前" };
}

export function calculateSubstation(rows: RowInput[], c: Clearances): SubstationResult {
  const active = rows.filter((r) => r.items.length > 0);
  const segments: SubstationResult["segments"] = [];
  const placed: RowResult[] = [];
  let y = 0;

  active.forEach((r, i) => {
    // 本列上側是否為前側：前側朝上即上側為前
    const topFront = r.facing === "up";
    const prev = active[i - 1];
    const gap = gapBetween(c, prev ? prev.facing === "down" : null, topFront);
    segments.push({ label: gap.label, size: gap.size, y, kind: "gap" });
    y += gap.size;

    const depth = Math.max(...r.items.map((e) => e.depth));
    let x = c.left;
    const items = r.items.map((e) => {
      const it: PlacedItem = { ...e, x, y: r.facing === "down" ? y + depth - e.depth : y };
      x += e.width;
      return it;
    });
    const length = x - c.left;
    placed.push({ index: i + 1, facing: r.facing, y, depth, length, items });
    segments.push({ label: `第${i + 1}列`, size: depth, y, kind: "row" });
    y += depth;
  });

  if (active.length) {
    const last = active[active.length - 1];
    const gap = gapBetween(c, last.facing === "down", null);
    segments.push({ label: gap.label, size: gap.size, y, kind: "gap" });
    y += gap.size;
  }

  const longest = placed.reduce((m, r) => Math.max(m, r.length), 0);
  const length = active.length ? c.left + longest + c.right : 0;
  const depth = active.length ? y : 0;
  const top = placed.find((r) => r.length === longest);

  return {
    clearances: c,
    rows: placed,
    segments,
    length,
    depth,
    area: (length * depth) / 1e6,
    lengthLine: top ? `${fmt(c.left)} ＋ ${fmt(longest)}（第${top.index}列設備合計）＋ ${fmt(c.right)} ＝ ${fmt(length)}` : "",
    depthLine: segments.length ? `${segments.map((s) => fmt(s.size)).join(" ＋ ")} ＝ ${fmt(depth)}` : "",
    warnings: [...meterWarnings(placed, segments), ...doorWarnings(placed, segments)],
  };
}

function meterWarnings(rows: RowResult[], segments: SubstationResult["segments"]) {
  const out: string[] = [];
  rows.forEach((r) => {
    if (!r.items.some((e) => e.name === "MOF")) return;
    const k = segments.findIndex((s) => s.kind === "row" && s.y === r.y);
    const front = segments[r.facing === "down" ? k + 1 : k - 1];
    if (front && front.size < METER_HV_CLEAR)
      out.push(
        `第${r.index}列 MOF 盤（內含高壓電度表）前方工作空間 ${fmt(front.size)}，小於用戶用電設備裝置規則第 1009 條 ${fmt(METER_HV_CLEAR)}。`,
      );
  });
  return out;
}

function doorWarnings(rows: RowResult[], segments: SubstationResult["segments"]) {
  const out: string[] = [];
  const gapAfter = (r: RowResult) => segments[segments.findIndex((s) => s.kind === "row" && s.y === r.y) + 1];
  const gapBefore = (r: RowResult) => segments[segments.findIndex((s) => s.kind === "row" && s.y === r.y) - 1];

  rows.forEach((r, i) => {
    const front = r.facing === "down" ? gapAfter(r) : gapBefore(r);
    const neighbor = r.facing === "down" ? rows[i + 1] : rows[i - 1];
    const neighborFacesUs = neighbor && (r.facing === "down" ? neighbor.facing === "up" : neighbor.facing === "down");
    if (neighborFacesUs) {
      if (r.facing !== "down") return; // 面對面只檢查一次
      let need = 0;
      for (const a of r.items)
        for (const b of neighbor.items)
          if (a.x < b.x + b.width && b.x < a.x + a.width) need = Math.max(need, doorRadius(a) + doorRadius(b));
      if (need > front.size)
        out.push(`第${r.index}列與第${neighbor.index}列前側面對面：門扇需約 ${fmt(need)}，現為 ${fmt(front.size)}。`);
    } else {
      const need = Math.max(0, ...r.items.map(doorRadius));
      if (need > front.size) out.push(`第${r.index}列前側：門扇需約 ${fmt(need)}，超出前方空間 ${fmt(front.size)}。`);
    }
  });
  return out;
}

/** 「MP、MP、MP」→「MP×3」 */
export function summarize(names: string[]) {
  const out: string[] = [];
  for (let i = 0; i < names.length; ) {
    let j = i;
    while (j < names.length && names[j] === names[i]) j++;
    out.push(j - i > 1 ? `${names[i]}×${j - i}` : names[i]);
    i = j;
  }
  return out.join("、");
}

// ---- 範本（文升討論紀錄） ----

const items = (...ids: string[]) =>
  ids.flatMap((id) => {
    const m = id.match(/^(.+)\*(\d+)$/);
    return m ? Array.from({ length: Number(m[2]) }, () => ({ ...libraryItem(m[1]) })) : [{ ...libraryItem(id) }];
  });

export const TEMPLATES: { id: string; name: string; clearances: Clearances; rows: RowInput[] }[] = [
  {
    id: "three",
    name: "三列配置",
    clearances: DEFAULT_CLEARANCES,
    rows: [
      { facing: "down", items: items("panel-MOF", "panel-DS", "panel-MVCB", "panel-VCB*2") },
      { facing: "up", items: items("oil-3000", "panel-MP*3", "panel-SC*2") },
      { facing: "down", items: items("oil-2500", "panel-MP*3", "panel-SC*2") },
    ],
  },
  {
    id: "single",
    name: "單列配置",
    clearances: { ...DEFAULT_CLEARANCES, left: 500 },
    rows: [{ facing: "down", items: items("panel-MOF", "panel-DS", "panel-MVCB", "oil-3000", "panel-MP*3", "panel-SC*2") }],
  },
];

export const NOTES = {
  clearance: "通道距離為汎德建議值，請對照台電審查要點及用戶用電設備裝置規則。",
  backToBack: "背對背距離量至兩列最突出之設備背面（列深取該列最深設備），為實際最窄處。",
  door: "門扇半徑：配電盤單門取盤寬，模鑄式雙開門每扇取寬度之半。標準圖無門寬與開啟角度資料，若實際門較小或不同時開啟，可忽略。",
  cast: "模鑄式側視圖深度兩端各標 40（底座或把手突出），實際佔地可能再加 80；標準圖未列 1000 kVA，請以自訂設備輸入。",
  lv: "低壓變壓器（3～250 kVA，含 208Y/120V）尺寸取自士林電機模鑄式變壓器型錄（2019.05 版）P.7～P.10，寬取 L、深取 W；IP00 無外箱者應設於有防護之場所，與牆或他設備之距離請依廠商建議；外箱型錄未標示門，以無門計。",
};

export const REMINDERS = [
  "油浸式變壓器同室之防火區劃、擋油與集油設施尚未計入。",
  "電纜溝、進出線與高壓側連接方式尚未計入。",
  "室內淨高依設備高度檢討（模鑄式最高 2950 mm；低壓變壓器最高 1415 mm；油浸式與配電盤標準圖無高度）。",
  "變壓器緊貼盤體時，請廠商確認散熱與維修空間。",
  "高壓電度表裝於 MOF 盤內，盤前工作空間至少 1.5 m；另設低壓電度表接線箱者，箱前至少 0.9 m（用戶用電設備裝置規則第 1009 條，115.11.4 修正）。",
];

export const DISCLAIMER = "本結果為初步規劃概估，實際配置仍應依設備廠商圖面、台電審查及相關法規檢討。";
