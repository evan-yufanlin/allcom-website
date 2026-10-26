import { Document, G, Line, Page, Path, Rect, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import { C, FONT_FAMILY, PdfFooter, PdfHeader, pageStyle } from "@/components/pdfCommon";
import { DISCLAIMER, NOTES, REMINDERS, SOURCE_LIST, clearLabel, doorLine, fmt, fuelLines, louverLines, type Clearances, type GenResult } from "@/lib/generator";
import { ARROW_FILL, FILL, STROKE, buildDrawing } from "@/lib/generatorDrawing";

// 使用者輸入的文字（工程名稱、自訂機組名稱）以標準字重呈現：粗體子集只含固定文字（見 scripts/pdf-font.mjs）。

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
  sumValue: { fontSize: 12, fontWeight: 700, color: C.accent, marginTop: 2, lineHeight: 1.3 },
  sectionTitle: { fontSize: 11.5, fontWeight: 700, marginTop: 14, marginBottom: 6 },
  plan: { borderWidth: 1, borderColor: C.line, padding: 6, alignItems: "center" },
  line: { fontSize: 8.5, lineHeight: 1.6 },
  note: { fontSize: 7.5, color: C.muted, lineHeight: 1.5, marginTop: 3 },
  warn: { fontSize: 8.5, lineHeight: 1.55, color: C.red },
  listItem: { flexDirection: "row", marginBottom: 2 },
  bullet: { width: 12, fontSize: 8.5, lineHeight: 1.55 },
  listText: { flex: 1, fontSize: 8.5, lineHeight: 1.55 },
  disclaimer: { marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.line, fontSize: 8, color: C.muted, lineHeight: 1.5 },
});

const SIZE = { s: 0.75, m: 0.95, l: 1.2 };

