// 停車場通風驗算：以 docs/parking-ventilation-spec.md 第 5 節手算案例核對。
// 執行：npm run verify:parking-vent
import { calculateVent, defaultVentInput } from "../src/lib/parkingVent.ts";

let failed = 0;
function near(label: string, actual: number | null | undefined, expected: number, tol = 0.005) {
  const ok = actual !== null && actual !== undefined && Math.abs(actual - expected) <= tol;
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${label}: ${actual === null || actual === undefined ? "null" : +actual.toFixed(4)}（預期 ${expected}）`);
}

const floors = [
  { label: "B1", floors: 1, area: 2000 },
  { label: "B2～B3", floors: 2, area: 2500 },
];

console.log("\n分時運轉（預設）");
{
  const r = calculateVent({ ...defaultVentInput(), floors, fanFlow: 30000 });
  near("合計通風量", r.totalFlow, 175000);
  near("各層最大", r.maxFlow, 62500);
  near("管道間 62,500 ÷ 3600 ÷ 8", r.ductArea, 2.17);
  near("排氣百葉面積 62,500 ÷ 3600 ÷ 2.5", r.exhaust.grossArea, 6.944);
  near("排氣自由面積 × 0.4", r.exhaust.freeArea, 2.778);
  near("進氣百葉面積 ÷ 2.0", r.intake.grossArea, 8.681);
  near("進氣自由面積", r.intake.freeArea, 3.472);
  near("排氣自由面積風速 2.5 ÷ 0.4", r.exhaust.freeVelocity, 6.25);
  near("B1 風機 50,000 ÷ 30,000 → 2 台", r.rows[0].fans, 2, 0);
  near("合計台數 2 ＋ 3 × 2", r.totalFans, 8, 0);
}

console.log("\n同時運轉（選項）");
{
  const r = calculateVent({ ...defaultVentInput(), floors, simultaneous: true });
  near("管道間最上段 175,000 ÷ 3600 ÷ 8", r.ductArea, 6.076);
  near("B1 段（最上段）累計", r.rows[0].cumulative, 175000);
  near("B2～B3 段累計", r.rows[1].cumulative, 125000);
  near("排氣百葉面積 175,000 ÷ 3600 ÷ 2.5", r.exhaust.grossArea, 19.444);
  near("未輸入單台風量不計台數", r.totalFans === null ? 0 : 1, 0, 0);
}

console.log(failed ? `\n${failed} 項不符` : "\n全部吻合");
process.exit(failed ? 1 : 0);
