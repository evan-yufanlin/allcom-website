import { Font, Path, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import { contactInfo } from "@/data/contact";

// 字型為子集化檔案，僅含 scripts/pdf-font.mjs 列出之來源檔用到的字；
// 修改這些檔案的文字後請執行 `npm run pdf-font:subset`（建置前會自動檢查缺字）。
export const FONT_FAMILY = "NotoSansTC";
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

export const C = {
  text: "#14141F",
  muted: "#5C5F72",
  faint: "#9A9CAB",
  accent: "#4338CA",
  accentSoft: "#EEF0FF",
  line: "#E1E2ED",
  red: "#DC2626",
  green: "#15803D",
};

// 有設 lineHeight 的樣式必須同時寫明 fontSize：字級若由上層繼承，react-pdf 會把行高倍數重複放大。
const s = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { flexDirection: "row", alignItems: "center" },
  brandName: { fontSize: 11, fontWeight: 700, marginLeft: 8 },
  brandSub: { fontSize: 7.5, color: C.muted, marginLeft: 8, letterSpacing: 1 },
  headerMeta: { fontSize: 8, color: C.muted, textAlign: "right" },
  rule: { borderBottomWidth: 1, borderBottomColor: C.line, marginTop: 12, marginBottom: 16 },
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

export const pageStyle = {
  fontFamily: FONT_FAMILY,
  fontSize: 9.5,
  color: C.text,
  paddingTop: 40,
  paddingBottom: 56,
  paddingHorizontal: 44,
};

export function Logo() {
  return (
    <Svg width={34} height={21} viewBox="0 0 96 60">
      <Path d="M 16,48 Q 26,30 36,48" fill="none" stroke={C.red} strokeWidth={7.5} strokeLinecap="round" />
      <Path d="M 28,48 Q 48,2 68,48" fill="none" stroke={C.text} strokeWidth={7.5} strokeLinecap="round" />
      <Path d="M 60,48 Q 70,30 80,48" fill="none" stroke={C.accent} strokeWidth={7.5} strokeLinecap="round" />
    </Svg>
  );
}

export function PdfHeader({ generatedOn }: { generatedOn: string }) {
  return (
    <>
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
    </>
  );
}

export function PdfFooter() {
  const phone = contactInfo.find((c) => c.label === "電話")?.value;
  const email = contactInfo.find((c) => c.label === "Email")?.value;
  return (
    <View style={s.footer} fixed>
      <Text>
        汎德工程顧問股份有限公司　電話 {phone}　{email}
      </Text>
      <Text render={({ pageNumber, totalPages }) => `第 ${pageNumber} / ${totalPages} 頁`} />
    </View>
  );
}
