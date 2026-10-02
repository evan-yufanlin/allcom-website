// 給水水理計算（間接給水）：一日用水量、總表口徑、水池水塔容量、揚水管口徑。
// 規格與驗算案例見 docs/water-supply-spec.md；驗算：npm run verify:water

import {
  AREA_USES,
  DP_COEF,
  JURISDICTION_NAME,
  METER_SIZES,
  PER_CAPITA,
  PLAN_AGENCY_THRESHOLD,
  PLAN_DAYS,
  PLAN_THRESHOLD,
  POOL_FACTOR,
  RISER_SIZES,
  SAFETY_BANDS,
  SOURCES,
  TP_HOUSEHOLD_METER,
  TP_K_BANDS,
  TW_DI_COEF,
  WRA_BRANCH,
  type Jurisdiction,
  type SafetyBand,
} from "./waterSupplyData.ts";

// ---- 輸入 ----

export type DemandRow =
  | { kind: "area"; label: string; area: number; ratio: number; density: number; litres: number }
  | { kind: "fixture"; label: string; count: number; litres: number }
  | { kind: "people"; label: string; people: number; litres: number };

export type OtherUse =
  | { kind: "fixed"; label: string; m3: number }
  | { kind: "pool"; label: string; volume: number; indoor: boolean };

export interface Tank {
  kind: "pool" | "tower";
  label: string;
  length: number;
  width: number;
  depth: number;
  count: number;
}

export interface SystemInput {
  name: string;
  suites: number;
  houses: number;
  townhouses: number;
  perSuite: number;
  perHouse: number;
  perTownhouse: number;
  rows: DemandRow[];
  v2Factor: number;
  others: OtherUse[];
  tanks: Tank[];
}

export interface ProjectInput {
  jurisdiction: Jurisdiction;
  county: string;
  /** 台水住宅類蓄水量基準值（日）；null 表示不檢核 */
  baselineDays: number | null;
  baselineLabel: string;
  /** 北水：105.12.15 前報核之都更案，合計下限改為 0.4 Vd */
  legacyUrbanRenewal: boolean;
  systems: SystemInput[];
  plan: {
    /** 未達 300 m³/日 時手動啟用 3 日檢核 */
    manual: boolean;
    /** 計畫用水量（m³/日）；null 時以 ⌈V⌉ 推估 */
    planned: number | null;
    /** 分期開發前期已核定之計畫用水量 */
    prior: number;
    basis: "planned" | "vd";
    /** 其他蓄水設施（製程水池、回收水池、雨水貯留池等） */
    otherStorage: number;
  };
}

// ---- 輸出 ----

export interface Step {
  title: string;
  value: string;
  lines: string[];
  cite: string;
}

export interface Check {
  item: string;
  requirement: string;
  actual: string;
  /** null：僅提示，不判定 */
  ok: boolean | null;
  note?: string;
  cite: string;
}

export interface SystemResult {
  name: string;
  v1: number;
  v2Prime: number;
  v2: number;
  others: number;
  v: number;
  band: SafetyBand;
  vd: number;
  vg: number;
  vt: number;
  dp: number;
  dpSize: number | null;
  steps: Step[];
  checks: Check[];
  hasTanks: boolean;
}

export interface MeterResult {
  v: number;
  vd: number;
  band: SafetyBand;
  /** 公式計算值（mm），查表者為 null */
  di: number | null;
  k: number | null;
  coef: number | null;
  /** 查表或公式後建議之總表口徑 */
  size: number | null;
  /** 北水純住宅依戶數 */
  household: { households: number; size: number | null; label: string } | null;
  step: Step;
}

export interface PlanResult {
  active: boolean;
  required: boolean;
  planned: number;
  total: number;
  agency: string;
  basisValue: number;
  needed: number;
  storage: number;
  ok: boolean;
  step: Step;
}

export interface WaterSupplyResult {
  input: ProjectInput;
  systems: SystemResult[];
  meter: MeterResult;
  plan: PlanResult;
}

// ---- 共用 ----

