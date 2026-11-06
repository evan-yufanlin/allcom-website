// 專案機電空間檢討驗算：密碼雜湊、登入憑證、輸入存檔格式（docs/projects-spec.md 第 5 節）。
// 執行：npm run verify:projects
import { hashPassword, safeEqual, verifyPassword } from "../src/lib/projects/password.ts";
import { SESSION_DAYS, canAccess, readSession, signSession } from "../src/lib/projects/session.ts";
import { parseSubstationInput, summarizeSubstation } from "../src/lib/projects/tools.ts";
import { TEMPLATES } from "../src/lib/substation.ts";

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
}

console.log(failed ? `\n${failed} 項不符` : "\n全部吻合");
process.exit(failed ? 1 : 0);
