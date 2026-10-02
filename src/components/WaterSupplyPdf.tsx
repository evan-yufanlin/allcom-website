import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { C, PdfFooter, PdfHeader, pageStyle } from "@/components/pdfCommon";
import {
  ASSUMPTIONS,
  DISCLAIMER,
  NEXT_VERSION_NOTE,
  REMINDERS,
  fmt,
  type Check,
  type Step,
  type SystemResult,
  type WaterSupplyResult,
} from "@/lib/waterSupply";
import { JURISDICTION_NAME, PER_CAPITA, SAFETY_BANDS, TP_K_BANDS, TW_DI_COEF } from "@/lib/waterSupplyData";

// 使用者輸入的文字（工程名稱、系統與水池名稱等）一律以標準字重呈現：
// 標準字重子集含常用字，粗體子集只含固定文字（見 scripts/pdf-font.mjs）。

const s = StyleSheet.create({
  page: pageStyle,
  title: { fontSize: 16, fontWeight: 700, lineHeight: 1.3 },
  subtitle: { fontSize: 9, color: C.muted, marginTop: 3, lineHeight: 1.5 },
  meta: { flexDirection: "row", marginTop: 10, borderWidth: 1, borderColor: C.line },
  metaCell: { flex: 1, padding: 7 },
  metaLabel: { fontSize: 7.5, color: C.muted },
  metaValue: { fontSize: 10, marginTop: 2, lineHeight: 1.4 },
  formTitle: {
    fontSize: 11,
    fontWeight: 700,
    textAlign: "center",
    marginTop: 14,
    paddingVertical: 5,
    backgroundColor: C.accentSoft,
    borderWidth: 1,
    borderColor: C.line,
  },
  form: { borderWidth: 1, borderTopWidth: 0, borderColor: C.line, paddingHorizontal: 10, paddingVertical: 8 },
  h1: { fontSize: 9.5, fontWeight: 700, marginTop: 6 },
  h2: { fontSize: 9.5, fontWeight: 700, marginTop: 4, marginLeft: 8 },
  line: { fontSize: 9, lineHeight: 1.6, marginLeft: 18 },
  note: { fontSize: 7.5, color: C.muted, lineHeight: 1.5, marginLeft: 18 },
  faint: { fontSize: 7.5, color: C.faint, lineHeight: 1.5, marginLeft: 18 },
  val: { fontWeight: 700, color: C.accent },
  table: { marginLeft: 18, marginTop: 3, marginBottom: 3, borderWidth: 1, borderColor: C.line },
  tr: { flexDirection: "row", borderTopWidth: 1, borderTopColor: C.line },
  trHead: { flexDirection: "row", backgroundColor: C.accentSoft },
  trHit: { backgroundColor: "#F6F6FF" },
  td: { flex: 1, padding: 3, fontSize: 8, lineHeight: 1.4 },
  tdWide: { flex: 1.6, padding: 3, fontSize: 8, lineHeight: 1.4 },
  th: { flex: 1, padding: 3, fontSize: 7.5, fontWeight: 700, lineHeight: 1.4 },
  thWide: { flex: 1.6, padding: 3, fontSize: 7.5, fontWeight: 700, lineHeight: 1.4 },
  sectionTitle: { fontSize: 11.5, fontWeight: 700, marginTop: 16, marginBottom: 7 },
  stepBox: { borderWidth: 1, borderColor: C.line, padding: 8, marginBottom: 6 },
  stepHead: { flexDirection: "row", justifyContent: "space-between" },
  stepTitle: { fontSize: 9.5, fontWeight: 700 },
  stepValue: { fontSize: 9.5, fontWeight: 700, color: C.accent },
  stepLine: { fontSize: 8.5, marginTop: 2, lineHeight: 1.55 },
  cite: { fontSize: 7.5, color: C.muted, marginTop: 4, lineHeight: 1.5 },
  ckRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: C.line },
  ckItem: { width: "20%", padding: 5, fontSize: 8.5, fontWeight: 700, lineHeight: 1.5 },
  ckReq: { width: "50%", padding: 5, fontSize: 8.5, lineHeight: 1.5 },
  ckAct: { width: "18%", padding: 5, fontSize: 8.5, lineHeight: 1.5 },
  ckRes: { width: "12%", padding: 5, fontSize: 8.5, fontWeight: 700, textAlign: "right", lineHeight: 1.5 },
  listItem: { flexDirection: "row", marginBottom: 3 },
  bullet: { width: 14, fontSize: 9, lineHeight: 1.55 },
  listText: { flex: 1, fontSize: 9, lineHeight: 1.55 },
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

const V = ({ children }: { children: string }) => <Text style={s.val}>{children}</Text>;

function Form({ r, sys, includeMeter }: { r: WaterSupplyResult; sys: SystemResult; includeMeter: boolean }) {
  const j = r.input.jurisdiction;
  const tw = j === "taiwan";
  const input = r.input.systems.find((x) => x.name === sys.name) ?? r.input.systems[0];
  const units = [
    { per: input.perSuite, n: input.suites },
    { per: input.perHouse, n: input.houses },
    ...(tw ? [] : [{ per: input.perTownhouse, n: input.townhouses }]),
  ].filter((u, i) => u.n > 0 || i === 1);
  const areaRows = input.rows.filter((x) => x.kind === "area");
  const fixtureRows = input.rows.filter((x) => x.kind === "fixture");
  const peopleRows = input.rows.filter((x) => x.kind === "people");
  const meter = r.meter;
  const bands = SAFETY_BANDS[j];
  const n = (k: number) => ["一", "二", "三", "四"][k];
  let sec = 0;

  return (
    <View>
      <Text style={s.h1}>{n(sec++)}、間接給水總表口徑：</Text>
      <Text style={s.h2}>（一）一日用水量（V）</Text>
      <Text style={s.line}>1. 由用水人口數推算（供住宅使用部分）</Text>
      <Text style={s.line}>
        V1 ＝ ({units.map((u) => `${u.per} 人/戶 × ${u.n} 戶`).join(" ＋ ")}) cap. × {PER_CAPITA[j]} L/cap. ÷ 1000 L/m³ ＝ (
        <V>{fmt(sys.v1)}</V>) m³
      </Text>
      <Text style={s.note}>
        {tw ? "【套房每戶以 2 人、住宅每戶以 3 人計算】" : "【套房每戶以 2 人、住宅每戶 3 人、透天厝、透天別墅以每戶 6 人計算】"}
      </Text>

      <Text style={s.line}>2. 間接給水（大樓、公寓等）樓地板面積推算法{fixtureRows.length ? "、衛生器具推算法" : ""}</Text>
      {areaRows.length > 0 && (
        <View style={s.table}>
          <View style={s.trHead}>
            <Text style={s.thWide}>建築物種類</Text>
            <Text style={s.th}>樓地板面積（m²）</Text>
            <Text style={s.th}>有效面積比</Text>
            <Text style={s.th}>人員（人/m²）</Text>
            <Text style={s.th}>使用水量（L/人）</Text>
            <Text style={s.th}>V2′（m³）</Text>
          </View>
          {areaRows.map((x, i) => (
            <View key={i} style={s.tr}>
              <Text style={s.tdWide}>{x.label}</Text>
              <Text style={s.td}>{fmt(x.area)}</Text>
              <Text style={s.td}>× {x.ratio}</Text>
              <Text style={s.td}>× {x.density}</Text>
              <Text style={s.td}>× {x.litres} ÷ 1000</Text>
              <Text style={s.td}>{fmt((x.area * x.ratio * x.density * x.litres) / 1000)}</Text>
            </View>
          ))}
        </View>
      )}
      {(fixtureRows.length > 0 || peopleRows.length > 0) && (
        <View style={s.table}>
          <View style={s.trHead}>
            <Text style={s.thWide}>{fixtureRows.length ? "衛生器具／人員" : "人員"}</Text>
            <Text style={s.th}>數量</Text>
            <Text style={s.th}>平均用水量（L/日）</Text>
            <Text style={s.th}>V2′（m³）</Text>
          </View>
          {fixtureRows.map((x, i) => (
            <View key={`f${i}`} style={s.tr}>
              <Text style={s.tdWide}>{x.label}</Text>
              <Text style={s.td}>{x.count}</Text>
              <Text style={s.td}>× {fmt(x.litres)} ÷ 1000</Text>
              <Text style={s.td}>{fmt((x.count * x.litres) / 1000)}</Text>
            </View>
          ))}
          {peopleRows.map((x, i) => (
            <View key={`p${i}`} style={s.tr}>
              <Text style={s.tdWide}>{x.label}</Text>
              <Text style={s.td}>{fmt(x.people)} 人</Text>
              <Text style={s.td}>× {fmt(x.litres)} ÷ 1000</Text>
              <Text style={s.td}>{fmt((x.people * x.litres) / 1000)}</Text>
            </View>
          ))}
        </View>
      )}
      <Text style={s.line}>
        V2 ＝ V2′ × ({input.v2Factor}) ＝ (<V>{fmt(sys.v2)}</V>) m³
      </Text>
      <Text style={s.note}>（註：考慮使用水量變化，V2 可取 ±10%）</Text>
      {input.others.map((o, i) => (
        <Text key={i} style={s.line}>
          其他用水：{o.label}{" "}
          {o.kind === "fixed" ? `${fmt(o.m3)} m³` : `${o.indoor ? "室內" : "室外"}循環式 ${o.indoor ? 0.2 : 0.24} × ${fmt(o.volume)} m³ ＝ ${fmt(o.volume * (o.indoor ? 0.2 : 0.24))} m³`}
        </Text>
      ))}
      <Text style={s.line}>
        V ＝ V1 ＋ V2{input.others.length ? " ＋ 其他" : ""} ＝ (<V>{fmt(sys.v)}</V>) m³
      </Text>

      <Text style={s.h2}>（二）進水管口徑（Di）、一日設計用水量（Vd）</Text>
      <View style={s.table}>
        <View style={s.trHead}>
          <Text style={s.th}>V 值範圍（m³）</Text>
          <Text style={s.th}>安全係數</Text>
          <Text style={s.thWide}>總表口徑（mm）</Text>
        </View>
        {bands.map((b) => (
          <View key={b.label} style={b === sys.band ? [s.tr, s.trHit] : s.tr}>
            <Text style={s.td}>
              {b === sys.band ? "▶ " : ""}
              {b.label}
            </Text>
            <Text style={s.td}>{b.factor}</Text>
            <Text style={s.tdWide}>
              {b.meter ?? (tw ? `Di ＝ ${TW_DI_COEF} √Vd` : "依第三項（俟審查時配合水壓狀況才能定案）")}
            </Text>
          </View>
        ))}
      </View>
      <Text style={s.line}>
        一日設計用水量（Vd）＝ V × 安全係數 ＝ ({fmt(sys.v)}) m³ × ({sys.band.factor}) ＝ (<V>{fmt(sys.vd)}</V>) m³
      </Text>
      {includeMeter && (
        <Text style={s.line}>
          總表口徑：{meter.di !== null && tw ? `Di ＝ ${TW_DI_COEF} × √${fmt(meter.vd)} ＝ ${fmt(meter.di)} mm，` : ""}建議（
          <V>{meter.size ? String(meter.size) : "—"}</V>）mm
          {meter.household ? `（一般住宅 ${meter.household.households} 戶，依戶數）` : ""}
        </Text>
      )}

      <Text style={s.h1}>{n(sec++)}、蓄水池（VG）及水塔（VT）容量：</Text>
      {sys.hasTanks ? (
        <>
          <Text style={s.line}>
            （一）蓄水池（VG）採用 (<V>{fmt(sys.vg)}</V>) m³ ≧ 一日設計用水量（Vd）× 20% ＝ ({fmt(0.2 * sys.vd)}) m³
          </Text>
          <Text style={s.line}>
            （二）水塔（VT）採用 (<V>{fmt(sys.vt)}</V>) m³{tw ? "" : ` ≧ Vd × 10% ＝ (${fmt(0.1 * sys.vd)}) m³`}
          </Text>
          <Text style={s.line}>
            （三）VG ＋ VT 容量合計 (<V>{fmt(sys.vg + sys.vt)}</V>) m³，應大於
            {tw || r.input.legacyUrbanRenewal ? `一日設計用水量 Vd 的 40% ＝ (${fmt(0.4 * sys.vd)})` : `一日設計用水量 Vd ＝ (${fmt(sys.vd)})`} m³
          </Text>
          <Text style={s.line}>　　且為考慮用水安全，以不超過二日設計用水量 ＝ Vd × 2 ＝ ({fmt(2 * sys.vd)}) m³ 為原則</Text>
          {tw && r.input.baselineDays !== null && (
            <Text style={s.line}>
              　　住宅類並需符合本公司公告之基準值 ({r.input.baselineDays}) 日設計用水量 ＝ ({fmt(r.input.baselineDays * sys.vd)}) m³
            </Text>
          )}
        </>
      ) : (
        <Text style={s.note}>未輸入蓄水池、水塔尺寸。最小需求：VG ≧ {fmt(0.2 * sys.vd)} m³；VG ＋ VT ≧ {fmt((tw ? 0.4 : 1) * sys.vd)} m³。</Text>
      )}

      {includeMeter && !tw && meter.k !== null && (
        <>
          <Text style={s.h1}>{n(sec++)}、當 V＞82.1 m³ 時，計算 K ＝ (VG ＋ VT) ／ Vd ＝ ({fmt(meter.k)})</Text>
          {TP_K_BANDS.map((b) => (
            <Text key={b.label} style={s.line}>
              {meter.coef === b.coef ? "▶ " : "　 "}當 {b.label} 時 Di ＝ {b.coef} √Vd
              {meter.coef === b.coef ? ` ＝ (${fmt(meter.di!)}) mm，建議 (${meter.size ?? "—"}) mm` : ""}
            </Text>
          ))}
        </>
      )}

      <Text style={s.h1}>{n(sec++)}、揚水管口徑（Dp）：</Text>
      <Text style={s.line}>以 t ＝ 30 分鐘泵送 0.1 Vd 之管徑為最少要求，流速 Vp 以 1.6 m/sec 計算</Text>
      <Text style={s.line}>0.1 Vd ／ t ＝ π／4 × Dp² × Vp</Text>
      <Text style={s.line}>
        Dp ＝ 6.65 √Vd ＝ (<V>{fmt(sys.dp)}</V>) mm，建議（<V>{sys.dpSize ? String(sys.dpSize) : "—"}</V>）mm 揚水管
      </Text>
      <Text style={s.faint}>{NEXT_VERSION_NOTE}</Text>
    </View>
  );
}

function MeterSummary({ r }: { r: WaterSupplyResult }) {
  return (
    <View>
      {r.meter.step.lines.map((l, i) => (
        <Text key={i} style={s.line}>
          {l}
        </Text>
      ))}
    </View>
  );
}

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
      <Text style={s.cite}>依據：{step.cite}</Text>
    </View>
  );
}

