// 自設變電站空間檢討驗算：以 docs/substation-spec.md 第 5 節之案例（文升）核對計算結果。
// 執行：npm run verify:substation
import { DEFAULT_CLEARANCES, TEMPLATES, calculateSubstation, libraryItem } from "../src/lib/substation.ts";

let failed = 0;

function eq(label: string, actual: unknown, expected: unknown) {
  const ok = typeof actual === "number" && typeof expected === "number" ? Math.abs(actual - expected) < 0.05 : actual === expected;
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${label}: ${String(actual)}（預期 ${String(expected)}）`);
}

const tpl = (id: string) => TEMPLATES.find((t) => t.id === id)!;

console.log("\n方案一：單列");
{
  const t = tpl("single");
  const r = calculateSubstation(t.rows, t.clearances);
  eq("淨長", r.length, 13500);
  eq("淨深", r.depth, 4460);
  eq("面積 m²", +r.area.toFixed(1), 60.2);
  eq("門扇提醒數", r.warnings.length, 0);
}

console.log("\n方案二：三列");
{
  const t = tpl("three");
  const r = calculateSubstation(t.rows, t.clearances);
  eq("淨長", r.length, 10500);
  eq("淨深", r.depth, 11030);
  eq("面積 m²", +r.area.toFixed(1), 115.8);
  eq("深度分段", r.segments.map((s) => s.size).join("+"), "800+1800+2000+1860+800+1970+1800");
  eq("門扇提醒數", r.warnings.length, 1);
  eq("門扇提醒內容", r.warnings[0]?.includes("2,400") && r.warnings[0]?.includes("2,000"), true);
  eq("第2列 MP 前緣與油 3000 對齊", r.rows[1].items[1].y, r.rows[1].items[0].y);
  eq("第3列 SC 後緣較油 2500 短 170", r.rows[2].items[1].y - r.rows[2].items[0].y, 170);
}

console.log("\n其他規則");
{
  const c = DEFAULT_CLEARANCES;
  const r = calculateSubstation([{ facing: "up", items: [libraryItem("cast-3000")] }], c);
  eq("單列朝上：盤前 1800 ＋ 2000 ＋ 盤後 800", r.depth, 4600);
  eq("模鑄雙開門半徑 1450 ≦ 1800，無提醒", r.warnings.length, 0);
  const b = calculateSubstation(
    [
      { facing: "down", items: [libraryItem("panel-MP")] },
      { facing: "down", items: [libraryItem("panel-MP")] },
    ],
    c,
  );
  eq("前對背取盤前通道：800＋1800＋1800＋1800＋1800", b.depth, 8000);
  eq("空白列不計", calculateSubstation([{ facing: "down", items: [] }], c).depth, 0);
}

console.log(failed ? `\n${failed} 項不符` : "\n全部吻合");
process.exit(failed ? 1 : 0);
