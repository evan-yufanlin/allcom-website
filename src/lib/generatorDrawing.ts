// 緊急發電機室平面示意圖：將計算結果轉為繪圖元素（單位 mm），供網頁 SVG 與 PDF 共用。
import { fmt, type GenResult } from "./generator.ts";

export type Group = "room" | "gen" | "zone" | "dike" | "tank" | "louver";

export interface DrawRect {
  x: number;
  y: number;
  w: number;
  h: number;
  group: Group;
  name?: string;
  sub?: string;
}
export interface DrawLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  dashed?: boolean;
  thin?: boolean;
}
export interface DrawText {
  x: number;
  y: number;
  text: string;
  anchor: "start" | "middle" | "end";
  size: "s" | "m" | "l";
  vertical?: boolean;
  accent?: boolean;
}

export interface Drawing {
  viewBox: [number, number, number, number];
  unit: number;
  rects: DrawRect[];
  lines: DrawLine[];
  /** 箭頭（實心多邊形 path） */
  arrows: string[];
  texts: DrawText[];
}

export const FILL: Record<Group, string> = {
  room: "none",
  gen: "#D5E6E1",
  zone: "none",
  dike: "#F3F4F6",
  tank: "#F6DFAE",
  louver: "#6D5FB8",
};
export const STROKE: Record<Group, string> = {
  room: "#14141F",
  gen: "#5E8A7E",
  zone: "#5E8A7E",
  dike: "#8A8DA0",
  tank: "#B38A2E",
  louver: "#6D5FB8",
};
export const ARROW_FILL = "#6D5FB8";

const n = (v: number) => fmt(v, 0);

/** 水平或垂直尺寸鏈：在 at 位置畫線，分段點 marks，文字置於各段中點。 */
function chain(lines: DrawLine[], texts: DrawText[], u: number, dir: "h" | "v", at: number, marks: number[], labels: string[], side: 1 | -1) {
  const [a, b] = [marks[0], marks[marks.length - 1]];
  if (dir === "h") lines.push({ x1: a, y1: at, x2: b, y2: at, thin: true });
  else lines.push({ x1: at, y1: a, x2: at, y2: b, thin: true });
  for (const m of marks) {
    if (dir === "h") lines.push({ x1: m, y1: at - u * 0.45, x2: m, y2: at + u * 0.45, thin: true });
    else lines.push({ x1: at - u * 0.45, y1: m, x2: at + u * 0.45, y2: m, thin: true });
  }
  labels.forEach((t, k) => {
    if (!t) return;
    const mid = (marks[k] + marks[k + 1]) / 2;
    if (dir === "h") texts.push({ x: mid, y: at + side * u * 0.85, text: t, anchor: "middle", size: "s" });
    else texts.push({ x: at + side * u * 0.85, y: mid, text: t, anchor: "middle", size: "s", vertical: true });
  });
}

function arrow(x: number, y: number, dx: number, u: number) {
  // 水平箭頭：由 x 指向 x + dx
  const s = Math.sign(dx);
  const head = u * 0.9;
  const shaft = u * 0.22;
  const tip = x + dx;
  const base = tip - s * head;
  return `M ${x} ${y - shaft} L ${base} ${y - shaft} L ${base} ${y - head * 0.6} L ${tip} ${y} L ${base} ${y + head * 0.6} L ${base} ${y + shaft} L ${x} ${y + shaft} Z`;
}

