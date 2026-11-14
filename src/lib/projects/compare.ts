// 專案檢討版次比較（docs/project-versions-spec.md 第 3 節）：關鍵結果並列與輸入差異清單。
// 純模組，可由 scripts/verify-projects.ts 直接執行。
import { CLEARANCE_LABEL, DOOR_NAME, calculateSubstation, type Clearances, type Equip } from "../substation.ts";
import { calculateWaterSupply, type OtherUse, type Tank } from "../waterSupply.ts";
import { JURISDICTION_NAME } from "../waterSupplyData.ts";
import { deriveWaterSupply, type RowForm, type SystemForm, type WaterSupplyForm } from "../waterSupplyForm.ts";
import type { SubstationInput } from "./tools.ts";

export interface Metric {
  label: string;
  a: string;
  b: string;
  /** 數值差（b − a），非數值或相同時省略 */
  diff?: string;
  changed: boolean;
}

export interface Comparison {
  metrics: Metric[];
  /** 輸入差異（只列有變動之項目） */
  changes: string[];
}

const zh = (v: number, d = 2) => v.toLocaleString("zh-TW", { maximumFractionDigits: d });

function num(label: string, a: number, b: number, unit = "", d = 2): Metric {
  const delta = Math.round((b - a) * 10 ** d) / 10 ** d;
  return {
    label,
    a: `${zh(a, d)}${unit}`,
    b: `${zh(b, d)}${unit}`,
    diff: delta ? `${delta > 0 ? "＋" : "−"}${zh(Math.abs(delta), d)}${unit}` : undefined,
    changed: delta !== 0,
  };
}

const txt = (label: string, a: string, b: string): Metric => ({ label, a, b, changed: a !== b });

/** 依序比較兩清單：同位置不同者為修改，多出者為新增或刪除 */
function listDiff<T>(prefix: string, a: T[], b: T[], show: (x: T) => string, out: string[]) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] === undefined ? null : show(a[i]);
    const y = b[i] === undefined ? null : show(b[i]);
    if (x === y) continue;
    if (x === null) out.push(`${prefix}：新增 ${y}`);
    else if (y === null) out.push(`${prefix}：刪除 ${x}`);
    else out.push(`${prefix}：${x} → ${y}`);
  }
}

// ---- 自設變電站 ----

const equipText = (e: Equip) => e.name;

/** 設備增減（不計順序）；相同設備僅順序不同時註明 */
function itemsDiff(a: Equip[], b: Equip[]): string | null {
  const count = (list: Equip[]) => list.reduce((m, e) => m.set(equipText(e), (m.get(equipText(e)) ?? 0) + 1), new Map<string, number>());
  const ca = count(a);
  const cb = count(b);
  const added: string[] = [];
  const removed: string[] = [];
  for (const k of new Set([...ca.keys(), ...cb.keys()])) {
    const d = (cb.get(k) ?? 0) - (ca.get(k) ?? 0);
    if (d > 0) added.push(d > 1 ? `${k}×${d}` : k);
    if (d < 0) removed.push(-d > 1 ? `${k}×${-d}` : k);
  }
  const parts = [added.length ? `新增 ${added.join("、")}` : "", removed.length ? `刪除 ${removed.join("、")}` : ""].filter(Boolean);
  if (parts.length) return parts.join("；");
  if (a.map(equipText).join("|") !== b.map(equipText).join("|")) return "設備排列順序調整";
  // 自訂設備同名但尺寸或門不同
  const spec = (e: Equip) => `${e.name} ${e.width}×${e.depth} ${DOOR_NAME[e.door]}`;
  const changed = a.flatMap((e, i) => (spec(e) !== spec(b[i]) ? [`${spec(e)} → ${spec(b[i])}`] : []));
  return changed.length ? `設備規格修改：${changed.join("、")}` : null;
}

const FACING = { down: "前側朝下", up: "前側朝上" } as const;

export function compareSubstation(a: SubstationInput, b: SubstationInput): Comparison {
  const ra = calculateSubstation(a.rows, a.clearances);
  const rb = calculateSubstation(b.rows, b.clearances);
  const metrics = [
    num("室內淨長", ra.length, rb.length, " mm", 0),
    num("室內淨深", ra.depth, rb.depth, " mm", 0),
    num("淨面積", Math.round(ra.area * 10) / 10, Math.round(rb.area * 10) / 10, " m²", 1),
    num("設備列數", ra.rows.length, rb.rows.length, " 列", 0),
    num("提醒（電度表工作空間、門扇干涉）", ra.warnings.length, rb.warnings.length, " 項", 0),
  ];

  const changes: string[] = [];
  if (a.projectName !== b.projectName) changes.push(`工程名稱：${a.projectName || "（空白）"} → ${b.projectName || "（空白）"}`);
  for (const k of Object.keys(CLEARANCE_LABEL) as (keyof Clearances)[])
    if (a.clearances[k] !== b.clearances[k]) changes.push(`${CLEARANCE_LABEL[k]}：${zh(a.clearances[k], 0)} → ${zh(b.clearances[k], 0)}`);
  for (let i = 0; i < Math.max(a.rows.length, b.rows.length); i++) {
    const x = a.rows[i];
    const y = b.rows[i];
    const label = `第${i + 1}列`;
    const list = (r: SubstationInput["rows"][number]) => r.items.map(equipText).join("、") || "（無設備）";
    if (!x) changes.push(`${label}：新增（${FACING[y.facing]}；${list(y)}）`);
    else if (!y) changes.push(`${label}：刪除（${list(x)}）`);
    else {
      if (x.facing !== y.facing) changes.push(`${label}：${FACING[x.facing]} → ${FACING[y.facing]}`);
      const d = itemsDiff(x.items, y.items);
      if (d) changes.push(`${label}：${d}`);
    }
  }
  return { metrics, changes };
}

