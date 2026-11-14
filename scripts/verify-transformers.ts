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

console.log("\n第二版：低壓模鑄式、低壓乾式（模鑄式型錄 P.7～P.10）");
eq("低壓模鑄、乾式各 15 級 × 3 種二次側", [count("cast-lv", "208Y"), count("dry-lv", "208Y"), count("cast-lv", "220"), count("dry-lv", "380Y")], [15, 15, 15, 15]);
eq("低壓模鑄 3 kVA（P.7、P.8）", pick(row("cast-lv", "208Y", 3), ["size", "weight", "box", "boxWeight", "imp", "noise"]), {
  size: [325, 260, 340],
  weight: 45,
  box: [385, 250, 535],
  boxWeight: 60,
  imp: "≦4.5",
  noise: 50,
});
eq("低壓模鑄 100 kVA", pick(row("cast-lv", "208Y", 100), ["size", "weight", "box", "boxWeight", "imp", "noise"]), {
  size: [860, 450, 890],
  weight: 410,
  box: [940, 450, 1135],
  boxWeight: 470,
  imp: "4.0～6.0",
  noise: 55,
});
eq("低壓模鑄 250 kVA", pick(row("cast-lv", "220", 250), ["size", "box", "boxWeight", "imp", "noise"]), {
  size: [1110, 550, 1090],
  box: [1210, 600, 1415],
  boxWeight: 895,
  imp: "4.5～7.0",
  noise: 58,
});
eq("低壓模鑄阻抗區段 20／25 kVA", [row("cast-lv", "208Y", 20)?.imp, row("cast-lv", "208Y", 25)?.imp], ["≦4.5", "3.0～5.5"]);
eq("低壓乾式 7.5 kVA（P.9、P.10）", pick(row("dry-lv", "208Y", 7.5), ["size", "weight", "box", "boxWeight"]), {
  size: [320, 260, 400],
  weight: 50,
  box: [370, 250, 520],
  boxWeight: 60,
});
eq("低壓乾式 200 kVA", pick(row("dry-lv", "208Y", 200), ["size", "weight", "box", "boxWeight", "imp"]), {
  size: [980, 550, 1030],
  weight: 600,
  box: [1050, 600, 1355],
  boxWeight: 690,
  imp: "3.0～5.5",
});
eq("低壓乾式阻抗區段 25／30 kVA", [row("dry-lv", "208Y", 25)?.imp, row("dry-lv", "208Y", 30)?.imp], ["≦4.5", "3.0～5.5"]);

console.log("\n第二版：油浸式 DI 小容量（油浸式型錄 P.10～P.13）");
eq("低壓轉低壓 208Y/120V 僅 3～15 kVA", ROWS.filter((r) => r.series === "oil-di-lv" && r.secondary === "208Y").map((r) => r.kva), [3, 5, 10, 15]);
eq("低壓轉低壓 208Y 10 kVA（P.11）", pick(row("oil-di-lv", "208Y", 10), ["size", "oil", "weight", "eff", "fullLoss"]), {
  size: [405, 390, 565],
  oil: 20,
  weight: 85,
  eff: 96.5,
  fullLoss: 362,
});
eq("低壓轉低壓 380Y 100 kVA（P.12，無特性值）", pick(row("oil-di-lv", "380Y", 100), ["size", "oil", "weight", "eff"]), {
  size: [680, 875, 1030],
  oil: 130,
  weight: 560,
});
eq("22.8kV 50 kVA（P.13）", pick(row("oil-di-s", "220", 50), ["size", "oil", "weight", "eff", "fullLoss"]), {
  size: [805, 480, 1165],
  oil: 120,
  weight: 410,
  eff: 97.3,
  fullLoss: 1387,
});
eq("22.8kV 20 kVA 特性表未列", row("oil-di-s", "380Y", 20)?.eff, undefined);
eq("高壓機種無 208Y/120V", ROWS.some((r) => r.secondary === "208Y" && !["cast-lv", "dry-lv", "oil-di-lv"].includes(r.series)), false);

console.log(failed ? `\n${failed} 項不符` : "\n全部吻合");
process.exit(failed ? 1 : 0);