export const fmt = (n: number, digits = 2) =>
  n.toLocaleString("zh-TW", { maximumFractionDigits: digits, minimumFractionDigits: 0 });

/** 清單中 ≥ 計算值之最小規格；超出清單時為 null。 */
export function nextSize(value: number, sizes: number[]) {
  return sizes.find((s) => s >= value - 1e-9) ?? null;
}

function bandOf(j: Jurisdiction, v: number) {
  return SAFETY_BANDS[j].find((b) => v <= b.max)!;
}

const formCite = (j: Jurisdiction) => (j === "taiwan" ? SOURCES.twForm : `${SOURCES.tpRules} 表2-10`);

// ---- 單一系統 ----

function demandOf(row: DemandRow) {
  switch (row.kind) {
    case "area":
      return {
        m3: (row.area * row.ratio * row.density * row.litres) / 1000,
        expr: `${row.label}：${fmt(row.area)} m² × ${row.ratio} × ${row.density} 人/m² × ${row.litres} L ÷ 1000`,
      };
    case "fixture":
      return {
        m3: (row.count * row.litres) / 1000,
        expr: `${row.label}：${row.count} × ${fmt(row.litres)} L ÷ 1000`,
      };
    case "people":
      return {
        m3: (row.people * row.litres) / 1000,
        expr: `${row.label}：${fmt(row.people)} 人 × ${fmt(row.litres)} L ÷ 1000`,
      };
  }
}

function otherOf(o: OtherUse) {
  if (o.kind === "fixed") return { m3: o.m3, expr: `${o.label}：${fmt(o.m3)} m³` };
  const f = o.indoor ? POOL_FACTOR.indoor : POOL_FACTOR.outdoor;
  return {
    m3: o.volume * f,
    expr: `${o.label}（${o.indoor ? "室內" : "室外"}循環式）：${f} × ${fmt(o.volume)} m³`,
  };
}

export const tankVolume = (t: Tank) => t.length * t.width * t.depth * t.count;

