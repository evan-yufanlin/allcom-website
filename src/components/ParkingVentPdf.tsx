import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { C, PdfFooter, PdfHeader, pageStyle } from "@/components/pdfCommon";
import { DEFINITIONS, DISCLAIMER, REMINDERS, SOURCES, fmt, type Louver, type VentResult } from "@/lib/parkingVent";

// 使用者輸入的文字（工程名稱、樓層名稱）以標準字重呈現：粗體子集只含固定文字（見 scripts/pdf-font.mjs）。

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
  line: { fontSize: 8.5, lineHeight: 1.6 },
  note: { fontSize: 7.5, color: C.muted, lineHeight: 1.5, marginTop: 2 },
  table: { borderWidth: 1, borderColor: C.line, marginTop: 4 },
  tr: { flexDirection: "row", borderTopWidth: 1, borderTopColor: C.line },
  trHead: { flexDirection: "row", backgroundColor: C.accentSoft },
  td: { padding: 4, fontSize: 8, lineHeight: 1.45 },
  th: { padding: 4, fontSize: 7.5, fontWeight: 700, lineHeight: 1.45 },
  listItem: { flexDirection: "row", marginBottom: 2 },
  bullet: { width: 12, fontSize: 8.5, lineHeight: 1.55 },
  listText: { flex: 1, fontSize: 8.5, lineHeight: 1.55 },
  disclaimer: { marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.line, fontSize: 8, color: C.muted, lineHeight: 1.5 },
});

