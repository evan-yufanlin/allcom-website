// 自設變電站平面示意圖：將計算結果轉為繪圖元素（單位 mm），供網頁 SVG 與 PDF 共用。
import { type Group, type SubstationResult } from "./substation.ts";

export interface DrawRect {
  x: number;
  y: number;
  w: number;
  h: number;
  group: Group | "room";
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
}

export interface Drawing {
  viewBox: [number, number, number, number];
  unit: number;
  rects: DrawRect[];
  lines: DrawLine[];
  arcs: string[];
  texts: DrawText[];
}

export const FILL: Record<DrawRect["group"], string> = {
  room: "none",
  panel: "#D5E6E1",
  oil: "#F6DFAE",
  cast: "#DCD6F4",
  custom: "#E5E7EB",
};
export const STROKE: Record<DrawRect["group"], string> = {
  room: "#14141F",
  panel: "#5E8A7E",
  oil: "#B38A2E",
  cast: "#6D5FB8",
  custom: "#6B7280",
};

const n = (v: number) => v.toLocaleString("en-US");

export function buildDrawing(r: SubstationResult): Drawing {
  const L = r.length;
  const D = r.depth;
  const unit = Math.max(L, D) / 60; // 文字與標註之基準尺度
  const rects: DrawRect[] = [{ x: 0, y: 0, w: L, h: D, group: "room" }];
  const lines: DrawLine[] = [];
  const arcs: string[] = [];
  const texts: DrawText[] = [];

  for (const row of r.rows) {
    for (const it of row.items) {
      rects.push({ x: it.x, y: it.y, w: it.width, h: it.depth, group: it.group, name: it.name, sub: `${n(it.width)}×${n(it.depth)}` });
      // 門扇：鉸鏈在設備左端（雙開門兩端），開向前側
      const frontY = row.facing === "down" ? it.y + it.depth : it.y;
      const dir = row.facing === "down" ? 1 : -1;
      const leaves =
        it.door === "single"
          ? [{ hx: it.x, r: it.width, s: 1 }]
          : it.door === "double"
            ? [
                { hx: it.x, r: it.width / 2, s: 1 },
                { hx: it.x + it.width, r: it.width / 2, s: -1 },
              ]
            : [];
      for (const lf of leaves) {
        const ey = frontY + dir * lf.r;
        lines.push({ x1: lf.hx, y1: frontY, x2: lf.hx, y2: ey, dashed: true, thin: true });
        const sweep = (dir === 1) === (lf.s === 1) ? 1 : 0;
        arcs.push(`M ${lf.hx + lf.s * lf.r} ${frontY} A ${lf.r} ${lf.r} 0 0 ${sweep} ${lf.hx} ${ey}`);
      }
    }
    texts.push({ x: -unit * 0.8, y: row.y + row.depth / 2, text: `第${row.index}列`, anchor: "end", size: "s" });
  }

  // 總長（上方）
  const ty = -unit * 2.2;
  lines.push({ x1: 0, y1: ty, x2: L, y2: ty, thin: true });
  lines.push({ x1: 0, y1: ty - unit * 0.5, x2: 0, y2: ty + unit * 0.5, thin: true });
  lines.push({ x1: L, y1: ty - unit * 0.5, x2: L, y2: ty + unit * 0.5, thin: true });
  texts.push({ x: L / 2, y: ty - unit * 0.6, text: `室內淨長 ${n(L)}`, anchor: "middle", size: "m" });

  // 總深（左方）
  const lx = -unit * 5.2;
  lines.push({ x1: lx, y1: 0, x2: lx, y2: D, thin: true });
  lines.push({ x1: lx - unit * 0.5, y1: 0, x2: lx + unit * 0.5, y2: 0, thin: true });
  lines.push({ x1: lx - unit * 0.5, y1: D, x2: lx + unit * 0.5, y2: D, thin: true });
  texts.push({ x: lx - unit * 0.6, y: D / 2, text: `淨深 ${n(D)}`, anchor: "middle", size: "m", vertical: true });

  // 分段（右方）
  const rx = L + unit * 1.5;
  lines.push({ x1: rx, y1: 0, x2: rx, y2: D, thin: true });
  for (const s of r.segments) {
    lines.push({ x1: rx - unit * 0.4, y1: s.y, x2: rx + unit * 0.4, y2: s.y, thin: true });
    texts.push({ x: rx + unit * 0.8, y: s.y + s.size / 2, text: `${s.kind === "gap" ? s.label : ""} ${n(s.size)}`.trim(), anchor: "start", size: "s" });
  }
  lines.push({ x1: rx - unit * 0.4, y1: D, x2: rx + unit * 0.4, y2: D, thin: true });

  // 兩端離牆
  const by = D + unit * 1.6;
  const firstRow = r.rows[0];
  if (firstRow) {
    texts.push({ x: r.clearances.left / 2, y: by, text: n(r.clearances.left), anchor: "middle", size: "s" });
    texts.push({ x: L - r.clearances.right / 2, y: by, text: n(r.clearances.right), anchor: "middle", size: "s" });
  }

  const padL = unit * 7;
  const padT = unit * 4;
  const padR = unit * 9;
  const padB = unit * 3;
  return { viewBox: [-padL, -padT, L + padL + padR, D + padT + padB], unit, rects, lines, arcs, texts };
}