function calcSystem(p: ProjectInput, sys: SystemInput): SystemResult {
  const j = p.jurisdiction;
  const lpc = PER_CAPITA[j];
  const steps: Step[] = [];

  // ① 一日用水量
  const units = [
    { label: "套房", n: sys.suites, per: sys.perSuite },
    { label: "住宅", n: sys.houses, per: sys.perHouse },
    ...(j === "taipei" ? [{ label: "透天厝、透天別墅", n: sys.townhouses, per: sys.perTownhouse }] : []),
  ].filter((u) => u.n > 0);
  const persons = units.reduce((s, u) => s + u.n * u.per, 0);
  const v1 = (persons * lpc) / 1000;

  const demands = sys.rows.map(demandOf);
  const v2Prime = demands.reduce((s, d) => s + d.m3, 0);
  const v2 = v2Prime * sys.v2Factor;
  const otherItems = sys.others.map(otherOf);
  const others = otherItems.reduce((s, o) => s + o.m3, 0);
  const v = v1 + v2 + others;

  const vLines: string[] = [];
  if (units.length) {
    vLines.push(
      `V1（住宅）＝ (${units.map((u) => `${u.per} 人/戶 × ${u.n} 戶`).join(" ＋ ")}) × ${lpc} L ÷ 1000 ＝ ${fmt(v1)} m³`,
    );
  }
  if (demands.length) {
    demands.forEach((d) => vLines.push(`　${d.expr} ＝ ${fmt(d.m3)} m³`));
    vLines.push(`V2 ＝ V2′ ${fmt(v2Prime)} × ${sys.v2Factor} ＝ ${fmt(v2)} m³（考慮使用水量變化，可取 ±10%）`);
  }
  otherItems.forEach((o) => vLines.push(`其他用水 ${o.expr} ＝ ${fmt(o.m3)} m³`));
  vLines.push(`V ＝ ${[units.length && "V1", demands.length && "V2", otherItems.length && "其他"].filter(Boolean).join(" ＋ ") || "0"} ＝ ${fmt(v)} m³`);
  steps.push({
    title: "一日用水量 V",
    value: `${fmt(v)} m³`,
    lines: vLines,
    cite: `${formCite(j)}；住宅每人每日 ${lpc} L${j === "taipei" ? `（${SOURCES.tpRules} 2-5）` : ""}`,
  });

  // ② 一日設計用水量
  const band = bandOf(j, v);
  const vd = v * band.factor;
  steps.push({
    title: "一日設計用水量 Vd",
    value: `${fmt(vd)} m³`,
    lines: [`V ${fmt(v)} m³ 屬「${band.label}」，安全係數 ${band.factor}`, `Vd ＝ ${fmt(v)} × ${band.factor} ＝ ${fmt(vd)} m³`],
    cite: j === "taiwan" ? SOURCES.twForm : `${SOURCES.tpRules} 表2-11`,
  });

  // ③ 水池水塔
  const pools = sys.tanks.filter((t) => t.kind === "pool");
  const towers = sys.tanks.filter((t) => t.kind === "tower");
  const vg = pools.reduce((s, t) => s + tankVolume(t), 0);
  const vt = towers.reduce((s, t) => s + tankVolume(t), 0);
  const hasTanks = vg + vt > 0;
  const tankLine = (t: Tank) =>
    `${t.label}：${fmt(t.length)} × ${fmt(t.width)} × ${fmt(t.depth)} m${t.count > 1 ? ` × ${t.count} 座` : ""} ＝ ${fmt(tankVolume(t))} m³`;
  if (hasTanks) {
    steps.push({
      title: "蓄水池、水塔容量",
      value: `${fmt(vg + vt)} m³`,
      lines: [
        ...pools.map(tankLine),
        `蓄水池 VG ＝ ${fmt(vg)} m³`,
        ...towers.map(tankLine),
        `水塔 VT ＝ ${fmt(vt)} m³`,
        `VG ＋ VT ＝ ${fmt(vg + vt)} m³`,
      ],
      cite: "容量以長 × 寬 × 有效水深計算",
    });
  }

  const checks: Check[] = [];
  if (hasTanks) {
    const std6 = `${SOURCES.standard} 第6條`;
    const tp = `${SOURCES.tpRules} 2-4`;
    checks.push({
      item: "蓄水池容量",
      requirement: `VG ≥ 0.2 Vd ＝ ${fmt(0.2 * vd)} m³`,
      actual: `${fmt(vg)} m³`,
      ok: vg >= 0.2 * vd - 1e-9,
      cite: j === "taiwan" ? `${std6}；${SOURCES.twForm}` : tp,
    });
    if (j === "taipei") {
      checks.push({
        item: "水塔容量",
        requirement: `VT ≥ 0.1 Vd ＝ ${fmt(0.1 * vd)} m³（避免揚水馬達啟動過於頻繁）`,
        actual: `${fmt(vt)} m³`,
        ok: vt >= 0.1 * vd - 1e-9,
        cite: tp,
      });
    }
    const minRatio = j === "taipei" && !p.legacyUrbanRenewal ? 1 : 0.4;
    checks.push({
      item: "合計容量下限",
      requirement: `VG ＋ VT ≥ ${minRatio === 1 ? "1 日設計用水量 Vd" : "0.4 Vd"} ＝ ${fmt(minRatio * vd)} m³`,
      actual: `${fmt(vg + vt)} m³`,
      ok: vg + vt >= minRatio * vd - 1e-9,
      note: j === "taipei" && p.legacyUrbanRenewal ? "105年12月15日前報核之都市更新案，依設備標準第6條辦理" : undefined,
      cite: j === "taiwan" ? `${std6}；${SOURCES.twForm}` : tp,
    });
    checks.push({
      item: "合計容量上限（原則）",
      requirement: `VG ＋ VT ≤ 2 日設計用水量 ＝ ${fmt(2 * vd)} m³`,
      actual: `${fmt(vg + vt)} m³`,
      ok: vg + vt <= 2 * vd + 1e-9,
      note: "考慮用水安全，以不超過二日設計用水量為原則",
      cite: j === "taiwan" ? std6 : tp,
    });
    if (j === "taiwan" && p.baselineDays !== null) {
      checks.push({
        item: "住宅類蓄水量基準值",
        requirement: `VG ＋ VT ≥ ${p.baselineDays} 日 × Vd ＝ ${fmt(p.baselineDays * vd)} m³`,
        actual: `${fmt(vg + vt)} m³`,
        ok: vg + vt >= p.baselineDays * vd - 1e-9,
        note: p.baselineLabel,
        cite: SOURCES.twBaseline,
      });
    }
  }

  // ④ 揚水管
  const dp = DP_COEF * Math.sqrt(vd);
  const dpSize = nextSize(dp, RISER_SIZES);
  steps.push({
    title: "揚水管口徑 Dp",
    value: dpSize ? `${dpSize} mm` : `${fmt(dp, 1)} mm`,
    lines: [
      "以 t ＝ 30 分鐘泵送 0.1 Vd 之管徑為最少要求，流速 Vp 以 1.6 m/s 計算：0.1 Vd ／ t ＝ π／4 × Dp² × Vp",
      `Dp ＝ 6.65 √Vd ＝ 6.65 × √${fmt(vd)} ＝ ${fmt(dp)} mm`,
      dpSize ? `建議採用 ${dpSize} mm 以上（實際採用由設計者決定）` : "超出管徑清單，請另行檢討",
    ],
    cite: j === "taiwan" ? SOURCES.twForm : `${SOURCES.tpRules} 2-7`,
  });

  return { name: sys.name, v1, v2Prime, v2, others, v, band, vd, vg, vt, dp, dpSize, steps, checks, hasTanks };
}

