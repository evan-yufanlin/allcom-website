// 緊急發電機室驗算：以 docs/generator-spec.md 第 6 節手算案例核對。
// 執行：npm run verify:generator
import { GENSETS, GEN_SERIES, TANKS } from "../src/data/generators.ts";
import { calculateGenerator, defaultGenInput, pickGensets, unitOf, type GenUnit } from "../src/lib/generator.ts";

let failed = 0;
function near(label: string, actual: number | null | undefined, expected: number, tol = 0.05) {
  const ok = actual !== null && actual !== undefined && Math.abs(actual - expected) <= tol;
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${label}: ${actual === null || actual === undefined ? "null" : +actual.toFixed(3)}（預期 ${expected}）`);
}
function check(label: string, ok: boolean) {
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${label}`);
}

const find = (series: string, model: string, engine: string) => {
  const g = GENSETS.find((x) => x.series === series && x.model === model && x.engine === engine);
  if (!g) throw new Error(`找不到 ${series} ${model} ${engine}`);
  return g;
};

console.log("型錄資料");
{
  const ids = new Set(GEN_SERIES.map((s) => s.id));
  check(`機組 ${GENSETS.length} 筆，系列皆存在`, GENSETS.every((g) => ids.has(g.series)));
  check("每個系列皆有資料", GEN_SERIES.every((s) => GENSETS.some((g) => g.series === s.id)));
  check("Standby kVA ≒ kW ÷ 0.8（誤差 2 kVA 內）", GENSETS.every((g) => Math.abs(g.standbyKva - g.standbyKw / 0.8) <= 2));
  check("東元皆有尺寸、中興皆有耗油量", GENSETS.every((g) => (g.series.startsWith("teco") ? !!g.size && g.fuel === null : g.fuel !== null && g.baseTank === null)));
  const noSize = GENSETS.filter((g) => !g.size).map((g) => `${g.series} ${g.model}`);
  check(`未列尺寸：${noSize.join("、")}`, noSize.length === 3);
  check("油箱依容量遞增且不超過 950 L", TANKS.every((t, k) => t.capacity <= 950 && (k === 0 || t.capacity > TANKS[k - 1].capacity)));
}

console.log("\n案例一：中興 CUMMINS CH-1000（QSK23-G3）");
{
  const r = calculateGenerator(defaultGenInput(unitOf(find("chem-cummins", "CH-1000", "QSK23-G3"))));
  near("耗油量", r.fuelRate, 212);
  near("所需容積 212 × 2 ÷ 0.9", r.needVolume, 471.1);
  near("日用油箱", r.tank?.capacity, 500, 0);
  near("防液堤內長", r.dike?.inner[0], 2230, 0);
  near("防液堤內寬", r.dike?.inner[1], 1570, 0);
  near("防液堤高（143 → 200）", r.dike?.height, 200, 0);
  near("防液堤外寬", r.dike?.outer[1], 1870, 0);
  near("機房淨長", r.length, 5550, 0);
  near("機房淨寬", r.width, 5170, 0);
  near("淨面積", r.area, 28.69, 0.01);
  near("儲油槽", r.storage, 0);
  near("機房內管制量倍數", r.roomMultiple, 0.5);
}

console.log("\n案例二：東元 MITSUBISHI TEG-2000S（S16R-PTAA2）");
{
  const r = calculateGenerator(defaultGenInput(unitOf(find("teco-mitsubishi", "TEG-2000S", "S16R-PTAA2"))));
  check("耗油量依係數估算", r.fuelEstimated && r.factor === 0.27);
  near("耗油量 2,000 × 0.27", r.fuelRate, 540);
  near("所需容積", r.needVolume, 1200);
  check("附油箱 950 L，不設獨立油箱", r.tank === null && r.baseTank === 950);
  near("儲油槽", r.storage, 250);
  near("機房淨長", r.length, 7200, 0);
  near("機房淨寬", r.width, 4100, 0);
  near("機房內管制量倍數", r.roomMultiple, 0.95);
}

console.log("\n案例三：自訂 300 kW");
{
  const unit: GenUnit = { label: "自訂", standbyKw: 300, size: [3000, 1200, 1800], baseTank: null, fuel: null };
  const r = calculateGenerator(defaultGenInput(unit));
  near("耗油量 300 × 0.31", r.fuelRate, 93);
  near("所需容積", r.needVolume, 206.7);
  near("日用油箱", r.tank?.capacity, 300, 0);
  near("防液堤高", r.dike?.height, 200, 0);
  near("機房淨長", r.length, 4200, 0);
  near("機房淨寬", r.width, 4600, 0);
}

console.log("\n案例四：案例一加大至 8 小時");
{
  const r = calculateGenerator({ ...defaultGenInput(unitOf(find("chem-cummins", "CH-1000", "QSK23-G3"))), hours: 8 });
  near("所需容積", r.needVolume, 1884.4);
  near("日用油箱", r.tank?.capacity, 950, 0);
  near("防液堤高", r.dike?.height, 241, 0);
  near("儲油槽", r.storage, 934.4);
  near("機房淨寬", r.width, 5370, 0);
}

console.log("\n案例五：東元 MTU TEG-1000S 附油箱達管制量");
{
  const r = calculateGenerator(defaultGenInput(unitOf(find("teco-mtu", "TEG-1000S", "16V 2000 G85"))));
  near("耗油量 1,000 × 0.27", r.fuelRate, 270);
  check("不設獨立油箱", r.tank === null);
  near("機房內管制量倍數", r.roomMultiple, 1.2);
  check("提醒已達管制量", r.warnings.some((w) => w.includes("已達管制量")));
}

console.log("\n案例六：百葉");
{
  const r = calculateGenerator({ ...defaultGenInput(unitOf(find("chem-cummins", "CH-1000", "QSK23-G3"))), radiatorFlow: 600, combustionFlow: 40 });
  near("排氣淨開口", r.exhaust?.freeArea, 2.0, 0.001);
  near("排氣總面積", r.exhaust?.grossArea, 5.0, 0.001);
  near("進氣淨開口", r.intake?.freeArea, 4.267, 0.001);
  near("進氣總面積", r.intake?.grossArea, 10.667, 0.001);
}

console.log("\n選型");
{
  const list = pickGensets(1000, "kva");
  const mitsu = list.filter((g) => g.series === "teco-mitsubishi").map((g) => `${g.model} ${g.engine}`);
  check(`1,000 kVA 東元 MITSUBISHI：${mitsu.join("、")}`, mitsu.length === 1 && mitsu[0] === "TEG-800S S12A2-Y2PTAW-2");
  check("略過未列尺寸機型", list.every((g) => g.size !== null));
}

console.log(failed ? `\n${failed} 項不符` : "\n全部吻合");
process.exit(failed ? 1 : 0);