export function buildDrawing(r: GenResult): Drawing {
  const L = r.length;
  const D = r.width;
  const c = r.input.clear;
  const g = r.layout.gen;
  const u = Math.max(L, D) / 50;
  const rects: DrawRect[] = [{ x: 0, y: 0, w: L, h: D, group: "room" }];
  const lines: DrawLine[] = [];
  const arrows: string[] = [];
  const texts: DrawText[] = [];

  // 防液堤與日用油箱
  if (r.layout.dike && r.dike && r.tank && r.layout.tank) {
    const dk = r.layout.dike;
    const tk = r.layout.tank;
    rects.push({ x: dk.x, y: dk.y, w: dk.w, h: dk.h, group: "dike" });
    const wall = r.input.dikeWall;
    rects.push({ x: dk.x + wall, y: dk.y + wall, w: dk.w - 2 * wall, h: dk.h - 2 * wall, group: "dike" });
    rects.push({ x: tk.x, y: tk.y, w: tk.w, h: tk.h, group: "tank" });
    texts.push({ x: tk.x + tk.w / 2, y: tk.y + tk.h / 2, text: `日用油箱 ${n(r.tank.capacity)} L`, anchor: "middle", size: "s" });
    texts.push({
      x: dk.x + dk.w / 2,
      y: dk.y + dk.h - wall - u * 0.6,
      text: `防液堤 內 ${n(r.dike.inner[0])}×${n(r.dike.inner[1])} 高 ${n(r.dike.height)}`,
      anchor: "middle",
      size: "s",
    });
  }

  // 機組：散熱水箱、引擎、發電機三段示意（約 12%、50%、38%）
  rects.push({ x: g.x, y: g.y, w: g.w, h: g.h, group: "gen" });
  const z1 = g.x + g.w * 0.12;
  const z2 = g.x + g.w * 0.62;
  lines.push({ x1: z1, y1: g.y, x2: z1, y2: g.y + g.h, dashed: true, thin: true });
  lines.push({ x1: z2, y1: g.y, x2: z2, y2: g.y + g.h, dashed: true, thin: true });
  const zy = g.y + g.h * 0.28;
  texts.push({ x: (g.x + z1) / 2, y: g.y + g.h / 2, text: "散熱水箱", anchor: "middle", size: "s", vertical: true });
  texts.push({ x: (z1 + z2) / 2, y: zy, text: "引擎", anchor: "middle", size: "s" });
  texts.push({ x: (z2 + g.x + g.w) / 2, y: zy, text: "發電機", anchor: "middle", size: "s" });
  texts.push({ x: g.x + g.w / 2, y: g.y + g.h * 0.55, text: r.input.unit.label, anchor: "middle", size: "m" });
  texts.push({ x: g.x + g.w / 2, y: g.y + g.h * 0.55 + u * 1.3, text: `機組 ${n(g.w)} × ${n(g.h)}`, anchor: "middle", size: "s" });

  // 百葉：排風於散熱水箱端牆（左），進風於發電機端牆（右），對齊機組
  const lh = Math.min(g.h, D * 0.6);
  const ly = g.y + (g.h - lh) / 2;
  const lw = u * 0.5;
  rects.push({ x: -lw / 2, y: ly, w: lw, h: lh, group: "louver" });
  rects.push({ x: L - lw / 2, y: ly, w: lw, h: lh, group: "louver" });
  const ay = g.y + g.h / 2;
  arrows.push(arrow(-u * 0.6, ay, -u * 3, u));
  arrows.push(arrow(L + u * 3.6, ay, -u * 3, u));
  texts.push({ x: -u * 2.4, y: ay - u * 1.5, text: "排風", anchor: "middle", size: "s", accent: true });
  texts.push({ x: L + u * 2.4, y: ay - u * 1.5, text: "進風", anchor: "middle", size: "s", accent: true });

  // 操作面
  if (r.input.opSide === "long") {
    texts.push({ x: g.x + g.w / 2, y: g.y + g.h + c.front / 2, text: `▲ 操作面 ${n(c.front)}`, anchor: "middle", size: "s", accent: true });
  } else {
    texts.push({ x: g.x + g.w + c.alternator / 2, y: g.y + g.h / 2, text: `操作面 ${n(c.alternator)}`, anchor: "middle", size: "s", accent: true, vertical: true });
  }

  // 尺寸：上方總長、下方長向分段、左方總寬、右方寬向分段
  chain(lines, texts, u, "h", -u * 2.2, [0, L], [`機房淨長 ${n(L)}`], -1);
  const runEnd = g.x + g.w + c.alternator;
  const hMarks = [0, g.x, g.x + g.w, runEnd];
  const hLabels = [n(c.radiator), n(g.w), n(c.alternator)];
  if (runEnd < L - 1e-6) {
    hMarks.push(L);
    hLabels.push(n(L - runEnd));
  }
  chain(lines, texts, u, "h", D + u * 1.6, hMarks, hLabels, 1);
  chain(lines, texts, u, "v", -u * 6.2, [0, D], [`機房淨寬 ${n(D)}`], -1);
  const vMarks = [0];
  const vLabels: string[] = [];
  if (r.layout.dike) {
    vMarks.push(r.layout.dike.h);
    vLabels.push(`堤 ${n(r.layout.dike.h)}`);
  }
  vMarks.push(g.y, g.y + g.h, D);
  vLabels.push(n(c.back), n(g.h), n(c.front));
  chain(lines, texts, u, "v", L + u * 5.4, vMarks, vLabels, 1);

  const padL = u * 8;
  const padT = u * 4;
  const padR = u * 8;
  const padB = u * 3.5;
  return { viewBox: [-padL, -padT, L + padL + padR, D + padT + padB], unit: u, rects, lines, arrows, texts };
}