// ---- 總表口徑 ----

function calcMeter(p: ProjectInput, systems: SystemResult[]): MeterResult {
  const j = p.jurisdiction;
  const multi = systems.length > 1;
  const v = systems.reduce((s, r) => s + r.v, 0);
  const band = bandOf(j, v);
  const vd = v * band.factor;
  const vgvt = systems.reduce((s, r) => s + r.vg + r.vt, 0);
  const lines: string[] = [];
  if (multi) lines.push(`V ＝ ${systems.map((r) => `${r.name} ${fmt(r.v)}`).join(" ＋ ")} ＝ ${fmt(v)} m³`);
  lines.push(`V ${fmt(v)} m³ 屬「${band.label}」，安全係數 ${band.factor}，Vd ＝ ${fmt(vd)} m³`);

  let di: number | null = null;
  let k: number | null = null;
  let coef: number | null = null;
  let size: number | null = band.meter;
  let cite = formCite(j);

  if (band.meter !== null) {
    lines.push(`查表：總表口徑 ${band.meter} mm`);
  } else if (j === "taiwan") {
    coef = TW_DI_COEF;
    di = coef * Math.sqrt(vd);
    size = nextSize(di, METER_SIZES);
    lines.push(`Di ＝ ${coef} √Vd ＝ ${coef} × √${fmt(vd)} ＝ ${fmt(di)} mm`);
  } else if (vgvt <= 0) {
    size = null;
    lines.push("V＞82.1 m³ 須依 K 值計算，請先輸入蓄水池、水塔容量");
  } else {
    k = vgvt / vd;
    const kb = TP_K_BANDS.find((b) => k! < b.max) ?? TP_K_BANDS[TP_K_BANDS.length - 1];
    coef = kb.coef;
    di = coef * Math.sqrt(vd);
    size = nextSize(di, METER_SIZES);
    lines.push(`K ＝ (VG ＋ VT) ／ Vd ＝ ${fmt(vgvt)} ／ ${fmt(vd)} ＝ ${fmt(k)}`);
    if (k < 0.4 || k > 2) lines.push(`K 值超出 0.4～2.0，請檢討水池、水塔容量`);
    lines.push(`${kb.label}：Di ＝ ${coef} √Vd ＝ ${fmt(di)} mm（俟審查時配合水壓狀況才能定案）`);
    cite = `${SOURCES.tpRules} 表2-10`;
  }
  if (di !== null) {
    lines.push(size ? `建議總表口徑 ${size} mm` : "超出口徑清單，請另行檢討");
  }

  // 北水：純住宅依戶數
  let household: MeterResult["household"] = null;
  const pureResidential =
    j === "taipei" && systems.length > 0 && p.systems.every((s) => s.rows.length === 0 && s.others.length === 0);
  if (pureResidential) {
    const households = p.systems.reduce((s, x) => s + x.suites + x.houses + x.townhouses, 0);
    if (households > 0) {
      const hb = TP_HOUSEHOLD_METER.find((b) => households <= b.max);
      household = { households, size: hb?.meter ?? null, label: hb?.label ?? "92 戶以上" };
      if (hb) {
        lines.push(`一般住宅依戶數：${households} 戶屬「${hb.label}」→ ${hb.meter} mm（本處規定，以此為準）`);
        if (size !== hb.meter) lines.push(`（審查計算表查得 ${size ?? "—"} mm，僅供參考）`);
        size = hb.meter;
      } else {
        lines.push(`一般住宅 ${households} 戶屬 92 戶以上，依審查計算表計算`);
      }
      cite = `${cite}；${SOURCES.tpRules} 2-6`;
    }
  }
  if (j === "taipei" && size !== null && size >= 50) {
    lines.push("50 mm 以上總表須參考配水管平均水壓、接水點與受水池高差、表前後管長及等值直管長，校核摩擦水頭損失（表2-12）");
  }

  return {
    v,
    vd,
    band,
    di,
    k,
    coef,
    size,
    household,
    step: { title: multi ? "總表口徑（各系統合計）" : "總表（進水管）口徑", value: size ? `${size} mm` : "—", lines, cite },
  };
}