function Plan({ r }: { r: GenResult }) {
  const d = buildDrawing(r);
  const u = d.unit;
  const [, , vw, vh] = d.viewBox;
  const k = Math.min(495 / vw, 400 / vh);
  return (
    <Svg width={vw * k} height={vh * k} viewBox={d.viewBox.join(" ")}>
      {d.rects.map((x, i) => (
        <Rect
          key={i}
          x={x.x}
          y={x.y}
          width={x.w}
          height={x.h}
          fill={FILL[x.group]}
          stroke={STROKE[x.group]}
          strokeWidth={x.group === "room" ? u * 0.18 : u * 0.06}
        />
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
      {d.arrows.map((a, i) => (
        <Path key={i} d={a} fill={ARROW_FILL} />
      ))}
      {d.arcs.map((a, i) => (
        <Path key={`arc${i}`} d={a} fill="none" stroke="#8A8DA0" strokeWidth={u * 0.05} strokeDasharray={`${u * 0.3} ${u * 0.25}`} />
      ))}
      {d.texts.map((t, i) => (
        <G key={i}>
          <Text
            x={t.x}
            y={t.y + u * SIZE[t.size] * 0.35}
            textAnchor={t.anchor}
            style={{ fontFamily: FONT_FAMILY, fontSize: u * SIZE[t.size] }}
            fill={t.accent ? ARROW_FILL : "#14141F"}
            transform={t.vertical ? `rotate(-90 ${t.x} ${t.y})` : undefined}
          >
            {t.text}
          </Text>
        </G>
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

export default function GeneratorPdf({ r, projectName, generatedOn }: { r: GenResult; projectName: string; generatedOn: string }) {
  const i = r.input;
  const u = i.unit;
  return (
    <Document title="緊急發電機室" author="汎德工程顧問股份有限公司" language="zh-TW">
      <Page size="A4" style={s.page}>
        <PdfHeader generatedOn={generatedOn} />
        <Text style={s.title}>緊急發電機室</Text>
        <Text style={s.subtitle}>依機組型錄尺寸與留設距離概估機房淨尺寸，並檢討日用油箱、防液堤、儲油槽與進、排氣百葉（初步規劃）</Text>

        <View style={s.meta}>
          <View style={[s.metaCell, { flex: 1.2, borderRightWidth: 1, borderRightColor: C.line }]}>
            <Text style={s.metaLabel}>工程名稱</Text>
            <Text style={s.metaValue}>{projectName || "—"}</Text>
          </View>
          <View style={[s.metaCell, { flex: 2 }]}>
            <Text style={s.metaLabel}>機組</Text>
            <Text style={s.metaValue}>
              {u.label}｜Standby {fmt(u.standbyKw)} kW｜{u.size.join(" × ")} mm
            </Text>
          </View>
        </View>

        <View style={s.summary}>
          <View style={s.sumCell}>
            <Text style={s.sumLabel}>機房淨長</Text>
            <Text style={s.sumValue}>{fmt(r.length, 0)} mm</Text>
          </View>
          <View style={s.sumCell}>
            <Text style={s.sumLabel}>機房淨寬</Text>
            <Text style={s.sumValue}>{fmt(r.width, 0)} mm</Text>
          </View>
          <View style={s.sumCell}>
            <Text style={s.sumLabel}>淨面積</Text>
            <Text style={s.sumValue}>{fmt(r.area, 1)} m²</Text>
          </View>
          <View style={s.sumCell}>
            <Text style={s.sumLabel}>日用油箱／儲油槽</Text>
            <Text style={s.sumValue}>
              {fmt(r.tank.capacity, 0)} L／{r.storage > 0 ? `${fmt(r.storage, 0)} L` : "免設"}
            </Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>平面示意圖</Text>
        <View style={s.plan} wrap={false}>
          <Plan r={r} />
        </View>
        <Text style={s.note}>左側為散熱水箱端（排風百葉）；右側為發電機端，設雙開門供機組進出；進風百葉示意於前側牆發電機段；日用油箱與防液堤置於後側長邊、散熱水箱端（排風側）角落，發電機端靠門側留空，可配置電盤。尺寸單位 mm。</Text>

        {r.warnings.length > 0 && (
          <View wrap={false}>
            <Text style={s.sectionTitle}>提醒</Text>
            {r.warnings.map((t) => (
              <Text key={t} style={s.warn}>
                {t}
              </Text>
            ))}
          </View>
        )}

        <View wrap={false}>
          <Text style={s.sectionTitle}>機房尺寸</Text>
          <Text style={s.line}>機房淨長 ＝ {r.lengthLine}</Text>
          <Text style={s.line}>機房淨寬 ＝ {r.widthLine}</Text>
          <Text style={s.line}>
            淨面積 ＝ {fmt(r.length / 1000)} × {fmt(r.width / 1000)} ＝ {fmt(r.area, 1)} m²
          </Text>
          <Text style={s.line}>{doorLine(r)}</Text>
          <Text style={s.note}>
            留設距離：{(["radiator", "alternator", "front", "back"] as (keyof Clearances)[]).map((k) => `${clearLabel(k, i.opSide)} ${fmt(i.clear[k], 0)}`).join("；")}（mm）
          </Text>
          <Text style={s.note}>{NOTES.clearance}</Text>
          <Text style={s.note}>{NOTES.door}</Text>
          <Text style={s.note}>{NOTES.size}</Text>
        </View>

        <View wrap={false}>
          <Text style={s.sectionTitle}>油箱</Text>
          {fuelLines(r).map((t) => (
            <Text key={t} style={s.line}>
              {t}
            </Text>
          ))}
          <Text style={s.note}>{NOTES.hours}</Text>
          <Text style={s.note}>{NOTES.fuel}</Text>
          <Text style={s.note}>{NOTES.tank}</Text>
          <Text style={s.note}>{NOTES.dike}</Text>
        </View>

        {r.exhaust && r.intake && (
          <View wrap={false}>
            <Text style={s.sectionTitle}>進、排氣百葉</Text>
            {louverLines(r).map((t) => (
              <Text key={t} style={s.line}>
                {t}
              </Text>
            ))}
            <Text style={s.note}>{NOTES.louver}</Text>
          </View>
        )}

        <View wrap={false}>
          <Text style={s.sectionTitle}>規劃提醒</Text>
          <Bullets items={REMINDERS} />
        </View>

        <View wrap={false}>
          <Text style={s.sectionTitle}>引用法規與資料</Text>
          {SOURCE_LIST.map((t, k) => (
            <Text key={t} style={s.line}>
              {k + 1}. {t}
            </Text>
          ))}
          <Text style={s.disclaimer}>{DISCLAIMER}</Text>
        </View>

        <PdfFooter />
      </Page>
    </Document>
  );
}
