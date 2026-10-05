// 變壓器規格資料抽查：以型錄原圖核對之數值比對 src/data/transformers.ts。
// 執行：npm run verify:transformers
import { ROWS, type SeriesId, type Secondary, type TransformerRow } from "../src/data/transformers.ts";

let failed = 0;

function eq(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${label}: ${JSON.stringify(actual)}（預期 ${JSON.stringify(expected)}）`);
}

const row = (s: SeriesId, sec: Secondary, kva: number) => ROWS.find((r) => r.series === s && r.secondary === sec && r.kva === kva);
const pick = (r: TransformerRow | undefined, keys: (keyof TransformerRow)[]) =>
  r ? Object.fromEntries(keys.map((k) => [k, r[k]])) : null;

console.log("\n筆數");
const count = (s: SeriesId, sec: Secondary) => ROWS.filter((r) => r.series === s && r.secondary === sec).length;
eq("SK 220V／380Y", [count("oil-sk", "220"), count("oil-sk", "380Y")], [11, 11]);
eq("高效率油浸 220V／380Y", [count("oil-he", "220"), count("oil-he", "380Y")], [11, 13]);
eq("DI 220V／380Y", [count("oil-di", "220"), count("oil-di", "380Y")], [11, 13]);
eq("DH 220V／380Y", [count("oil-dh", "220"), count("oil-dh", "380Y")], [7, 9]);
eq("EVD3、SD（每種二次電壓）", [count("cast-evd3", "380Y"), count("cast-sd", "380Y")], [6, 15]);

console.log("\n油浸式（型錄 P.3～P.17）");
eq("SK 380Y 1500 kVA", pick(row("oil-sk", "380Y", 1500), ["size", "weight", "oil", "ductSize", "ductWeight"]), {
  size: [1250, 2160, 1773],
  weight: 4130,
  oil: 1150,
  ductSize: [1500, 2160, 2075],
  ductWeight: 4250,
});
eq("SK 特性 1000 kVA", pick(row("oil-sk", "220", 1000), ["eff", "fullLoss", "imp"]), { eff: 98.8, fullLoss: 12145, imp: "4.5～6.0" });
eq("高效率 1000 kVA", pick(row("oil-he", "220", 1000), ["eff", "noLoadLoss", "loadLoss", "fullLoss", "imp"]), {
  eff: 99.01,
  noLoadLoss: 1590,
  loadLoss: 8409,
  fullLoss: 9999,
  imp: "4.0～5.5",
});
eq("DI 220V 2000 kVA", pick(row("oil-di", "220", 2000), ["size", "weight", "oil"]), { size: [1480, 2260, 1673], weight: 4450, oil: 1150 });
eq("DI 特性 2000 kVA", pick(row("oil-di", "380Y", 2000), ["eff", "fullLoss", "imp"]), { eff: 98.7, fullLoss: 26342, imp: "5.5～6.5" });
eq("DH 220V 1500 kVA", pick(row("oil-dh", "220", 1500), ["size", "weight", "oil"]), { size: [1220, 2120, 1723], weight: 3450, oil: 1080 });

console.log("\n模鑄式（型錄 P.3～P.5）");
eq("EVD3 2000 kVA", pick(row("cast-evd3", "380Y", 2000), ["size", "weight", "box", "boxWeight", "imp", "noise"]), {
  size: [1850, 1160, 2060],
  weight: 4650,
  box: [2400, 1700, 2600],
  boxWeight: 5400,
  imp: "6.0",
  noise: 57,
});
eq("SD 1000 kVA", pick(row("cast-sd", "380Y", 1000), ["size", "weight", "imp", "noise", "box"]), {
  size: [1550, 1060, 1900],
  weight: 2400,
  imp: "6",
  noise: 64,
});

console.log(failed ? `\n${failed} 項不符` : "\n全部吻合");
process.exit(failed ? 1 : 0);
