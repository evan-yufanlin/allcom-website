// 避雷設備檢討驗算：以 docs/lightning-spec.md 之條文邊界值核對計算結果。
// 執行：npm run verify:lightning
import { calculateLightning, conductorSize, defaultLightningInput, downConductors, type LightningInput } from "../src/lib/lightning.ts";

let failed = 0;

function eq(label: string, actual: unknown, expected: unknown, tol = 0.005) {
  const ok =
    typeof actual === "number" && typeof expected === "number" ? Math.abs(actual - expected) <= tol : actual === expected;
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${label}: ${String(actual)}（預期 ${String(expected)}）`);
}

const run = (patch: Partial<LightningInput>) => calculateLightning({ ...defaultLightningInput(), ...patch });

console.log("\n是否應設（第20條）");
eq("19.9 m 一般", run({ height: 19.9 }).required, false);
eq("20 m 一般", run({ height: 20 }).required, true);
eq("2.9 m 危險物品倉庫", run({ height: 2.9, hazmat: true }).required, false);
eq("3 m 危險物品倉庫", run({ height: 3, hazmat: true }).required, true);

console.log("\n導線斷面（第24條）");
eq("30 m", conductorSize(30), 30);
eq("30.1 m", conductorSize(30.1), 60);
eq("35.9 m", conductorSize(35.9), 60);
eq("36 m", conductorSize(36), 100);

console.log("\n引下導線條數（第25條第三款）");
eq("100 m", downConductors(100), 2);
eq("120 m", downConductors(120), 2);
eq("149 m", downConductors(149), 2);
eq("150 m", downConductors(150), 3);
eq("250 m", downConductors(250), 5);
const rect = run({ perimeterMode: "rect", length: 80, width: 45 });
eq("長 80 × 寬 45 → 外周長", rect.perimeter, 250);
eq("平均間距", rect.spacing, 50);

console.log("\n富蘭克林保護角（第21條）");
const f = run({ terminal: "franklin", rodHeight: 3, distance: 5 });
eq("60° 保護半徑 3 × tan60°", f.protection?.radius, 5.196);
eq("所需針高 5 ÷ tan60°", f.protection?.needed, 2.887);
eq("判定", f.protection?.ok, true);
const hz = run({ terminal: "franklin", hazmat: true, height: 5, rodHeight: 3, distance: 5 });
eq("危險物品倉庫 45° 保護半徑", hz.protection?.radius, 3);
eq("所需針高", hz.protection?.needed, 5);
eq("判定", hz.protection?.ok, false);
eq("ESE 不檢討保護角", run({ terminal: "ese", rodHeight: 3 }).protection, null);

console.log(failed ? `\n${failed} 項不符` : "\n全部吻合");
process.exit(failed ? 1 : 0);