// ---- 給水水理計算 ----

const rowText = (r: RowForm) =>
  r.kind === "area"
    ? `${r.label} ${zh(r.area)} m²（${zh(r.litres)} L/人·日）`
    : r.kind === "fixture"
      ? `${r.label} ${zh(r.count, 0)} 具（${zh(r.litres)} L/日）`
      : `${r.label} ${zh(r.people, 0)} 人（${zh(r.litres)} L/人·日）`;

const otherText = (o: OtherUse) => (o.kind === "fixed" ? `${o.label} ${zh(o.m3)} m³/日` : `${o.label} ${zh(o.volume)} m³（${o.indoor ? "室內" : "室外"}）`);

const tankText = (t: Tank) => `${t.kind === "pool" ? "水池" : "水塔"}「${t.label}」${zh(t.length)}×${zh(t.width)}×${zh(t.depth)} m × ${t.count}`;

const passText = (checks: { ok: boolean | null }[]) => {
  const judged = checks.filter((c) => c.ok !== null);
  return judged.length ? `${judged.filter((c) => c.ok).length}／${judged.length} 項符合` : "—";
};

function waterResult(f: WaterSupplyForm) {
  const d = deriveWaterSupply(f);
  return { d, r: calculateWaterSupply(d.input) };
}

export function compareWaterSupply(a: WaterSupplyForm, b: WaterSupplyForm): Comparison {
  const A = waterResult(a);
  const B = waterResult(b);
  const metrics: Metric[] = [
    txt("供水轄區", JURISDICTION_NAME[A.d.jurisdiction], JURISDICTION_NAME[B.d.jurisdiction]),
    num("一日用水量 V", A.r.meter.v, B.r.meter.v, " m³"),
    num("一日設計用水量 Vd", A.r.meter.vd, B.r.meter.vd, " m³"),
    txt("總表口徑", A.r.meter.size ? `${A.r.meter.size} mm` : "—", B.r.meter.size ? `${B.r.meter.size} mm` : "—"),
  ];
  for (let i = 0; i < Math.max(A.r.systems.length, B.r.systems.length); i++) {
    const x = A.r.systems[i];
    const y = B.r.systems[i];
    const name = y?.name ?? x!.name;
    metrics.push(
      num(`${name}：水池 VG`, x?.vg ?? 0, y?.vg ?? 0, " m³"),
      num(`${name}：水塔 VT`, x?.vt ?? 0, y?.vt ?? 0, " m³"),
      txt(`${name}：檢核`, x ? passText(x.checks) : "（無此系統）", y ? passText(y.checks) : "（無此系統）"),
    );
  }
  const planText = (p: typeof A.r.plan) => (p.active ? `${p.ok ? "符合" : "不足"}（需 ${zh(p.needed)}，有 ${zh(p.storage)} m³）` : "不適用");
  metrics.push(txt("3 日蓄水量檢討", planText(A.r.plan), planText(B.r.plan)));

  const changes: string[] = [];
  const field = (label: string, x: string, y: string) => {
    if (x !== y) changes.push(`${label}：${x || "（空白）"} → ${y || "（空白）"}`);
  };
  field("工程名稱", a.projectName, b.projectName);
  field("縣市", a.county, b.county);
  field("行政區", a.district, b.district);
  field("住宅類蓄水量基準值", A.d.baselineLabel || "不檢核", B.d.baselineLabel || "不檢核");
  field("105.12.5 前申請建照或已報核都更案", a.legacy ? "是" : "否", b.legacy ? "是" : "否");
  for (let i = 0; i < Math.max(a.systems.length, b.systems.length); i++) {
    const x: SystemForm | undefined = a.systems[i];
    const y: SystemForm | undefined = b.systems[i];
    if (!x) {
      changes.push(`新增系統「${y!.name}」`);
      continue;
    }
    if (!y) {
      changes.push(`刪除系統「${x.name}」`);
      continue;
    }
    const p = `「${y.name}」`;
    field(`系統 ${i + 1} 名稱`, x.name, y.name);
    const unit = (n: number, per: number) => `${zh(n, 0)} 戶 × ${zh(per)} 人`;
    field(`${p}套房`, unit(x.suites, x.perSuite), unit(y.suites, y.perSuite));
    field(`${p}一般住宅`, unit(x.houses, x.perHouse), unit(y.houses, y.perHouse));
    field(`${p}透天厝`, unit(x.townhouses, x.perTownhouse), unit(y.townhouses, y.perTownhouse));
    field(`${p}V2 變動係數`, zh(x.v2Factor), zh(y.v2Factor));
    listDiff(`${p}非住宅用水`, x.rows, y.rows, rowText, changes);
    listDiff(`${p}其他用水`, x.others, y.others, otherText, changes);
    listDiff(`${p}水池、水塔`, x.tanks, y.tanks, tankText, changes);
  }
  const plan = (f: WaterSupplyForm) =>
    `${f.plan.manual ? "啟用" : "依規定"}；計畫用水量 ${f.plan.planned === null ? "依 V 推估" : `${zh(f.plan.planned)} m³/日`}；前期 ${zh(f.plan.prior)}；基準 ${f.plan.basis === "vd" ? "Vd" : "計畫用水量"}；其他蓄水 ${zh(f.plan.otherStorage)} m³`;
  field("3 日蓄水量檢討設定", plan(a), plan(b));
  return { metrics, changes };
}
