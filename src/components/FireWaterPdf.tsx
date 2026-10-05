import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { C, PdfFooter, PdfHeader, pageStyle } from "@/components/pdfCommon";
import {
  ASSUMPTIONS,
  BASIS_NAME,
  DISCLAIMER,
  HEAD_FLOW,
  NEXT_VERSION_NOTE,
  REMINDERS,
  fmt,
  type FireResult,
  type Step,
} from "@/lib/fireWater";

// 使用者輸入的文字（工程名稱、區域與水池名稱）一律以標準字重呈現：
// 標準字重子集含常用字，粗體子集只含固定文字（見 scripts/pdf-font.mjs）。

const s = StyleSheet.create({
  page: pageStyle,
  title: { fontSize: 16, fontWeight: 700, lineHeight: 1.3 },
  subtitle: { fontSize: 9, color: C.muted, marginTop: 3, lineHeight: 1.5 },
  meta: { flexDirection: "row", marginTop: 10, borderWidth: 1, borderColor: C.line },
  metaCell: { flex: 1, padding: 7 },
  metaLabel: { fontSize: 7.5, color: C.muted },
  metaValue: { fontSize: 10, marginTop: 2, lineHeight: 1.4 },
  sectionTitle: { fontSize: 11.5, fontWeight: 700, marginTop: 16, marginBottom: 7 },
  table: { borderWidth: 1, borderColor: C.line },
  tr: { flexDirection: "row", borderTopWidth: 1, borderTopColor: C.line },
  trHead: { flexDirection: "row", backgroundColor: C.accentSoft },
  trHit: { backgroundColor: "#F6F6FF" },
  cell: { padding: 5, fontSize: 8.5, lineHeight: 1.5 },
  head: { padding: 5, fontSize: 8, fontWeight: 700, lineHeight: 1.5 },
  bold: { fontWeight: 700 },
  num: { textAlign: "right" },
  cite: { fontSize: 7, color: C.muted, lineHeight: 1.5 },
  stepBox: { borderWidth: 1, borderColor: C.line, padding: 8, marginBottom: 6 },
  stepHead: { flexDirection: "row", justifyContent: "space-between" },
  stepTitle: { fontSize: 9.5, fontWeight: 700 },
  stepValue: { fontSize: 9.5, fontWeight: 700, color: C.accent },
  stepLine: { fontSize: 8.5, marginTop: 2, lineHeight: 1.55 },
  stepCite: { fontSize: 7.5, color: C.muted, marginTop: 4, lineHeight: 1.5 },
  verdict: { fontSize: 10, marginTop: 6, lineHeight: 1.5 },
  listItem: { flexDirection: "row", marginBottom: 3 },
  bullet: { width: 14, fontSize: 9, lineHeight: 1.55 },
  listText: { flex: 1, fontSize: 9, lineHeight: 1.55 },
  faint: { fontSize: 7.5, color: C.faint, lineHeight: 1.5, marginTop: 2 },
  disclaimer: {
    marginTop: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.line,
    fontSize: 8,
    color: C.muted,
    lineHeight: 1.5,
  },
});

function StepBlock({ step }: { step: Step }) {
  return (
    <View style={s.stepBox} wrap={false}>
      <View style={s.stepHead}>
        <Text style={s.stepTitle}>{step.title}</Text>
        <Text style={s.stepValue}>{step.value}</Text>
      </View>
      {step.lines.map((l, i) => (
        <Text key={i} style={s.stepLine}>
          {l}
        </Text>
      ))}
      <Text style={s.stepCite}>依據：{step.cite}</Text>
    </View>
  );
}

