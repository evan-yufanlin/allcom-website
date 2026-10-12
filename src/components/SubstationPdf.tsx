import { Document, G, Line, Page, Path, Rect, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import { C, FONT_FAMILY, PdfFooter, PdfHeader, pageStyle } from "@/components/pdfCommon";
import {
  CLEARANCE_LABEL,
  DISCLAIMER,
  NOTES,
  REMINDERS,
  SOURCE,
  summarize,
  type Clearances,
  type SubstationResult,
} from "@/lib/substation";
import { FILL, STROKE, buildDrawing } from "@/lib/substationDrawing";

// 使用者輸入的文字（工程名稱、自訂設備名稱）以標準字重呈現：粗體子集只含固定文字（見 scripts/pdf-font.mjs）。

const s = StyleSheet.create({
  page: pageStyle,
  title: { fontSize: 16, fontWeight: 700, lineHeight: 1.3 },
  subtitle: { fontSize: 9, color: C.muted, marginTop: 3, lineHeight: 1.5 },
  meta: { flexDirection: "row", marginTop: 10, borderWidth: 1, borderColor: C.line },
  metaCell: { flex: 1, padding: 7 },
  metaLabel: { fontSize: 7.5, color: C.muted },
  metaValue: { fontSize: 10, marginTop: 2, lineHeight: 1.4 },
  summary: { flexDirection: "row", marginTop: 10, borderWidth: 1, borderColor: C.accent, backgroundColor: C.accentSoft },
  sumCell: { flex: 1, padding: 8 },
  sumLabel: { fontSize: 7.5, color: C.muted },
  sumValue: { fontSize: 13, fontWeight: 700, color: C.accent, marginTop: 2, lineHeight: 1.3 },
  sectionTitle: { fontSize: 11.5, fontWeight: 700, marginTop: 14, marginBottom: 6 },
  plan: { borderWidth: 1, borderColor: C.line, padding: 6, alignItems: "center" },
  line: { fontSize: 8.5, lineHeight: 1.6 },
  note: { fontSize: 7.5, color: C.muted, lineHeight: 1.5, marginTop: 3 },
  warn: { fontSize: 8.5, lineHeight: 1.55, color: C.red },
  tr: { flexDirection: "row", borderTopWidth: 1, borderTopColor: C.line },
  trHead: { flexDirection: "row", backgroundColor: C.accentSoft },
  td: { padding: 4, fontSize: 8, lineHeight: 1.45 },
  th: { padding: 4, fontSize: 7.5, fontWeight: 700, lineHeight: 1.45 },
  listItem: { flexDirection: "row", marginBottom: 2 },
  bullet: { width: 12, fontSize: 8.5, lineHeight: 1.55 },
  listText: { flex: 1, fontSize: 8.5, lineHeight: 1.55 },
  disclaimer: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.line,
    fontSize: 8,
    color: C.muted,
    lineHeight: 1.5,
  },
});

const n = (v: number) => v.toLocaleString("zh-TW", { maximumFractionDigits: 1 });
/** mm → m，保留至小數 2 位 */
const m = (v: number) => (v / 1000).toLocaleString("zh-TW", { maximumFractionDigits: 2 });
const SIZE = { s: 0.75, m: 0.95, l: 1.2 };

function Plan({ r }: { r: SubstationResult }) {
  const d = buildDrawing(r);
  const u = d.unit;
  const [, , vw, vh] = d.viewBox;
  const maxW = 495;
  const maxH = 380;
  const k = Math.min(maxW / vw, maxH / vh);
  return (
    <Svg width={vw * k} height={vh * k} viewBox={d.viewBox.join(" ")}>
      {d.rects.map((x, i) => (
        <G key={i}>
          <Rect
            x={x.x}
            y={x.y}
            width={x.w}
            height={x.h}
            fill={FILL[x.group]}
            stroke={STROKE[x.group]}
            strokeWidth={x.group === "room" ? u * 0.18 : u * 0.06}
          />
          {x.name && (
            <>
              <Text x={x.x + x.w / 2} y={x.y + x.h / 2} textAnchor="middle" style={{ fontFamily: FONT_FAMILY, fontSize: u * 0.85 }} fill="#14141F">
                {x.name}
              </Text>
              <Text x={x.x + x.w / 2} y={x.y + x.h / 2 + u * 1.05} textAnchor="middle" style={{ fontFamily: FONT_FAMILY, fontSize: u * 0.6 }} fill="#5C5F72">
                {x.sub}
              </Text>
            </>
          )}
        </G>
      ))}
      {d.lines.map((l, i) => (
        <Line
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
        <Path key={i} d={a} fill="none" stroke="#8A8DA0" strokeWidth={u * 0.05} strokeDasharray={`${u * 0.3} ${u * 0.25}`} />
      ))}
      {d.texts.map((t, i) => (
        <Text
          key={i}
          x={t.x}
          y={t.y + u * SIZE[t.size] * 0.35}
          textAnchor={t.anchor}
          style={{ fontFamily: FONT_FAMILY, fontSize: u * SIZE[t.size] }}
          fill="#14141F"
          transform={t.vertical ? `rotate(-90 ${t.x} ${t.y})` : undefined}
        >
          {t.text}
        </Text>
      ))}
    </Svg>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <>
      {items.map((t) => (
        <View key={t} style={s.listItem}>
          <Text style={s.bullet}>・</Text>
          <Text style={s.listText}>{t}</Text>
        </View>
      ))}
    </>
  );
}

