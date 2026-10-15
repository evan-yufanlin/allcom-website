// 電信室空間檢討驗算：以技術規範圖 7-10 及第 17 章設計範例核對（docs/telecom-spec.md 第 13 節）。
// 執行：npm run verify:telecom
import { calculateTelecom, defaultTelecomInput, type FloorRow, type TelecomInput } from "../src/lib/telecom.ts";

let failed = 0;

function eq(label: string, actual: unknown, expected: unknown) {
  const ok = actual === expected;
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${label}: ${String(actual)}（預期 ${String(expected)}）`);
}

const run = (patch: Partial<TelecomInput>) => calculateTelecom({ ...defaultTelecomInput(), ...patch });
const row = (label: string, floors: number, use: FloorRow["use"], units: number, area: number): FloorRow => ({ label, floors, use, units, area });

console.log("\n圖 7-10：11 層集合住宅（地下 2 層）");
{
  const r = run({
    above: 11,
    below: 2,
    rows: [
      row("2F～11F", 10, 3, 4, 259.83),
      row("1F", 1, 2, 2, 182.75),
      row("1F", 1, "mc", 1, 0),
      row("B1～B2", 2, 7, 1, 547.57),
    ],
  });
  eq("各層合計", r.sumPairs, 96);
  eq("引進總對數", r.inPairs, 128);
  eq("光纖心數", r.cores, 172);
  eq("應設電信室", r.room.required, true);
  eq("電信室面積", r.room.area, 7);
  eq("主幹配線對數（圖列 168P）", r.dist, 168);
  eq("引進管", `${r.pipes.size}×${r.pipes.count}`, "52×8");
  eq("OLDF", r.oldf?.id, "OLDF-3");
  eq("MDF（公式 A）", r.mdf?.id, "MDF-2");
  eq("非最底層提醒", r.notes.length, 1);
}

console.log("\n範例一：單戶透天 3 層（未設光纜）");
{
  const r = run({ mode: "houses", above: 3, fiber: false, houses: { count: 1, area: 422 } });
  eq("每戶對數（13 對得採用 4 對）", r.rows[0].unitPairs, 4);
  eq("引進總對數", r.inPairs, 6);
  eq("應設電信室", r.room.required, false);
  eq("引進管", `${r.pipes.size}×${r.pipes.count}`, "28×3");
  eq("總配線箱", r.mainBox?.[0].box?.id, "A-04-1");
}

console.log("\n範例二：連棟住宅 4 戶（引進光纜，三者共用集中總箱）");
{
  const r = run({ mode: "houses", above: 3, boxMode: "c", houses: { count: 4, area: 112 } });
  eq("引進總對數", r.inPairs, 11);
  eq("光纖心數", r.cores, 16);
  eq("應設電信室", r.room.required, false);
  eq("引進管", `${r.pipes.size}×${r.pipes.count}`, "41×4");
  eq("集中總箱", r.mainBox?.[0].box?.id, "A-4");
}

console.log("\n範例三：6 層雙併住宅（地下 1 層）");
{
  const r = run({
    above: 6,
    below: 1,
    rows: [row("2F～6F", 5, 3, 2, 320), row("1F", 1, 3, 2, 320), row("1F", 1, "mc", 1, 0), row("B1", 1, 7, 1, 320)],
  });
  eq("各層合計", r.sumPairs, 28);
  eq("引進總對數", r.inPairs, 38);
  eq("光纖心數", r.cores, 52);
  eq("電信室面積", r.room.area, 3.6);
  eq("引進管", `${r.pipes.size}×${r.pipes.count}`, "52×8");
  eq("MDF", r.mdf?.id, "MDF-2");
  eq("OLDF", r.oldf?.id, "OLDF-3");
}

console.log("\n範例四：10 層商業大樓（地下 2 層）");
{
  const r = run({
    above: 10,
    below: 2,
    rows: [row("1F～10F", 10, 2, 4, 1680), row("1F", 1, "mc", 1, 0), row("B1～B2", 2, 7, 1, 1750)],
  });
  eq("各層合計", r.sumPairs, 850);
  eq("引進總對數", r.inPairs, 1134);
  eq("光纖心數（每戶 420 m² ≧ 300 → 6 心）", r.cores, 244);
  eq("電信室面積（依對數）", r.room.area, 20);
  eq("引進管（80 mm，電話 2 管）", `${r.pipes.size}×${r.pipes.count}`, "80×9");
  eq("OLDF", r.oldf?.id, "OLDF-3");
  eq("MDF（公式 A；範例依電纜規格為 MDF-18）", r.mdf?.id, "MDF-12");
}

console.log("\n範例五：10 層企業總部（單獨所有權，地下 1 層）");
{
  const r = run({ above: 10, below: 1, singleOwner: true, rows: [row("1F～10F", 10, 2, 1, 900), row("B1", 1, 7, 1, 900)] });
  eq("各層合計", r.sumPairs, 452);
  eq("引進總對數", r.inPairs, 603);
  eq("光纖心數（每層 4 心）", r.cores, 40);
  eq("應設電信室（依對數）", r.room.required, true);
  eq("電信室面積", r.room.area, 14);
}

console.log("\n範例六：5 層公有運動中心（單獨所有權，地下 1 層）");
{
  const r = run({
    above: 5,
    below: 1,
    singleOwner: true,
    rows: [row("1F～4F", 4, 4, 1, 900), row("5F", 1, 7, 1, 900), row("B1", 1, 7, 1, 900)],
  });
  eq("各層合計", r.sumPairs, 76);
  eq("引進總對數", r.inPairs, 102);
  eq("光纖心數", r.cores, 16);
  eq("電信室面積", r.room.area, 3.6);
  eq("引進管", `${r.pipes.size}×${r.pipes.count}`, "52×8");
  eq("OLDF", r.oldf?.id, "OLDF-048");
  eq("MDF", r.mdf?.id, "MDF-2");
}

console.log("\n其他規則");
{
  const r = run({ mode: "direct", above: 6, below: 1, direct: { pairs: 250, cores: 40 }, room: { length: 2, width: 3 } });
  eq("201～299 對暫以 80 mm 並標示", r.pipes.size === 80 && r.pipes.flags.length === 1, true);
  eq("長寬檢核 2×3＝6 ＜ 7 m²", r.room.check?.ok, false);
  const s = run({ rows: [row("2F", 1, 2, 1, 2000)], above: 3, boxMode: "separate" });
  eq("分開設置：電話、光纜、同軸各一箱", s.floorBoxes[0].boxes.length, 3);
}

console.log(failed ? `\n${failed} 項不符` : "\n全部吻合");
process.exit(failed ? 1 : 0);