function Table({ widths, heads, rows }: { widths: string[]; heads: string[]; rows: string[][] }) {
  return (
    <View style={s.table}>
      <View style={s.trHead}>
        {heads.map((h, i) => (
          <Text key={h} style={[s.th, { width: widths[i] }]}>
            {h}
          </Text>
        ))}
      </View>
      {rows.map((r, i) => (
        <View key={i} style={s.tr} wrap={false}>
          {r.map((c, j) => (
            <Text key={j} style={[s.td, { width: widths[j] }]}>
              {c}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

const louverLine = (name: string, q: number, l: Louver, ratio: number) =>
  `${name}：淨開口 ${fmt(q, 0)} ÷ 3600 ÷ ${l.velocity} ＝ ${fmt(l.freeArea)} m²；總面積 ÷ ${fmt(ratio * 100, 1)}% ＝ ${fmt(l.grossArea)} m²（表面風速 ${fmt(l.faceVelocity)} m/s）`;

export default function ParkingVentPdf({ r, projectName, generatedOn }: { r: VentResult; projectName: string; generatedOn: string }) {
  const i = r.input;
  const sim = i.simultaneous;
  const fans = r.totalFans !== null;
  const heads = ["樓層", "層數", "面積 m²", "通風量 m³/h", ...(fans ? ["每層風機"] : []), ...(sim ? ["累計風量", "管道段 m²"] : [])];
  const widths = sim ? (fans ? ["14%", "8%", "14%", "22%", "14%", "14%", "14%"] : ["16%", "10%", "16%", "26%", "16%", "16%"]) : fans ? ["18%", "10%", "18%", "30%", "24%"] : ["22%", "12%", "22%", "44%"];
  return (
    <Document title="停車場通風" author="汎德工程顧問股份有限公司" language="zh-TW">
      <Page size="A4" style={s.page}>
        <PdfHeader generatedOn={generatedOn} />
        <Text style={s.title}>停車場通風</Text>
        <Text style={s.subtitle}>依停車樓地板面積計算通風量，估算風機台數、通風管道間及進、排氣百葉面積</Text>

        <View style={s.meta}>
          <View style={[s.metaCell, { flex: 2, borderRightWidth: 1, borderRightColor: C.line }]}>
            <Text style={s.metaLabel}>工程名稱</Text>
            <Text style={s.metaValue}>{projectName || "—"}</Text>
          </View>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>運轉方式</Text>
            <Text style={s.metaValue}>{sim ? "各層同時運轉" : "共用管道間・分時運轉"}</Text>
          </View>
        </View>

        <View style={s.summary}>
          <View style={s.sumCell}>
            <Text style={s.sumLabel}>合計通風量</Text>
            <Text style={s.sumValue}>{fmt(r.totalFlow, 0)} m³/h</Text>
          </View>
          <View style={s.sumCell}>
            <Text style={s.sumLabel}>管道間（進、排氣各）</Text>
            <Text style={s.sumValue}>{fmt(r.ductArea)} m²</Text>
          </View>
          <View style={s.sumCell}>
            <Text style={s.sumLabel}>排氣百葉總面積</Text>
            <Text style={s.sumValue}>{fmt(r.exhaust.grossArea)} m²</Text>
          </View>
          <View style={s.sumCell}>
            <Text style={s.sumLabel}>進氣百葉總面積</Text>
            <Text style={s.sumValue}>{fmt(r.intake.grossArea)} m²</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>設計條件</Text>
        <Text style={s.line}>
          通風量 {i.rate} m³/h·m²（設備編第 102 條、設計施工編第 139 條）；管道風速 {i.ductVelocity} m/s；進氣百葉淨開口風速 {i.intakeVelocity} m/s；排氣百葉淨開口風速{" "}
          {i.exhaustVelocity} m/s；百葉開口率 {fmt(i.freeRatio * 100, 1)}%{fans ? `；單台風機風量 ${fmt(i.fanFlow!, 0)} m³/h` : ""}
        </Text>
        <Text style={s.note}>風速、開口率為設計假設值，非法規值。</Text>

        <Text style={s.sectionTitle}>各層通風量</Text>
        <Table
          widths={widths}
          heads={heads}
          rows={r.rows.map((x) => [
            x.label || "—",
            String(x.floors),
            fmt(x.area),
            `${fmt(x.area)} × ${i.rate} ＝ ${fmt(x.flow, 0)}`,
            ...(fans ? [`${x.fans} 台`] : []),
            ...(sim ? [fmt(x.cumulative, 0), fmt(x.ductArea)] : []),
          ])}
        />
        {fans && <Text style={s.note}>排氣風機、進氣風機各 {r.totalFans} 台（每層台數 × 層數）。</Text>}

        <View wrap={false}>
          <Text style={s.sectionTitle}>管道間與百葉</Text>
          <Text style={s.line}>
            計算風量 {fmt(r.designFlow, 0)} m³/h（{sim ? "各層合計" : "各層最大值，分時運轉不累計"}）
          </Text>
          <Text style={s.line}>
            管道間（進、排氣各一）＝ {fmt(r.designFlow, 0)} ÷ 3600 ÷ {i.ductVelocity} ＝ {fmt(r.ductArea)} m²
          </Text>
          <Text style={s.line}>{louverLine("排氣百葉", r.designFlow, r.exhaust, i.freeRatio)}</Text>
          <Text style={s.line}>{louverLine("進氣百葉", r.designFlow, r.intake, i.freeRatio)}</Text>
        </View>

        <View wrap={false}>
          <Text style={s.sectionTitle}>百葉名詞定義</Text>
          <Table widths={["28%", "50%", "22%"]} heads={["名詞", "定義", "依據"]} rows={DEFINITIONS.map((d) => [d.term, d.def, d.basis])} />
        </View>

        <View wrap={false}>
          <Text style={s.sectionTitle}>提醒</Text>
          {REMINDERS.map((t) => (
            <View key={t} style={s.listItem}>
              <Text style={s.bullet}>・</Text>
              <Text style={s.listText}>{t}</Text>
            </View>
          ))}
        </View>

        <View wrap={false}>
          <Text style={s.sectionTitle}>引用法規與資料</Text>
          <Text style={s.line}>1. {SOURCES.equipment}：第 97 條、第 102 條</Text>
          <Text style={s.line}>2. {SOURCES.design}：第 62 條、第 138 條、第 139 條、第 144 條</Text>
          <Text style={s.line}>3. {SOURCES.louver}：P.1、P.3</Text>
          <Text style={s.disclaimer}>{DISCLAIMER}</Text>
        </View>

        <PdfFooter />
      </Page>
    </Document>
  );
}
