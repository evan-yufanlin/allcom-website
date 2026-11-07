// 給水水理計算：畫面輸入（表單）與計算輸入之轉換。
// 供網頁工具、專案存檔（伺服器重算摘要）共用；純模組，可由 scripts/verify-projects.ts 直接執行。
import type { DemandRow, OtherUse, ProjectInput, SystemInput, Tank } from "./waterSupply.ts";
import { COUNTIES, NEW_TAIPEI_RULES, areasOf, type BaselineArea, type Jurisdiction } from "./waterSupplyData.ts";

export const OTHER_DISTRICT = "其他行政區";
export const GENERAL_AREA = "general";
export const NON_RESIDENTIAL = "non-residential";

export type RowForm = DemandRow & { preset: string; building: number };

export type SystemForm = Omit<SystemInput, "rows"> & { rows: RowForm[]; tongluo: boolean };

/** 給水工具之完整輸入（專案存檔格式 v1） */
export interface WaterSupplyForm {
  projectName: string;
  county: string;
  district: string;
  partialTaiwan: boolean;
  xizhiVillage: string;
  /** "general"、"non-residential" 或 "area-索引"（areasOf(county, district) 之順序） */
  areaKey: string;
  highlandDays: number | null;
  legacy: boolean;
  systems: SystemForm[];
  plan: ProjectInput["plan"];
}

export interface Derived {
  jurisdiction: Jurisdiction;
  rule: (typeof NEW_TAIPEI_RULES)[string] | undefined;
  areas: BaselineArea[];
  selectedArea: BaselineArea | undefined;
  baselineDays: number | null;
  baselineLabel: string;
  input: ProjectInput;
}

/** 依縣市、行政區、里別判定供水轄區，並組成計算輸入 */
export function deriveWaterSupply(f: WaterSupplyForm): Derived {
  const rule = f.county === "新北市" ? NEW_TAIPEI_RULES[f.district] : undefined;
  const j: Jurisdiction =
    f.county === "臺北市"
      ? "taipei"
      : rule?.kind === "taipei"
        ? "taipei"
        : rule?.kind === "taipei-partial"
          ? f.partialTaiwan
            ? "taiwan"
            : "taipei"
          : rule?.kind === "xizhi"
            ? f.xizhiVillage === "other"
              ? "taiwan"
              : "taipei"
            : "taiwan";

  const areas = j === "taiwan" ? areasOf(f.county, f.district) : [];
  const selectedArea = f.areaKey.startsWith("area-") ? areas[Number(f.areaKey.slice(5))] : undefined;

  let baselineDays: number | null = null;
  let baselineLabel = "";
  if (j === "taiwan" && !f.legacy && f.areaKey !== NON_RESIDENTIAL) {
    if (selectedArea) {
      baselineDays = selectedArea.days ?? f.highlandDays ?? null;
      baselineLabel = `${selectedArea.county}${selectedArea.district} ${selectedArea.places}（${selectedArea.reason}${
        selectedArea.days === null ? "，附件九高地供水地區，日數依審查訂定" : ""
      }）`;
    } else {
      baselineDays = 1;
      baselineLabel = "一般供水區";
    }
  }

  return {
    jurisdiction: j,
    rule,
    areas,
    selectedArea,
    baselineDays,
    baselineLabel,
    input: {
      jurisdiction: j,
      county: f.county,
      baselineDays,
      baselineLabel,
      legacyUrbanRenewal: j === "taipei" && f.legacy,
      systems: f.systems,
      plan: f.plan,
    },
  };
}

// ---- 外部輸入檢查（專案存檔前、載入後） ----

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);
const num = (v: unknown, max = 1e9) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max;
const str = (v: unknown, max = 100) => typeof v === "string" && v.length <= max;

function parseRow(r: unknown): RowForm | null {
  if (!isObj(r) || !str(r.label) || !str(r.preset) || !num(r.building, 20) || !num(r.litres, 1e6)) return null;
  const base = { label: r.label as string, preset: r.preset as string, building: r.building as number, litres: r.litres as number };
  if (r.kind === "area" && num(r.area) && num(r.ratio, 10) && num(r.density, 100))
    return { ...base, kind: "area", area: r.area as number, ratio: r.ratio as number, density: r.density as number };
  if (r.kind === "fixture" && num(r.count)) return { ...base, kind: "fixture", count: r.count as number };
  if (r.kind === "people" && num(r.people)) return { ...base, kind: "people", people: r.people as number };
  return null;
}