// ---- 用水計畫 3 日 ----

function calcPlan(p: ProjectInput, systems: SystemResult[], meter: MeterResult): PlanResult {
  const v = systems.reduce((s, r) => s + r.v, 0);
  const planned = p.plan.planned ?? Math.ceil(v - 1e-9);
  const total = planned + p.plan.prior;
  const required = total >= PLAN_THRESHOLD;
  const active = required || p.plan.manual;
  const agency =
    total >= PLAN_AGENCY_THRESHOLD ? "經濟部水利署" : (WRA_BRANCH[p.county] ?? "經濟部水利署各區水資源分署");
  const basisValue = p.plan.basis === "planned" ? planned : meter.vd;
  const needed = PLAN_DAYS * basisValue;
  const storage = systems.reduce((s, r) => s + r.vg + r.vt, 0) + p.plan.otherStorage;
  const ok = storage >= needed - 1e-9;

  const lines = [
    `計畫用水量 ＝ ${p.plan.planned === null ? `⌈V⌉ ＝ ⌈${fmt(v)}⌉` : "使用者輸入"} ＝ ${planned} m³/日${
      p.plan.prior ? `；含前期已核定 ${fmt(p.plan.prior)}，累計 ${fmt(total)} m³/日` : ""
    }`,
    required
      ? `達每日 ${PLAN_THRESHOLD} m³，依水利法第54條之3 應提用水計畫，受理機關：${agency}`
      : `未達每日 ${PLAN_THRESHOLD} m³（依使用者勾選檢討）`,
    `檢核基準：${p.plan.basis === "planned" ? `3 × 計畫用水量 ＝ 3 × ${planned}` : `3 × Vd ＝ 3 × ${fmt(meter.vd)}`} ＝ ${fmt(needed)} m³`,
    `總蓄水容量 ＝ 蓄水池、水塔 ${fmt(storage - p.plan.otherStorage)}${
      p.plan.otherStorage ? ` ＋ 其他蓄水設施 ${fmt(p.plan.otherStorage)}` : ""
    } ＝ ${fmt(storage)} m³ ⇒ 可供 ${fmt(basisValue > 0 ? storage / basisValue : 0, 1)} 日`,
    ok
      ? "符合原則上滿足三天用水需求"
      : "未達三天：原則上應滿足三天之用水需求，未達者應於用水計畫書說明蓄水能力強化措施及常態應變措施",
  ];
  return {
    active,
    required,
    planned,
    total,
    agency,
    basisValue,
    needed,
    storage,
    ok,
    step: {
      title: "用水計畫緊急蓄水量（3 日）",
      value: `${fmt(storage)} ／ ${fmt(needed)} m³`,
      lines,
      cite: `${SOURCES.planRules} 第3條、第5條；${SOURCES.planFormat} 五、(二)2`,
    },
  };
}

