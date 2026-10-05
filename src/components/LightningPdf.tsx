import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { C, PdfFooter, PdfHeader, pageStyle } from "@/components/pdfCommon";
import {
  ASSUMPTIONS,
  CHECKLIST,
  DISCLAIMER,
  SOURCE,
  TERMINAL_NAME,
  TERMINAL_NOTE,
  fmt,
  type LightningResult,
  type Step,
} from "@/lib/lightning";

// 使用者輸入的文字（工程名稱）以標準字重呈現：粗體子集只含固定文字（見 scripts/pdf-font.mjs）。

const s = StyleSheet.create({
  page: pageStyle,
  title: { fontSize: 16, fontWeight: 700, lineHeight: 1.3 },
  subtitle: { fontSize: 9, color: C.muted, marginTop: 3, lineHeight: 1.5 },
  meta: { flexDirection: "row", marginTop: 10, borderWidth: 1, borderColor: C.line },
  metaCell: { flex: 1, padding: 7 },
  metaLabel: { fontSize: 7.5, color: C.muted },
  metaValue: { fontSize: 10, marginTop: 2, lineHeight: 1.4 },
  summary: { flexDirection: "row", marginTop: 12, borderWidth: 1, borderColor: C.accent, backgroundColor: C.accentSoft },
  sumCell: { flex: 1, padding: 8 },
  sumLabel: { fontSize: 7.5, color: C.muted },
  sumValue: { fontSize: 13, fontWeight: 700, color: C.accent, marginTop: 2, lineHeight: 1.3 },
  sectionTitle: { fontSize: 11.5, fontWeight: 700, marginTop: 16, marginBottom: 7 },
  stepBox: { borderWidth: 1, borderColor: C.line, padding: 8, marginBottom: 6 },
  stepHead: { flexDirection: "row", justifyContent: "space-between" },
  stepTitle: { fontSize: 9.5, fontWeight: 700 },
  stepValue: { fontSize: 9.5, fontWeight: 700, color: C.accent },
  stepLine: { fontSize: 8.5, marginTop: 2, lineHeight: 1.55 },
  cite: { fontSize: 7.5, color: C.muted, marginTop: 4, lineHeight: 1.5 },
  note: { fontSize: 8.5, lineHeight: 1.55, marginTop: 4, paddingLeft: 6, borderLeftWidth: 2, borderLeftColor: C.accent },
  group: { borderWidth: 1, borderColor: C.line, padding: 8, marginBottom: 6 },
  groupHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  listItem: { flexDirection: "row", marginTop: 2 },
  bullet: { width: 12, fontSize: 8.5, lineHeight: 1.55 },
  listText: { flex: 1, fontSize: 8.5, lineHeight: 1.55 },
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

function StepBlock({ step, verdict }: { step: Step; verdict?: { ok: boolean } }) {
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
      {verdict && (
        <Text style={[s.stepLine, { fontWeight: 700, color: verdict.ok ? C.green : C.red }]}>
          保護半徑 {verdict.ok ? "≧" : "＜"} 最遠受保護點距離：{verdict.ok ? "OK" : "不足"}
        </Text>
      )}
      <Text style={s.cite}>依據：{step.cite}</Text>
    </View>
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

export default function LightningPdf({
  result: r,
  projectName,
  generatedOn,
}: {
  result: LightningResult;
  projectName: string;
  generatedOn: string;
}) {
  const pr = r.protection;
  const t = r.input.terminal;
  return (
    <Document title="避雷設備檢討" author="汎德工程顧問股份有限公司" language="zh-TW">
      <Page size="A4" style={s.page}>
        <PdfHeader generatedOn={generatedOn} />
        <Text style={s.title}>避雷設備檢討</Text>
        <Text style={s.subtitle}>依{SOURCE}檢討應設與否、避雷導線斷面、引下導線條數及保護角</Text>

        <View style={s.meta}>
          <View style={[s.metaCell, { flex: 2, borderRightWidth: 1, borderRightColor: C.line }]}>
            <Text style={s.metaLabel}>工程名稱</Text>
            <Text style={s.metaValue}>{projectName || "—"}</Text>
          </View>
          <View style={[s.metaCell, { borderRightWidth: 1, borderRightColor: C.line }]}>
            <Text style={s.metaLabel}>建築物高度（不含屋突）</Text>
            <Text style={s.metaValue}>
              {fmt(r.input.height)} m{r.input.hazmat ? "（危險物品倉庫）" : ""}
            </Text>
          </View>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>受雷部型式</Text>
            <Text style={s.metaValue}>{TERMINAL_NAME[t]}</Text>
          </View>
        </View>

        <View style={s.summary}>
          <View style={s.sumCell}>
            <Text style={s.sumLabel}>避雷設備</Text>
            <Text style={[s.sumValue, r.required ? {} : { color: C.muted }]}>{r.required ? "應設" : "非強制"}</Text>
          </View>
          <View style={s.sumCell}>
            <Text style={s.sumLabel}>避雷導線（銅）</Text>
            <Text style={s.sumValue}>{r.conductor} mm² 以上</Text>
          </View>
          <View style={s.sumCell}>
            <Text style={s.sumLabel}>引下導線</Text>
            <Text style={s.sumValue}>{r.downs} 條以上</Text>
          </View>
          {pr && (
            <View style={s.sumCell}>
              <Text style={s.sumLabel}>保護半徑（{pr.angle}°）</Text>
              <Text style={s.sumValue}>{fmt(pr.radius)} m</Text>
            </View>
          )}
        </View>

        <Text style={s.sectionTitle}>計算式</Text>
        {r.steps.map((st) => (
          <StepBlock key={st.title} step={st} />
        ))}
        {pr && <StepBlock step={pr.step} verdict={pr.ok === null ? undefined : { ok: pr.ok }} />}
        {t !== "franklin" && t !== "unset" && (
          <Text style={s.note}>
            {TERMINAL_NOTE}
          </Text>
        )}

        <Text style={s.sectionTitle} minPresenceAhead={80}>
          設置檢核清單
        </Text>
        {CHECKLIST.map((g) => (
          <View key={g.title} style={s.group} wrap={false}>
            <View style={s.groupHead}>
              <Text style={s.stepTitle}>{g.title}</Text>
              <Text style={{ fontSize: 7.5, color: C.muted }}>{g.cite}</Text>
            </View>
            <Bullets items={g.items} />
          </View>
        ))}

        <View wrap={false}>
          <Text style={s.sectionTitle}>適用範圍與說明</Text>
          <Bullets items={ASSUMPTIONS} />
        </View>
        <Text style={s.sectionTitle}>引用法規</Text>
        <Text style={{ fontSize: 9, lineHeight: 1.55 }}>1. {SOURCE}：第19～25條</Text>
        <Text style={s.disclaimer}>{DISCLAIMER}</Text>

        <PdfFooter />
      </Page>
    </Document>
  );
}
