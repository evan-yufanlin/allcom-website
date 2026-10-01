import { Document, Font, Page, Path, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import {
  ASSUMPTIONS,
  DISCLAIMER,
  LOCATION_NOTES,
  REFERENCES,
  type CalcStep,
  type DistributionRoomResult,
  type SpecItem,
} from "@/lib/distributionRoom";
import { contactInfo } from "@/data/contact";

// 字型為子集化檔案，僅含本檔與 src/lib/distributionRoom.ts、src/data/contact.ts 用到的字；
// 修改這些檔案的文字後請執行 `npm run pdf-font:subset`（建置前會自動檢查缺字）。
const FONT_FAMILY = "NotoSansTC";
const ch = String.fromCharCode;
// CJK 符號標點至統一漢字（U+3000–U+9FFF）與全形字元（U+FF00–U+FFEF）
const CJK = new RegExp(`[${ch(0x3000)}-${ch(0x9fff)}${ch(0xff00)}-${ch(0xffef)}]`);
const NO_LINE_START = new Set(Array.from("，。、；：）」)"));
const NO_LINE_END = new Set(Array.from("（「("));

// 中文無空白可斷詞：漢字逐字可換行、英數字保持成組，並依避頭尾規則把標點黏在相鄰字上。
// 每個單位後補空字串，避免排版引擎在斷行處插入連字號。
function breakUnits(word: string): string[] {
  if (!CJK.test(word)) return [word];
  const units: string[] = [];
  let run = "";
  for (const c of word) {
    if (CJK.test(c)) {
      if (run) units.push(run);
      run = "";
      units.push(c);
    } else {
      run += c;
    }
  }
  if (run) units.push(run);

  const merged: string[] = [];
  for (const u of units) {
    const prev = merged[merged.length - 1];
    if (prev !== undefined && (NO_LINE_START.has(u[0]) || NO_LINE_END.has(prev[prev.length - 1]))) {
      merged[merged.length - 1] = prev + u;
    } else {
      merged.push(u);
    }
  }
  return merged.flatMap((u) => [u, ""]);
}

let fontsRegistered = false;

export function registerPdfFonts(origin: string) {
  if (fontsRegistered) return;
  Font.register({
    family: FONT_FAMILY,
    fonts: [
      { src: `${origin}/fonts/NotoSansTC-Regular-pdf.ttf`, fontWeight: 400 },
      { src: `${origin}/fonts/NotoSansTC-Bold-pdf.ttf`, fontWeight: 700 },
    ],
  });
  Font.registerHyphenationCallback(breakUnits);
  fontsRegistered = true;
}

const C = {
  text: "#14141F",
  muted: "#5C5F72",
  accent: "#4338CA",
  accentSoft: "#EEF0FF",
  line: "#E1E2ED",
  red: "#DC2626",
};

// 有設 lineHeight 的樣式必須同時寫明 fontSize：字級若由上層繼承，react-pdf 會把行高倍數重複放大。
const s = StyleSheet.create({
  page: {
    fontFamily: FONT_FAMILY,
    fontSize: 9.5,
    color: C.text,
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 44,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { flexDirection: "row", alignItems: "center" },
  brandName: { fontSize: 11, fontWeight: 700, marginLeft: 8 },
  brandSub: { fontSize: 7.5, color: C.muted, marginLeft: 8, letterSpacing: 1 },
  headerMeta: { fontSize: 8, color: C.muted, textAlign: "right" },
  rule: { borderBottomWidth: 1, borderBottomColor: C.line, marginTop: 12, marginBottom: 16 },
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
  footer: {
    position: "absolute",
    bottom: 24,
    left: 44,
    right: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: C.muted,
  },
});

const fmt = (n: number) => n.toLocaleString("zh-TW", { maximumFractionDigits: 2 });

function Logo() {
  return (
    <Svg width={34} height={21} viewBox="0 0 96 60">
      <Path d="M 16,48 Q 26,30 36,48" fill="none" stroke={C.red} strokeWidth={7.5} strokeLinecap="round" />
      <Path d="M 28,48 Q 48,2 68,48" fill="none" stroke={C.text} strokeWidth={7.5} strokeLinecap="round" />
      <Path d="M 60,48 Q 70,30 80,48" fill="none" stroke={C.accent} strokeWidth={7.5} strokeLinecap="round" />
    </Svg>
  );
}

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
  const phone = contactInfo.find((c) => c.label === "電話")?.value;
  const email = contactInfo.find((c) => c.label === "Email")?.value;

  return (
    <Document title="台電配電場所面積檢討" author="汎德工程顧問股份有限公司" language="zh-TW">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={s.brand}>
            <Logo />
            <View>
              <Text style={s.brandName}>汎德工程顧問股份有限公司</Text>
              <Text style={s.brandSub}>ALLCOM　電機・空調規劃設計與監造</Text>
            </View>
          </View>
          <Text style={s.headerMeta}>產出日期：{generatedOn}</Text>
        </View>
        <View style={s.rule} />

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

        <View style={s.footer} fixed>
          <Text>
            汎德工程顧問股份有限公司　電話 {phone}　{email}
          </Text>
          <Text render={({ pageNumber, totalPages }) => `第 ${pageNumber} / ${totalPages} 頁`} />
        </View>
      </Page>
    </Document>
  );
}