function Checks({ checks }: { checks: Check[] }) {
  return (
    <View style={{ borderWidth: 1, borderColor: C.line, marginBottom: 6 }}>
      <View style={[s.ckRow, { borderTopWidth: 0, backgroundColor: C.accentSoft }]}>
        <Text style={s.ckItem}>項目</Text>
        <Text style={[s.ckReq, { fontWeight: 700 }]}>需求</Text>
        <Text style={[s.ckAct, { fontWeight: 700 }]}>設計值</Text>
        <Text style={s.ckRes}>判定</Text>
      </View>
      {checks.map((c) => (
        <View key={c.item} style={s.ckRow} wrap={false}>
          <Text style={s.ckItem}>{c.item}</Text>
          <View style={s.ckReq}>
            <Text style={{ fontSize: 8.5, lineHeight: 1.5 }}>{c.requirement}</Text>
            {c.note && <Text style={{ fontSize: 7.5, color: C.muted, lineHeight: 1.5 }}>{c.note}</Text>}
            <Text style={{ fontSize: 7, color: C.muted, lineHeight: 1.5 }}>依據：{c.cite}</Text>
          </View>
          <Text style={s.ckAct}>{c.actual}</Text>
          <Text style={[s.ckRes, { color: c.ok === null ? C.muted : c.ok ? C.green : C.red }]}>
            {c.ok === null ? "—" : c.ok ? "OK" : (c.failLabel ?? "不足")}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function WaterSupplyPdf({
  result: r,
  projectName,
  generatedOn,
  references,
}: {
  result: WaterSupplyResult;
  projectName: string;
  generatedOn: string;
  references: string[];
}) {
  const j = r.input.jurisdiction;
  const multi = r.systems.length > 1;
  const formName = j === "taiwan" ? "內線設備水力計算表" : "內線工程審查計算表";

  return (
    <Document title="給水水理計算書" author="汎德工程顧問股份有限公司" language="zh-TW">
      <Page size="A4" style={s.page}>
        <PdfHeader generatedOn={generatedOn} />
        <Text style={s.title}>給水水理計算書</Text>
        <Text style={s.subtitle}>
          間接給水｜依{JURISDICTION_NAME[j]}「{formName}」格式計算一日用水量、總表口徑、蓄水池與水塔容量及揚水管口徑
        </Text>

        <View style={s.meta}>
          <View style={[s.metaCell, { flex: 2, borderRightWidth: 1, borderRightColor: C.line }]}>
            <Text style={s.metaLabel}>工程名稱</Text>
            <Text style={s.metaValue}>{projectName || "—"}</Text>
          </View>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>供水轄區</Text>
            <Text style={s.metaValue}>{JURISDICTION_NAME[j]}</Text>
          </View>
        </View>

        {r.systems.map((sys, i) => (
          <View key={sys.name} break={i > 0}>
            <Text style={s.formTitle}>
              {formName}
              {multi ? `（${sys.name}）` : ""}
            </Text>
            <View style={s.form}>
              <Form r={r} sys={sys} includeMeter={!multi} />
            </View>
          </View>
        ))}

        {multi && (
          <View wrap={false}>
            <Text style={s.formTitle}>總表口徑（各系統一日用水量合計）</Text>
            <View style={s.form}>
              <MeterSummary r={r} />
            </View>
          </View>
        )}

        <Text style={s.sectionTitle} minPresenceAhead={120}>
          計算明細
        </Text>
        {r.systems.map((sys) => (
          <View key={sys.name}>
            {multi && <Text style={[s.stepTitle, { marginBottom: 5, marginTop: 4 }]}>系統：{sys.name}</Text>}
            {sys.steps.map((st) => (
              <StepBlock key={st.title} step={st} />
            ))}
            {sys.checks.length > 0 && <Checks checks={sys.checks} />}
          </View>
        ))}
        <StepBlock step={r.meter.step} />
        {r.plan.active && <StepBlock step={r.plan.step} />}

        <View wrap={false}>
          <Text style={s.sectionTitle}>水箱設置提醒</Text>
          {REMINDERS[j].map((t) => (
            <View key={t} style={s.listItem}>
              <Text style={s.bullet}>・</Text>
              <Text style={s.listText}>{t}</Text>
            </View>
          ))}
        </View>

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
          {references.map((t, i) => (
            <View key={t} style={s.listItem}>
              <Text style={s.bullet}>{i + 1}.</Text>
              <Text style={s.listText}>{t}</Text>
            </View>
          ))}
          <Text style={s.disclaimer}>{DISCLAIMER(j)}</Text>
        </View>

        <PdfFooter />
      </Page>
    </Document>
  );
}