export default function SubstationPdf({
  result: r,
  projectName,
  generatedOn,
}: {
  result: SubstationResult;
  projectName: string;
  generatedOn: string;
}) {
  const w = ["12%", "10%", "54%", "12%", "12%"];
  return (
    <Document title="自設變電站空間檢討" author="汎德工程顧問股份有限公司" language="zh-TW">
      <Page size="A4" style={s.page}>
        <PdfHeader generatedOn={generatedOn} />
        <Text style={s.title}>自設變電站空間檢討</Text>
        <Text style={s.subtitle}>依設備排列與通道條件概估室內淨尺寸與面積（初步規劃）</Text>

        <View style={s.meta}>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>工程名稱</Text>
            <Text style={s.metaValue}>{projectName || "—"}</Text>
          </View>
        </View>

        <View style={s.summary}>
          <View style={s.sumCell}>
            <Text style={s.sumLabel}>室內淨長</Text>
            <Text style={s.sumValue}>{n(r.length)} mm</Text>
          </View>
          <View style={s.sumCell}>
            <Text style={s.sumLabel}>室內淨深</Text>
            <Text style={s.sumValue}>{n(r.depth)} mm</Text>
          </View>
          <View style={s.sumCell}>
            <Text style={s.sumLabel}>淨面積</Text>
            <Text style={s.sumValue}>{r.area.toFixed(1)} m²</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>平面示意圖</Text>
        <View style={s.plan} wrap={false}>
          <Plan r={r} />
        </View>
        <Text style={s.note}>虛線為門扇開啟範圍。{NOTES.door}</Text>

        {r.warnings.length > 0 && (
          <View wrap={false}>
            <Text style={s.sectionTitle}>門扇干涉提醒</Text>
            {r.warnings.map((t) => (
              <Text key={t} style={s.warn}>
                {t}
              </Text>
            ))}
          </View>
        )}

        <View wrap={false}>
          <Text style={s.sectionTitle}>計算式</Text>
          <Text style={s.line}>室內淨長 ＝ {r.lengthLine}</Text>
          <Text style={s.line}>室內淨深 ＝ {r.depthLine}</Text>
          <Text style={s.line}>
            淨面積 ＝ {m(r.length)} × {m(r.depth)} ＝ {r.area.toFixed(1)} m²
          </Text>
        </View>

        <View wrap={false} style={{ marginTop: 8, borderWidth: 1, borderColor: C.line }}>
          <View style={s.trHead}>
            {["列", "前側", "設備（由左而右）", "列長", "列深"].map((h, i) => (
              <Text key={h} style={[s.th, { width: w[i] }]}>
                {h}
              </Text>
            ))}
          </View>
          {r.rows.map((row) => (
            <View key={row.index} style={s.tr}>
              <Text style={[s.td, { width: w[0] }]}>第{row.index}列</Text>
              <Text style={[s.td, { width: w[1] }]}>{row.facing === "down" ? "朝下" : "朝上"}</Text>
              <Text style={[s.td, { width: w[2] }]}>{summarize(row.items.map((e) => e.name))}</Text>
              <Text style={[s.td, { width: w[3] }]}>{n(row.length)}</Text>
              <Text style={[s.td, { width: w[4] }]}>{n(row.depth)}</Text>
            </View>
          ))}
        </View>

        <View wrap={false}>
          <Text style={s.sectionTitle}>通道條件（汎德建議值）</Text>
          <Text style={s.line}>
            {(Object.keys(CLEARANCE_LABEL) as (keyof Clearances)[]).map((k) => `${CLEARANCE_LABEL[k]} ${n(r.clearances[k])}`).join("；")}（mm）
          </Text>
          <Text style={s.note}>{NOTES.backToBack}</Text>
          <Text style={s.note}>設備尺寸依據：{SOURCE}。{NOTES.cast}</Text>
        </View>

        <View wrap={false}>
          <Text style={s.sectionTitle}>提醒與未計入項目</Text>
          <Bullets items={[NOTES.clearance, ...REMINDERS]} />
          <Text style={s.disclaimer}>{DISCLAIMER}</Text>
        </View>

        <PdfFooter />
      </Page>
    </Document>
  );
}