function parseOther(o: unknown): OtherUse | null {
  if (!isObj(o) || !str(o.label)) return null;
  if (o.kind === "fixed" && num(o.m3)) return { kind: "fixed", label: o.label as string, m3: o.m3 as number };
  if (o.kind === "pool" && num(o.volume) && typeof o.indoor === "boolean")
    return { kind: "pool", label: o.label as string, volume: o.volume as number, indoor: o.indoor };
  return null;
}

function parseTank(t: unknown): Tank | null {
  if (!isObj(t) || (t.kind !== "pool" && t.kind !== "tower") || !str(t.label)) return null;
  if (![t.length, t.width, t.depth].every((v) => num(v, 1000)) || !num(t.count, 100)) return null;
  return { kind: t.kind, label: t.label as string, length: t.length as number, width: t.width as number, depth: t.depth as number, count: t.count as number };
}

function parseSystem(s: unknown): SystemForm | null {
  if (!isObj(s) || !str(s.name) || typeof s.tongluo !== "boolean") return null;
  const n = ["suites", "houses", "townhouses", "perSuite", "perHouse", "perTownhouse", "v2Factor"] as const;
  if (!n.every((k) => num(s[k], 1e6))) return null;
  if (!Array.isArray(s.rows) || !Array.isArray(s.others) || !Array.isArray(s.tanks)) return null;
  if (s.rows.length > 200 || s.others.length > 50 || s.tanks.length > 50) return null;
  const rows = s.rows.map(parseRow);
  const others = s.others.map(parseOther);
  const tanks = s.tanks.map(parseTank);
  if (rows.includes(null) || others.includes(null) || tanks.includes(null)) return null;
  return {
    name: s.name as string,
    suites: s.suites as number,
    houses: s.houses as number,
    townhouses: s.townhouses as number,
    perSuite: s.perSuite as number,
    perHouse: s.perHouse as number,
    perTownhouse: s.perTownhouse as number,
    v2Factor: s.v2Factor as number,
    tongluo: s.tongluo,
    rows: rows as RowForm[],
    others: others as OtherUse[],
    tanks: tanks as Tank[],
  };
}

/** 檢查並整理外部輸入；格式不符回傳 null */
export function parseWaterSupplyForm(v: unknown): WaterSupplyForm | null {
  if (!isObj(v)) return null;
  if (!str(v.county, 10) || !COUNTIES.includes(v.county as string) || !str(v.district, 20) || !str(v.xizhiVillage, 20) || !str(v.areaKey, 20)) return null;
  if (typeof v.partialTaiwan !== "boolean" || typeof v.legacy !== "boolean") return null;
  if (v.highlandDays !== null && !num(v.highlandDays, 30)) return null;
  if (!Array.isArray(v.systems) || v.systems.length < 1 || v.systems.length > 10) return null;
  const systems = v.systems.map(parseSystem);
  if (systems.includes(null)) return null;
  const p = v.plan;
  if (!isObj(p) || typeof p.manual !== "boolean" || (p.planned !== null && !num(p.planned)) || !num(p.prior) || !num(p.otherStorage)) return null;
  if (p.basis !== "planned" && p.basis !== "vd") return null;
  return {
    projectName: typeof v.projectName === "string" ? v.projectName.slice(0, 100) : "",
    county: v.county as string,
    district: v.district as string,
    partialTaiwan: v.partialTaiwan,
    xizhiVillage: v.xizhiVillage as string,
    areaKey: v.areaKey as string,
    highlandDays: v.highlandDays as number | null,
    legacy: v.legacy,
    systems: systems as SystemForm[],
    plan: { manual: p.manual, planned: p.planned as number | null, prior: p.prior as number, basis: p.basis, otherStorage: p.otherStorage as number },
  };
}
