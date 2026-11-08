import { FILL, STROKE, type DrawRect, type Drawing } from "@/lib/substationDrawing";

/** 設備名稱（可分行、縮小）與尺寸 */
function Label({ r, u }: { r: DrawRect; u: number }) {
  const k = r.scale ?? 1;
  const lines = r.lines ?? [r.name!];
  const lh = u * 0.85 * 1.1 * k;
  const top = r.y + r.h / 2 - ((lines.length - 1) * lh) / 2 - u * 0.15 * k;
  return (
    <>
      {lines.map((l, i) => (
        <text key={i} x={r.x + r.w / 2} y={top + i * lh} textAnchor="middle" fontSize={u * 0.85 * k} fontWeight={700} fill="#14141F">
          {l}
        </text>
      ))}
      <text x={r.x + r.w / 2} y={top + (lines.length - 1) * lh + u * 1.05 * k} textAnchor="middle" fontSize={u * 0.6 * k} fill="#5C5F72">
        {r.sub}
      </text>
    </>
  );
}

const SIZE = { s: 0.75, m: 0.95, l: 1.2 };

/** 網頁版平面示意圖（SVG，單位 mm）。 */
export default function SubstationPlan({ d }: { d: Drawing }) {
  const u = d.unit;
  return (
    <svg viewBox={d.viewBox.join(" ")} className="h-auto w-full" role="img" aria-label="變電站平面示意圖">
      {d.rects.map((r, i) => (
        <g key={i}>
          <rect
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            fill={FILL[r.group]}
            stroke={STROKE[r.group]}
            strokeWidth={r.group === "room" ? u * 0.18 : u * 0.06}
          />
          {r.name && <Label r={r} u={u} />}
        </g>
      ))}
      {d.lines.map((l, i) => (
        <line
          key={i}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke={l.dashed ? "#8A8DA0" : "#5C5F72"}
          strokeWidth={u * (l.thin ? 0.05 : 0.1)}
          strokeDasharray={l.dashed ? `${u * 0.3} ${u * 0.25}` : undefined}
        />
      ))}
      {d.arcs.map((a, i) => (
        <path key={i} d={a} fill="none" stroke="#8A8DA0" strokeWidth={u * 0.05} strokeDasharray={`${u * 0.3} ${u * 0.25}`} />
      ))}
      {d.texts.map((t, i) => (
        <text
          key={i}
          x={t.x}
          y={t.y}
          textAnchor={t.anchor}
          dominantBaseline="middle"
          fontSize={u * SIZE[t.size]}
          fontWeight={t.size === "m" ? 700 : 400}
          fill="#14141F"
          transform={t.vertical ? `rotate(-90 ${t.x} ${t.y})` : undefined}
        >
          {t.text}
        </text>
      ))}
    </svg>
  );
}
