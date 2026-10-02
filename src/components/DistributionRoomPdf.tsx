import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { C, PdfFooter, PdfHeader, pageStyle } from "@/components/pdfCommon";
import {
  ASSUMPTIONS,
  DISCLAIMER,
  LOCATION_NOTES,
  REFERENCES,
  type CalcStep,
  type DistributionRoomResult,
  type SpecItem,
} from "@/lib/distributionRoom";

// 有設 lineHeight 的樣式必須同時寫明 fontSize：字級若由上層繼承，react-pdf 會把行高倍數重複放大。
const s = StyleSheet.create({
  page: pageStyle,
  title: { fontSize: 17, fontWeight: 700, lineHeight: 1.3 },
  subtitle: { fontSize: 9, color: C.muted, marginTop: 3, lineHeight: 1.5 },
  sectionTitle: { fontSize: 11.5, fontWeight: 700, marginTop: 18, marginBottom: 7 },
  inputRow: { flexDirection: "row", marginTop: 14, borderWidth: 1, borderColor: C.line },
  inputCell: { flex: 1, padding: 9 },
  inputLabel: { fontSize: 8, color: C.muted },
  inputValue: { fontSize: 12, fontWeight: 700, marginTop: 2 },
  resultBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: C.accentSoft,
    borderWidth: 1,
    borderColor: C.accent,
  },
  resultLabel: { fontSize: 8.5, color: C.accent, fontWeight: 700 },
  resultValue: { fontSize: 24, fontWeight: 700, color: C.accent, marginTop: 2, lineHeight: 1.2 },
  resultFormula: { fontSize: 9, color: C.muted, marginTop: 2, lineHeight: 1.5 },
  stepBox: { borderWidth: 1, borderColor: C.line, padding: 9, marginBottom: 6 },
  stepHead: { flexDirection: "row", justifyContent: "space-between" },
  stepTitle: { fontWeight: 700 },
  stepValue: { fontWeight: 700, color: C.accent },
  stepLine: { fontSize: 9.5, marginTop: 2, lineHeight: 1.55 },
  cite: { fontSize: 7.5, color: C.muted, marginTop: 4, lineHeight: 1.5 },
  table: { borderWidth: 1, borderColor: C.line },
  tr: { flexDirection: "row", borderTopWidth: 1, borderTopColor: C.line },
  trFirst: { flexDirection: "row" },
  th: { backgroundColor: C.accentSoft, fontWeight: 700, fontSize: 8.5 },
  colItem: { width: "22%", padding: 6, fontSize: 9.5, fontWeight: 700, lineHeight: 1.5 },
  colReq: { width: "43%", padding: 6, fontSize: 9.5, lineHeight: 1.5 },
  colCite: { width: "35%", padding: 6, fontSize: 7.5, color: C.muted, lineHeight: 1.5 },
  listItem: { flexDirection: "row", marginBottom: 3 },
  bullet: { width: 14, fontSize: 9.5, lineHeight: 1.55 },
  listText: { flex: 1, fontSize: 9.5, lineHeight: 1.55 },
  disclaimer: {
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.line,
    fontSize: 8,
    color: C.muted,
    lineHeight: 1.5,
  },
});

const fmt = (n: number) => n.toLocaleString("zh-TW", { maximumFractionDigits: 2 });

function StepBlock({ title, step }: { title: string; step: CalcStep }) {
  return (
    <View style={s.stepBox} wrap={false}>
      <View style={s.stepHead}>
        <Text style={s.stepTitle}>{title}</Text>
        <Text style={s.stepValue}>{step.value} m²</Text>
      </View>
      {step.lines.map((l) => (
        <Text key={l} style={s.stepLine}>
          {l}
        </Text>
      ))}
      <Text style={s.cite}>依據：{step.cite}</Text>
    </View>
  );
}

