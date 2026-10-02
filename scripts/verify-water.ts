// 給水水理計算驗算：以 docs/water-supply-spec.md 第 9 節之案例核對計算結果。
// 執行：npm run verify:water
import { calculateWaterSupply, defaultSystem, type ProjectInput, type SystemInput } from "../src/lib/waterSupply.ts";
import type { Jurisdiction } from "../src/lib/waterSupplyData.ts";

let failed = 0;

function near(label: string, actual: number | null, expected: number, tol = 0.015) {
  const ok = actual !== null && Math.abs(actual - expected) <= tol;
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${label}: ${actual === null ? "null" : +actual.toFixed(4)}（預期 ${expected}）`);
}

function project(j: Jurisdiction, systems: SystemInput[], extra: Partial<ProjectInput> = {}): ProjectInput {
  return {
    jurisdiction: j,
    county: j === "taipei" ? "臺北市" : "新北市",
    baselineDays: null,
    baselineLabel: "",
    legacyUrbanRenewal: false,
    systems,
    plan: { manual: false, planned: null, prior: 0, basis: "planned", otherStorage: 0 },
    ...extra,
  };
}

const sys = (patch: Partial<SystemInput>): SystemInput => ({ ...defaultSystem(), ...patch });

// 台水案例一：科學園區廠房（銅鑼園區）
{
  console.log("\n台水案例一：生活用水系統");
  const life = sys({
    rows: [{ kind: "people", label: "員工", people: 1254, litres: 19.5 }],
    v2Factor: 1.1,
    tanks: [
      { kind: "pool", label: "水池", length: 4.95, width: 2.45, depth: 2.7, count: 2 },
      { kind: "tower", label: "水塔", length: 3.6, width: 2.95, depth: 1.5, count: 2 },
    ],
  });
  const r = calculateWaterSupply(
    project("taiwan", [life], { plan: { manual: true, planned: null, prior: 0, basis: "vd", otherStorage: 0 } }),
  );
  const s = r.systems[0];
  near("V", s.v, 26.9);
  near("Vd", s.vd, 32.28);
  near("總表口徑", r.meter.size, 40, 0);
  near("VG", s.vg, 65.49);
  near("VT", s.vt, 31.86);
  near("3 日（3×Vd）", r.plan.needed, 96.83);
  near("3 日判定", r.plan.ok ? 1 : 0, 1, 0);
  near("Dp", s.dp, 37.78);
  near("Dp 建議", s.dpSize, 40, 0);

  console.log("\n台水案例一：生活＋冷卻水塔合計（總表）");
  const life2 = sys({ rows: [{ kind: "people", label: "員工", people: 1254, litres: 19.5 }] });
  const ac = sys({ name: "空調用水", others: [{ kind: "fixed", label: "冷卻水塔補給水", m3: 318 }] });
  const all = calculateWaterSupply(project("taiwan", [life2, ac]));
  near("V 合計", all.meter.v, 342.45);
  near("Vd 合計", all.meter.vd, 376.7);
  near("Di", all.meter.di, 89.09);
  near("總表建議", all.meter.size, 100, 0);
  near("空調系統 Vd（係數 1.1）", all.systems[1].vd, 349.8);
}

// 台水案例二：新北市集合住宅（20 戶＋店舖），一般供水區 1 日
{
  console.log("\n台水案例二");
  const s0 = sys({
    houses: 20,
    rows: [{ kind: "area", label: "店舖", area: 95.5, ratio: 0.55, density: 0.16, litres: 40 }],
    tanks: [
      { kind: "pool", label: "水池", length: 2.04, width: 3.76, depth: 1.45, count: 1 },
      { kind: "tower", label: "水塔", length: 3.4, width: 1.14, depth: 4.75, count: 1 },
    ],
  });
  const r = calculateWaterSupply(project("taiwan", [s0], { baselineDays: 1, baselineLabel: "一般供水區" }));
  const s = r.systems[0];
  near("V1", s.v1, 15);
  near("V", s.v, 15.34);
  near("Vd", s.vd, 21.48);
  near("總表口徑", r.meter.size, 25, 0);
  near("VG", s.vg, 11.12);
  near("VT", s.vt, 18.41);
  near("檢核全數通過", s.checks.every((c) => c.ok !== false) ? 1 : 0, 1, 0);
  near("基準值需求 1 日", 1 * s.vd, 21.48);
  near("Dp", s.dp, 30.82);
  near("Dp 建議", s.dpSize, 32, 0);
}

// 北水案例一：集合住宅 21 戶（111 年審查表每戶 4 人）
{
  console.log("\n北水案例一");
  const s0 = sys({
    houses: 21,
    perHouse: 4,
    tanks: [
      { kind: "pool", label: "水池", length: 1, width: 1, depth: 26.13, count: 1 },
      { kind: "tower", label: "水塔", length: 1, width: 1, depth: 11.2, count: 1 },
    ],
  });
  const r = calculateWaterSupply(project("taipei", [s0]));
  const s = r.systems[0];
  near("V", s.v, 18.9);
  near("Vd", s.vd, 26.46);
  near("總表口徑（依戶數）", r.meter.size, 25, 0);
  near("檢核全數通過", s.checks.every((c) => c.ok !== false) ? 1 : 0, 1, 0);
  near("Dp", s.dp, 34.21);
  near("Dp 建議", s.dpSize, 40, 0);

  console.log("\n北水：21 戶每戶 3 人（查表 20 mm、依戶數 25 mm）");
  const r3 = calculateWaterSupply(project("taipei", [sys({ houses: 21 })]));
  near("V", r3.systems[0].v, 14.18);
  near("總表口徑（依戶數為準）", r3.meter.size, 25, 0);
}

// 北水案例二：宗教建築（衛生器具法，學校欄）
{
  console.log("\n北水案例二");
  const s0 = sys({
    rows: [
      { kind: "fixture", label: "大便器（水箱）", count: 20, litres: 600 },
      { kind: "fixture", label: "小便器", count: 8, litres: 240 },
      { kind: "fixture", label: "洗手盆", count: 24, litres: 140 },
      { kind: "fixture", label: "水栓", count: 10, litres: 140 },
      { kind: "fixture", label: "浴缸", count: 1, litres: 760 },
    ],
    tanks: [
      { kind: "pool", label: "水池", length: 1, width: 1, depth: 12.50625, count: 1 },
      { kind: "tower", label: "水塔", length: 1, width: 1, depth: 14.85, count: 1 },
    ],
  });
  const r = calculateWaterSupply(project("taipei", [s0]));
  const s = r.systems[0];
  near("V", s.v, 19.44);
  near("Vd", s.vd, 27.22);
  near("總表口徑", r.meter.size, 25, 0);
  near("檢核全數通過", s.checks.every((c) => c.ok !== false) ? 1 : 0, 1, 0);
  near("Dp", s.dp, 34.69);
}

// 北水規範例一：5 樓雙併 10 戶
{
  console.log("\n北水規範例一");
  const r = calculateWaterSupply(project("taipei", [sys({ houses: 10 })]));
  const s = r.systems[0];
  near("V", s.v, 6.75);
  near("Vd", s.vd, 10.13);
  near("總表口徑", r.meter.size, 20, 0);
  near("Dp", s.dp, 21.16);
  near("Dp 建議", s.dpSize, 25, 0);
}

// 北水規範例二：住辦大樓
{
  console.log("\n北水規範例二");
  const s0 = sys({
    houses: 50,
    suites: 40,
    rows: [{ kind: "area", label: "一般事務所", area: 4500, ratio: 0.56, density: 0.2, litres: 100 }],
    tanks: [
      { kind: "pool", label: "水池", length: 1, width: 1, depth: 70, count: 1 },
      { kind: "tower", label: "水塔", length: 1, width: 1, depth: 60, count: 1 },
    ],
  });
  const r = calculateWaterSupply(project("taipei", [s0]));
  const s = r.systems[0];
  near("V", s.v, 102.15);
  near("Vd", s.vd, 112.37);
  near("K", r.meter.k, 1.16, 0.005);
  near("Di", r.meter.di, 36.36);
  near("總表口徑", r.meter.size, 40, 0);
  near("檢核全數通過", s.checks.every((c) => c.ok !== false) ? 1 : 0, 1, 0);
  near("Dp", s.dp, 70.49);
  near("Dp 建議", s.dpSize, 75, 0);
}

console.log(failed ? `\n${failed} 項不符` : "\n全部吻合");
process.exit(failed ? 1 : 0);
