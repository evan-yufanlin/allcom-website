// 專案機電空間檢討驗算：密碼雜湊、登入憑證、輸入存檔格式（docs/projects-spec.md 第 5 節）。
// 執行：npm run verify:projects
import { hashPassword, safeEqual, verifyPassword } from "../src/lib/projects/password.ts";
import { SESSION_DAYS, canAccess, readSession, signSession } from "../src/lib/projects/session.ts";
import { parseSubstationInput, summarizeSubstation, summarizeWaterSupply, summaryText } from "../src/lib/projects/tools.ts";
import { TEMPLATES } from "../src/lib/substation.ts";
import { calculateWaterSupply } from "../src/lib/waterSupply.ts";
import { deriveWaterSupply, parseWaterSupplyForm, type WaterSupplyForm } from "../src/lib/waterSupplyForm.ts";

let failed = 0;
function check(label: string, ok: boolean) {
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${label}`);
}

console.log("密碼雜湊");
{
  const h = await hashPassword("abc123456");
  check("雜湊不含原文", !h.includes("abc123456") && h.startsWith("scrypt$"));
  check("正確密碼通過", await verifyPassword("abc123456", h));
  check("錯誤密碼不通過", !(await verifyPassword("abc12345", h)));
  check("同一密碼兩次雜湊不同（加鹽）", h !== (await hashPassword("abc123456")));
  check("格式錯誤之雜湊不通過", !(await verifyPassword("x", "bad")));
  check("管理密碼比對", safeEqual("Admin!2026", "Admin!2026") && !safeEqual("Admin!2026", "admin!2026"));
}

console.log("\n登入憑證");
{
  const secret = "s".repeat(40);
  const now = Date.UTC(2026, 10, 6);
  const t = await signSession({ admin: false, projects: ["2026-001"] }, secret, now);
  const s = await readSession(t, secret, now + 86400e3);
  check("1 天後有效", s.projects[0] === "2026-001" && !s.admin);
  check("可進入 2026-001", canAccess(s, "2026-001") && !canAccess(s, "2026-002"));
  const late = await readSession(t, secret, now + (SESSION_DAYS * 86400 + 60) * 1000);
  check("7 天後失效", late.projects.length === 0);
  check("簽章金鑰不符失效", (await readSession(t, "x".repeat(40), now)).projects.length === 0);
  check("竄改內容失效", (await readSession(t.replace(/\.[^.]+\./, ".eyJhZG1pbiI6dHJ1ZX0."), secret, now)).admin === false);
  const a = await readSession(await signSession({ admin: true, projects: [] }, secret, now), secret, now);
  check("管理者可進入任一專案", canAccess(a, "2026-009"));
}

console.log("\n自設變電站存檔格式");
{
  const t = TEMPLATES.find((x) => x.id === "three")!;
  const input = { projectName: "測試", clearances: t.clearances, rows: t.rows };
  const parsed = parseSubstationInput(JSON.parse(JSON.stringify(input)));
  check("三列範本可存檔", parsed !== null);
  const sum = summarizeSubstation(parsed!);
  check(`載入後計算一致：${sum.length} × ${sum.depth}，${sum.area} m²`, sum.length === 10500 && sum.depth === 11030 && sum.area === 115.8);
  check("缺通道條件拒收", parseSubstationInput({ ...input, clearances: {} }) === null);
  check("設備尺寸非數字拒收", parseSubstationInput({ ...input, rows: [{ facing: "down", items: [{ name: "X", group: "panel", width: "1", depth: 1, door: "single" }] }] }) === null);
  check("不明欄位捨棄", !("evil" in parseSubstationInput({ ...input, evil: 1 })!));
  const lv = { name: "低壓模鑄 IP20 100kVA", group: "lv", width: 940, depth: 450, height: 1135, door: "none" };
  check("低壓變壓器可存檔", parseSubstationInput({ ...input, rows: [{ facing: "down", items: [lv] }] })?.rows[0].items[0].group === "lv");
}

console.log("\n給水水理計算存檔格式");
{
  // 台水案例一（scripts/verify-water.ts）：科學園區廠房（銅鑼園區）生活用水
  const sys = {
    name: "生活用水",
    suites: 0,
    houses: 0,
    townhouses: 0,
    perSuite: 2,
    perHouse: 3,
    perTownhouse: 6,
    v2Factor: 1.1,
    tongluo: true,
    rows: [{ kind: "people" as const, label: "員工", preset: "office", building: 0, people: 1254, litres: 19.5 }],
    others: [],
    tanks: [
      { kind: "pool" as const, label: "水池", length: 4.95, width: 2.45, depth: 2.7, count: 2 },
      { kind: "tower" as const, label: "水塔", length: 3.6, width: 2.95, depth: 1.5, count: 2 },
    ],
  };
  const form: WaterSupplyForm = {
    projectName: "測試",
    county: "苗栗縣",
    district: "其他行政區",
    partialTaiwan: false,
    xizhiVillage: "other",
    areaKey: "general",
    highlandDays: 1.5,
    legacy: false,
    systems: [sys],
    plan: { manual: true, planned: null, prior: 0, basis: "vd", otherStorage: 0 },
  };
  const parsed = parseWaterSupplyForm(JSON.parse(JSON.stringify(form)));
  check("台水案例一可存檔", parsed !== null);
  const sum = summarizeWaterSupply(parsed!);
  check(`載入後計算一致：${sum.jurisdiction}，V ${sum.v}、Vd ${sum.vd}、總表 ${sum.meterSize} mm`, sum.jurisdiction === "taiwan" && sum.v === 26.9 && sum.vd === 32.28 && sum.meterSize === 40);
  const calc = (f: WaterSupplyForm) => {
    const { input: _i, ...r } = calculateWaterSupply(deriveWaterSupply(f).input);
    return (void _i, r);
  };
  const direct = calc(form);
  check("存檔前後計算結果相同（含 3 日檢討）", JSON.stringify(direct) === JSON.stringify(calc(parsed!)) && direct.plan.ok);
  check(`摘要文字：${summaryText("water-supply", sum)}`, summaryText("water-supply", sum).includes("26.9"));
  const tp = summarizeWaterSupply({ ...form, county: "臺北市" });
  check("臺北市判定北水", tp.jurisdiction === "taipei");
  check("新北市新店區判定北水", deriveWaterSupply({ ...form, county: "新北市", district: "新店區" }).jurisdiction === "taipei");
  check("縣市不在清單拒收", parseWaterSupplyForm({ ...form, county: "東京" }) === null);
  check("系統數 0 拒收", parseWaterSupplyForm({ ...form, systems: [] }) === null);
  check("用水列種類不明拒收", parseWaterSupplyForm({ ...form, systems: [{ ...sys, rows: [{ ...sys.rows[0], kind: "x" }] }] }) === null);
  check("水池尺寸為負拒收", parseWaterSupplyForm({ ...form, systems: [{ ...sys, tanks: [{ ...sys.tanks[0], length: -1 }] }] }) === null);
  check("不明欄位捨棄", !("evil" in parseWaterSupplyForm({ ...form, evil: 1 })!) && !("evil" in parseWaterSupplyForm({ ...form, systems: [{ ...sys, evil: 1 }] })!.systems[0]));
}

console.log(failed ? `\n${failed} 項不符` : "\n全部吻合");
process.exit(failed ? 1 : 0);