function SpecTable({ items }: { items: SpecItem[] }) {
  return (
    <View style={s.table}>
      <View style={[s.trFirst, s.th]} fixed>
        <Text style={[s.colItem, { fontSize: 8.5 }]}>項目</Text>
        <Text style={[s.colReq, { fontWeight: 700, fontSize: 8.5 }]}>需求</Text>
        <Text style={[s.colCite, { color: C.text, fontSize: 8.5 }]}>依據</Text>
      </View>
      {items.map((it) => (
        <View key={it.item} style={s.tr} wrap={false}>
          <Text style={s.colItem}>{it.item}</Text>
          <Text style={s.colReq}>{it.requirement}</Text>
          <Text style={s.colCite}>{it.cite}</Text>
        </View>
      ))}
    </View>
  );
}

export default function DistributionRoomPdf({
  floorArea,
  parkingSpaces,
  result,
  generatedOn,
}: {
  floorArea: number;
  parkingSpaces: number;
  result: DistributionRoomResult;
  generatedOn: string;
}) {
  return (
    <Document title="台電配電場所面積檢討" author="汎德工程顧問股份有限公司" language="zh-TW">
      <Page size="A4" style={s.page}>
        <PdfHeader generatedOn={generatedOn} />

        <Text style={s.title}>台電配電場所面積檢討</Text>
        <Text style={s.subtitle}>低壓新設｜依台電營業規章及相關規範檢討配電場所面積、算式與規格需求</Text>

        <View style={s.inputRow}>
          <View style={[s.inputCell, { borderRightWidth: 1, borderRightColor: C.line }]}>
            <Text style={s.inputLabel}>總樓地板面積</Text>
            <Text style={s.inputValue}>{fmt(floorArea)} m²</Text>
          </View>
          <View style={s.inputCell}>
            <Text style={s.inputLabel}>汽車停車位數量</Text>
            <Text style={s.inputValue}>{parkingSpaces} 格</Text>
          </View>
        </View>

        <View style={s.resultBox}>
          <Text style={s.resultLabel}>檢討結果：台電配電場所應設面積</Text>
          <Text style={s.resultValue}>{result.total} m²</Text>
          <Text style={s.resultFormula}>
            = 基本面積 {result.base.value} m² ＋ 停車位擴增 {result.parking.value} m²
          </Text>
        </View>

        <Text style={s.sectionTitle}>計算式</Text>
        <StepBlock title="① 基本面積" step={result.base} />
        <StepBlock title="② 停車位擴增面積" step={result.parking} />
        <View style={s.stepBox} wrap={false}>
          <View style={s.stepHead}>
            <Text style={s.stepTitle}>③ 合計</Text>
            <Text style={s.stepValue}>{result.total} m²</Text>
          </View>
          <Text style={s.stepLine}>
            {result.base.value} + {result.parking.value} = {result.total} m²
          </Text>
        </View>

        <Text style={s.sectionTitle} break>
          配電場所規格需求
        </Text>
        <SpecTable items={result.specs} />

        <Text style={s.sectionTitle} minPresenceAhead={80}>
          設置位置注意事項
        </Text>
        <SpecTable items={LOCATION_NOTES} />

        <View wrap={false}>
          <Text style={s.sectionTitle}>適用範圍與說明</Text>
          {ASSUMPTIONS.map((a) => (
            <View key={a} style={s.listItem}>
              <Text style={s.bullet}>・</Text>
              <Text style={s.listText}>{a}</Text>
            </View>
          ))}
        </View>

        <View wrap={false}>
          <Text style={s.sectionTitle}>引用法規</Text>
          {REFERENCES.map((r, i) => (
            <View key={r} style={s.listItem}>
              <Text style={s.bullet}>{i + 1}.</Text>
              <Text style={s.listText}>{r}</Text>
            </View>
          ))}
          <Text style={s.disclaimer}>{DISCLAIMER}</Text>
        </View>

        <PdfFooter />
      </Page>
    </Document>
  );
}
