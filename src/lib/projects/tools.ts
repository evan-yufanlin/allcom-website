// 專案可接入之空間檢討工具（docs/projects-spec.md 第 4 節，依階段陸續開放）。
import { calculateSubstation, type Clearances, type Door, type Equip, type Facing, type Group } from "../substation.ts";

export type ProjectToolSlug = "substation";

export interface ProjectToolInfo {
  slug: string;
  name: string;
  /** 對應之公開即時規劃頁 */
  href: string;
  /** 已可存入專案 */
  ready: boolean;
}

export const PROJECT_TOOLS: ProjectToolInfo[] = [
  { slug: "substation", name: "自設變電站空間檢討", href: "/tools/substation", ready: true },
  { slug: "water-supply", name: "給水水理計算（自來水水箱）", href: "/tools/water-supply", ready: false },
  { slug: "fire-water", name: "消防水池容量檢討", href: "/tools/fire-water", ready: false },
  { slug: "telecom", name: "電信室空間檢討", href: "/tools/telecom", ready: false },
  { slug: "generator", name: "緊急發電機室", href: "/tools/generator", ready: false },
  { slug: "parking-ventilation", name: "停車場通風", href: "/tools/parking-ventilation", ready: false },
  { slug: "lightning", name: "避雷設備檢討", href: "/tools/lightning", ready: false },
  { slug: "distribution-room", name: "台電配電場所面積檢討", href: "/tools/distribution-room", ready: false },
];

// ---- 自設變電站：輸入格式 v1 ----

export const SUBSTATION_SCHEMA = 1;

export interface SubstationInput {
  projectName: string;
  clearances: Clearances;
  rows: { facing: Facing; items: Equip[] }[];
}

export interface SubstationSummary {
  length: number;
  depth: number;
  area: number;
}

const GROUPS: Group[] = ["panel", "oil", "cast", "custom"];
const DOORS: Door[] = ["single", "double", "none"];
const num = (v: unknown, max = 1e6) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max;

/** 檢查並整理外部輸入（存檔前、載入後皆使用）；格式不符回傳 null */
export function parseSubstationInput(v: unknown): SubstationInput | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const c = o.clearances as Record<string, unknown> | undefined;
  const keys = ["front", "rear", "faceToFace", "backToBack", "left", "right"] as const;
  if (!c || !keys.every((k) => num(c[k]))) return null;
  if (!Array.isArray(o.rows) || o.rows.length > 20) return null;
  const rows: SubstationInput["rows"] = [];
  for (const r of o.rows as Record<string, unknown>[]) {
    if (!r || (r.facing !== "down" && r.facing !== "up") || !Array.isArray(r.items) || r.items.length > 60) return null;
    const items: Equip[] = [];
    for (const e of r.items as Record<string, unknown>[]) {
      if (!e || typeof e.name !== "string" || e.name.length > 40) return null;
      if (!GROUPS.includes(e.group as Group) || !DOORS.includes(e.door as Door) || !num(e.width, 20000) || !num(e.depth, 20000)) return null;
      if (e.height !== undefined && !num(e.height, 20000)) return null;
      items.push({ name: e.name, group: e.group as Group, width: e.width as number, depth: e.depth as number, door: e.door as Door, ...(e.height !== undefined ? { height: e.height as number } : {}) });
    }
    rows.push({ facing: r.facing, items });
  }
  const projectName = typeof o.projectName === "string" ? o.projectName.slice(0, 100) : "";
  return { projectName, clearances: Object.fromEntries(keys.map((k) => [k, c[k] as number])) as unknown as Clearances, rows };
}

export function summarizeSubstation(input: SubstationInput): SubstationSummary {
  const r = calculateSubstation(input.rows, input.clearances);
  return { length: r.length, depth: r.depth, area: Math.round(r.area * 10) / 10 };
}

export const summaryText = (tool: string, s: unknown): string => {
  if (tool === "substation" && s && typeof s === "object") {
    const x = s as SubstationSummary;
    return `室內淨長 ${x.length.toLocaleString("zh-TW")} × 淨深 ${x.depth.toLocaleString("zh-TW")} mm，淨面積 ${x.area} m²`;
  }
  return "";
};