function SourceTable({ r }: { r: FireResult }) {
  const w = ["30%", "52%", "18%"];
  return (
    <View style={s.table}>
      <View style={s.trHead}>
        <Text style={[s.head, { width: w[0] }]}>容量　水源</Text>
        <Text style={[s.head, { width: w[1] }]}>算式</Text>
        <Text style={[s.head, s.num, { width: w[2] }]}>水源</Text>
      </View>
      {r.lines.map((l) => (
        <View key={l.key} style={s.tr} wrap={false}>
          <View style={[s.cell, { width: w[0] }]}>
            <Text style={{ fontSize: 8.5, lineHeight: 1.5 }}>{l.name}</Text>
            <Text style={s.cite}>{l.cite}</Text>
          </View>
          <Text style={[s.cell, { width: w[1] }]}>{l.formula}</Text>
          <Text style={[s.cell, s.num, { width: w[2] }]}>{fmt(l.m3)} m³</Text>
        </View>
      ))}
      <View style={[s.tr, s.trHit]}>
        <Text style={[s.cell, s.bold, { width: "82%" }]}>所須水源合計（消防水池應設容量）</Text>
        <Text style={[s.cell, s.bold, s.num, { width: w[2], color: C.accent }]}>{fmt(r.required)} m³</Text>
      </View>
      {r.separate !== null && (
        <View style={s.tr}>
          <Text style={[s.cell, { width: "82%" }]}>消防專用蓄水池（獨立設置，另列）</Text>
          <Text style={[s.cell, s.num, { width: w[2] }]}>{fmt(r.separate)} m³</Text>
        </View>
      )}
    </View>
  );
}

function ZoneTable({ r }: { r: FireResult }) {
  const w = ["26%", "32%", "26%", "16%"];
  return (
    <View style={[s.table, { marginTop: 8 }]} wrap={false}>
      <View style={s.trHead}>
        <Text style={[s.head, { width: w[0] }]}>撒水區域</Text>
        <Text style={[s.head, { width: w[1] }]}>撒水頭種類</Text>
        <Text style={[s.head, { width: w[2] }]}>算式（L/min × 個 × min）</Text>
        <Text style={[s.head, s.num, { width: w[3] }]}>水源</Text>
      </View>
      {r.zones.map((z, i) => (
        <View key={i} style={z.max ? [s.tr, s.trHit] : s.tr}>
          <Text style={[s.cell, { width: w[0] }]}>
            {z.max ? "▶ " : ""}
            {z.name || "—"}
          </Text>
          <Text style={[s.cell, { width: w[1] }]}>{HEAD_FLOW[z.head].name}</Text>
          <Text style={[s.cell, { width: w[2] }]}>
            {z.flow} × {z.countedHeads}
            {z.dry ? `（${z.heads} × 1.5）` : ""} × 20
          </Text>
          <Text style={[s.cell, s.num, { width: w[3] }]}>{fmt(z.m3)} m³</Text>
        </View>
      ))}
      <Text style={[s.cell, { fontSize: 7.5, color: C.muted, borderTopWidth: 1, borderTopColor: C.line }]}>
        同一撒水系統取最大值（▶）
      </Text>
    </View>
  );
}

