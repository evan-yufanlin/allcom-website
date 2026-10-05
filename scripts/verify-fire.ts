// 消防水池容量驗算：以 docs/fire-water-spec.md 第 5 節之案例核對計算結果。
// 執行：npm run verify:fire
import { calculateFireWater, defaultFireInput, type FireInput } from "../src/lib/fireWater.ts";

let failed = 0;

function near(label: string, actual: number | null | undefined, expected: number, tol = 0.015) {
  const ok = actual !== null && actual !== undefined && Math.abs(actual - expected) <= tol;
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${label}: ${actual === null || actual === undefined ? "null" : +actual.toFixed(4)}（預期 ${expected}）`);
}

const input = (patch: (p: FireInput) => void) => {
  const p = defaultFireInput();
  patch(p);
  return p;
};

// 案例一：科學園區廠房（銅鑼園區），審訖圖 F0-001
{
  console.log("\n案例一：科學園區廠房（幫浦出水量）");
  const p = input((p) => {
    p.indoor = { on: true, kind: "first", single: false };
    p.outdoor = { on: true };
    p.sprinkler = {
      on: true,
      zones: [
        { name: "停車空間", head: "general", heads: 15, dry: false },
        { name: "貨架", head: "rack", heads: 24, dry: false },
        { name: "辦公區", head: "general", heads: 12, dry: false },
      ],
    };
    p.reservoir = { on: true, clause: 1, floor12: 12664.92 + 19.35 + 254.7 + 38.51 + 2785.22, total: 62051.97, shared: true };
    p.poolSpec = { height: 1.8, bottom: 0.3, top: 0.2, suction: 150 };
    p.pools = [
      { label: "消防水池 1", area: 21.31, depth: 1.05, count: 1 },
      { label: "消防水池 2", area: 43.8, depth: 1.04, count: 1 },
      { label: "消防水池 3", area: 41.64, depth: 1.03, count: 1 },
      { label: "消防水池 4", area: 52.5, depth: 1.02, count: 1 },
      { label: "消防水池 5", area: 31.84, depth: 1.01, count: 1 },
      { label: "消防水池 6", area: 31.84, depth: 1.0, count: 1 },
    ];
  });
  const r = calculateFireWater(p);
  const m = (k: string) => r.lines.find((l) => l.key === k)?.m3;
  near("室內消防栓", m("indoor"), 6);
  near("室外消防栓", m("outdoor"), 24);
  near("撒水取最大值（貨架）", m("sprinkler"), 62.4);
  near("撒水最大區為貨架", r.zones.findIndex((z) => z.max), 1, 0);
  near("消防專用蓄水池（第一款）", r.reservoir?.m3, 60);
  near("第二款對照", r.reservoir?.byTotal, 100);
  near("採水口", r.reservoir?.outlets, 2, 0);
  near("合計", r.required, 152.4);
  near("試算有效高度", r.defaultDepth, 1.05);
  near("實設有效水量", r.poolTotal, 228.36);
  near("實設判定", r.poolOk ? 1 : 0, 1, 0);
  near("屋頂水箱", r.roofTank?.m3, 1);

  console.log("\n案例一：法定放水量對照");
  const legal = calculateFireWater({ ...p, basis: "legal" });
  const ml = (k: string) => legal.lines.find((l) => l.key === k)?.m3;
  near("室內消防栓 130 × 2 × 20", ml("indoor"), 5.2);
  near("室外消防栓 350 × 2 × 30", ml("outdoor"), 21);
  near("撒水 114 × 24 × 20", ml("sprinkler"), 54.72);

  console.log("\n案例一：消防專用蓄水池獨立設置");
  const sep = calculateFireWater({ ...p, reservoir: { ...p.reservoir, shared: false } });
  near("消防水池", sep.required, 92.4);
  near("專用蓄水池另列", sep.separate, 60);
}

// 案例二：宗教建築（泡沫）
{
  console.log("\n案例二：宗教建築（泡沫＋室內消防栓）");
  const r = calculateFireWater(
    input((p) => {
      p.indoor = { on: true, kind: "first", single: false };
      p.foam = { on: true, area: 100, agent: "synthetic", pipeFill: 0 };
    }),
  );
  near("泡沫 100 × 8 × 20 × 1.2", r.lines.find((l) => l.key === "foam")?.m3, 19.2);
  near("合計", r.required, 25.2);
}

// 其他規則
{
  console.log("\n其他規則");
  const r = calculateFireWater(
    input((p) => {
      p.indoor = { on: true, kind: "second", single: true };
      p.sprinkler = { on: true, zones: [{ name: "預動式", head: "general", heads: 15, dry: true }] };
    }),
  );
  near("第二種、僅 1 支：90 × 1 × 20", r.lines.find((l) => l.key === "indoor")?.m3, 1.8);
  near("預動式 15 × 1.5 → 23 個", r.zones[0].countedHeads, 23, 0);
  near("預動式水源 90 × 23 × 20", r.zones[0].m3, 41.4);
  near("試算有效高度（池高 0）", r.defaultDepth, 0);
}

console.log(failed ? `\n${failed} 項不符` : "\n全部吻合");
process.exit(failed ? 1 : 0);