export function calculateWaterSupply(p: ProjectInput): WaterSupplyResult {
  const systems = p.systems.map((s) => calcSystem(p, s));
  const meter = calcMeter(p, systems);
  const plan = calcPlan(p, systems, meter);
  return { input: p, systems, meter, plan };
}

// ---- 預設值與說明 ----

export function defaultSystem(name = "生活用水"): SystemInput {
  return {
    name,
    suites: 0,
    houses: 0,
    townhouses: 0,
    perSuite: 2,
    perHouse: 3,
    perTownhouse: 6,
    rows: [],
    v2Factor: 1,
    others: [],
    tanks: [],
  };
}

export function areaRow(j: Jurisdiction, useId: string, area = 0): DemandRow {
  const u = AREA_USES[j].find((x) => x.id === useId) ?? AREA_USES[j][0];
  return { kind: "area", label: u.name, area, ratio: u.ratio[0], density: u.density[1], litres: u.litres };
}

export const REMINDERS: Record<Jurisdiction, string[]> = {
  taiwan: [
    "人孔上方至少 60 cm 淨空，設不銹鋼蓋及鎖；溢排管及通氣管設防蟲網。",
    "蓄水池之牆壁及平頂與其他結構物保持 45 cm 以上距離；混凝土蓄水池池底與樓板之間隔得限縮，但不得小於 20 cm。",
    "進水口低於地面之蓄水池，受水管口徑 50 mm 以上者應設地上式接水槽或持壓閥；75 mm 以上水量計應以定水位閥或電磁閥控制。",
    "蓄水池應設於建築線內，不得設於騎樓或防火巷；五樓以上供公眾使用之集合住宅，蓄水池不得設於一樓屋內。",
    "公寓式集合大樓、五樓以上建築或受水管 40 mm 以上之建築，應檢附內線設備水力計算表。",
    "位於高地供水地區者，須附供水計畫書送審。",
  ],
  taipei: [
    "人孔上方至少 60 cm 淨空，人孔周邊突緣高於池頂 10 cm 以上；供人員進出之人孔直徑 60 cm 以上。",
    "水箱內淨水深不得少於 60 cm，以沉水抽水機揚水時為 90 cm 以上；有效容量自池頂向下扣除 20～30 cm 計算。",
    "蓄水池之牆壁及平頂與其他結構物保持 45 cm 以上距離；池底與接觸地層之基礎分離 30 cm 以上。",
    "50 公噸以上水箱應設導流牆、人孔 2 處以上，進水與出水設於箱體兩端相對且不同平面位置。",
    "蓄水池進水口高程低於進水總表 10 m 以上者，應增設減壓閥。",
    "水塔底應高於屋頂 2 m 以上，或於分表前另設具隔震功能之恆壓變頻馬達。",
  ],
};

export const ASSUMPTIONS = [
  "本計算適用於間接給水（受水池 → 揚水 → 水塔）之一日用水量、總表口徑、蓄水池與水塔容量及揚水管口徑。",
  "口徑「建議值」為大於等於計算值之最小規格，實際採用口徑由設計者依現場水壓、管長等條件決定。",
  "數值計算保留全精度，顯示至小數 2 位；與手算四捨五入之結果可能略有差異。",
];

export const DISCLAIMER = (j: Jurisdiction) =>
  `本計算結果僅供規劃設計參考，實際總表口徑、蓄水池與水塔容量仍以${JURISDICTION_NAME[j]}審查結果為準。`;

export const NEXT_VERSION_NOTE = "揚水泵浦（揚程、流量、馬力）計算將於下一版提供";