function PoolTable({ r }: { r: FireResult }) {
  const w = ["30%", "22%", "18%", "10%", "20%"];
  return (
    <View wrap={false}>
      <View style={s.table}>
        <View style={s.trHead}>
          {["消防水池", "面積", "有效高度", "座數", "容量"].map((h, i) => (
            <Text key={h} style={[s.head, i === 4 ? s.num : {}, { width: w[i] }]}>
              {h}
            </Text>
          ))}
        </View>
        {r.pools.map((x, i) => (
          <View key={i} style={s.tr}>
            <Text style={[s.cell, { width: w[0] }]}>{x.label || "—"}</Text>
            <Text style={[s.cell, { width: w[1] }]}>{fmt(x.area, 2)} m²</Text>
            <Text style={[s.cell, { width: w[2] }]}>{fmt(x.usedDepth, 2)} m</Text>
            <Text style={[s.cell, { width: w[3] }]}>{x.count}</Text>
            <Text style={[s.cell, s.num, { width: w[4] }]}>{fmt(x.m3, 2)} m³</Text>
          </View>
        ))}
        <View style={[s.tr, s.trHit]}>
          <Text style={[s.cell, s.bold, { width: "80%" }]}>合計</Text>
          <Text style={[s.cell, s.bold, s.num, { width: w[4] }]}>{fmt(r.poolTotal, 2)} m³</Text>
        </View>
      </View>
      {r.poolOk !== null && (
        <Text style={s.verdict}>
          實設有效水量 {fmt(r.poolTotal, 2)} m³ {r.poolOk ? "≧" : "＜"} 應設容量 {fmt(r.required)} m³{"  "}
          <Text style={{ fontWeight: 700, color: r.poolOk ? C.green : C.red }}>{r.poolOk ? "OK" : "不足"}</Text>
        </Text>
      )}
      <Text style={s.cite}>
        有效高度試算 ＝ 池高 {fmt(r.input.poolSpec.height, 2)} − 底部 {fmt(r.input.poolSpec.bottom, 2)} − 1.65D（D ＝{" "}
        {fmt(r.input.poolSpec.suction)} mm）− 頂部 {fmt(r.input.poolSpec.top, 2)} ＝ {fmt(r.defaultDepth, 2)} m
      </Text>
    </View>
  );
}

function List({ title, items, numbered }: { title: string; items: string[]; numbered?: boolean }) {
  return (
    <View wrap={false}>
      <Text style={s.sectionTitle}>{title}</Text>
      {items.map((t, i) => (
        <View key={t} style={s.listItem}>
          <Text style={s.bullet}>{numbered ? `${i + 1}.` : "・"}</Text>
          <Text style={s.listText}>{t}</Text>
        </View>
      ))}
    </View>
  );
}

export default function FireWaterPdf({
  result: r,
  projectName,
  generatedOn,
  references,
}: {
  result: FireResult;
  projectName: string;
  generatedOn: string;
  references: string[];
}) {
  return (
    <Document title="消防水池容量檢討" author="汎德工程顧問股份有限公司" language="zh-TW">
      <Page size="A4" style={s.page}>
        <PdfHeader generatedOn={generatedOn} />
        <Text style={s.title}>消防水池容量檢討</Text>
        <Text style={s.subtitle}>依各類場所消防安全設備設置標準，計算各系統水源量並合計消防水池應設容量</Text>

        <View style={s.meta}>
          <View style={[s.metaCell, { flex: 2, borderRightWidth: 1, borderRightColor: C.line }]}>
            <Text style={s.metaLabel}>工程名稱</Text>
            <Text style={s.metaValue}>{projectName || "—"}</Text>
          </View>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>流量基準</Text>
            <Text style={s.metaValue}>{BASIS_NAME[r.input.basis]}</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>所須水源</Text>
        <SourceTable r={r} />
        {r.zones.length > 1 && <ZoneTable r={r} />}

        {r.reservoir && (
          <>
            <Text style={s.sectionTitle} minPresenceAhead={80}>
              消防專用蓄水池
            </Text>
            <StepBlock step={r.reservoir.step} />
          </>
        )}

        {r.pools.length > 0 && (
          <>
            <Text style={s.sectionTitle} minPresenceAhead={80}>
              實設有效水量檢核
            </Text>
            <PoolTable r={r} />
          </>
        )}

        {r.roofTank && (
          <>
            <Text style={s.sectionTitle} minPresenceAhead={60}>
              屋頂水箱
            </Text>
            <StepBlock step={r.roofTank.step} />
          </>
        )}

        <List title="設置提醒" items={REMINDERS} />
        <Text style={s.faint}>{NEXT_VERSION_NOTE}</Text>
        <List title="適用範圍與說明" items={ASSUMPTIONS} />
        <List title="引用法規" items={references} numbered />
        <Text style={s.disclaimer}>{DISCLAIMER}</Text>

        <PdfFooter />
      </Page>
    </Document>
  );
}
