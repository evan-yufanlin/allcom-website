import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { C, PdfFooter, PdfHeader, pageStyle } from "@/components/pdfCommon";
import { BOX_MODE_NAME, DISCLAIMER, PIPE_REMINDERS, REMINDERS, USE_NAME, fmt, type TelecomResult } from "@/lib/telecom";
import { ROOM_TABLE, SOURCES } from "@/lib/telecomTables";

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
  warn: { fontSize: 8, color: C.red, lineHeight: 1.5, marginTop: 2 },
  table: { borderWidth: 1, borderColor: C.line, marginTop: 4 },
  tr: { flexDirection: "row", borderTopWidth: 1, borderTopColor: C.line },
  trHead: { flexDirection: "row", backgroundColor: C.accentSoft },
  td: { padding: 3.5, fontSize: 7.5, lineHeight: 1.45 },
  th: { padding: 3.5, fontSize: 7, fontWeight: 700, lineHeight: 1.45 },
  listItem: { flexDirection: "row", marginBottom: 2 },
  bullet: { width: 12, fontSize: 8, lineHeight: 1.55 },
  listText: { flex: 1, fontSize: 8, lineHeight: 1.55 },
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

export default function TelecomPdf({ r, projectName, generatedOn }: { r: TelecomResult; projectName: string; generatedOn: string }) {
  const room = r.room;
  const boxes = r.mainBox ? [{ label: "總配線箱", floors: 1, boxes: r.mainBox }] : r.floorBoxes;
  return (
    <Document title="電信室空間檢討" author="汎德工程顧問股份有限公司" language="zh-TW">
      <Page size="A4" style={s.page}>
        <PdfHeader generatedOn={generatedOn} />
        <Text style={s.title}>電信室空間檢討</Text>
        <Text style={s.subtitle}>依建築物電信設備及空間設置使用管理規則、建築物屋內外電信設備設置技術規範（2021）推估</Text>

        <View style={s.meta}>
          <View style={[s.metaCell, { flex: 2, borderRightWidth: 1, borderRightColor: C.line }]}>
            <Text style={s.metaLabel}>工程名稱</Text>
            <Text style={s.metaValue}>{projectName || "—"}</Text>
          </View>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>樓層</Text>
            <Text style={s.metaValue}>
              地上 {r.input.above} 層、地下 {r.input.below} 層
            </Text>
          </View>
        </View>

        <View style={s.summary}>
          <View style={s.sumCell}>
            <Text style={s.sumLabel}>電信室</Text>
            <Text style={s.sumValue}>{room.required ? (room.area === null ? "協商決定" : `${room.area} m² 以上`) : "不須設置"}</Text>
          </View>
          <View style={s.sumCell}>
            <Text style={s.sumLabel}>引進電話電纜總對數</Text>
            <Text style={s.sumValue}>{r.inPairs} 對</Text>
          </View>
          <View style={s.sumCell}>
            <Text style={s.sumLabel}>用戶側光纖總心數</Text>
            <Text style={s.sumValue}>{r.cores} 心</Text>
          </View>
          <View style={s.sumCell}>
            <Text style={s.sumLabel}>引進管</Text>
            <Text style={s.sumValue}>
              {r.pipes.size} mm × {r.pipes.count} 管
            </Text>
          </View>
        </View>
        {room.required && (
          <Text style={[s.line, { marginTop: 4 }]}>
            最窄平面長度 {room.minSide} m 以上、室內淨高 {room.height} m 以上{r.input.below >= 2 ? "；以設於非最底層樓層為原則" : ""}。
          </Text>
        )}

        {r.rows.length > 0 && (
          <>
            <Text style={s.sectionTitle}>各層電信線數</Text>
            <Table
              widths={["11%", "6%", "21%", "7%", "10%", "21%", "12%", "6%", "6%"]}
              heads={["樓層", "層數", "用途", "單位數", "每單位 m²", "每單位對數", "每層 P／C／V", "小計P", "小計C"]}
              rows={[
                ...r.rows.map((x) => [
                  x.label || "—",
                  String(x.floors),
                  USE_NAME(x.use),
                  x.use === "mc" || x.use === "none" ? "—" : String(x.units),
                  x.use === "mc" || x.use === "none" ? "—" : fmt(x.unitArea),
                  `${x.unitPairs} 對（${x.unitPairsNote}）`,
                  `${x.floorPairs}／${x.floorCores}／${x.floorCoax}`,
                  String(x.pairs),
                  String(x.cores),
                ]),
                ["合計", "", "", "", "", "", "", String(r.sumPairs), String(r.cores)],
              ]}
            />
            <Text style={[s.line, { marginTop: 4 }]}>
              引進電話電纜總對數 ＝ {r.sumPairs} × 4/3 ＝ {fmt(((r.sumPairs ?? 0) * 4) / 3)} → {r.inPairs} 對（8.5.1）
            </Text>
            {r.dist !== null && <Text style={s.line}>用戶側配線電纜對數 ＝ Σ 各層對數 × 5/3 ＝ {r.dist} 對（8.4.1）</Text>}
          </>
        )}

        <View wrap={false}>
          <Text style={s.sectionTitle}>電信室</Text>
          {room.required ? (
            room.reasons.map((x) => (
              <Text key={x} style={s.line}>
                符合：{x}
              </Text>
            ))
          ) : (
            <Text style={s.line}>未符合第 9 條第 1 項各款，不須設置電信室，設置總配線箱。</Text>
          )}
          {room.required && (
            <Text style={s.line}>
              依對數 {r.inPairs} 對 → {ROOM_TABLE[room.byPairs].area ?? "協商"} m²；依心數{" "}
              {room.byCores === null ? `${r.cores} 心（未超過 48 心）` : `${r.cores} 心 → ${ROOM_TABLE[room.byCores].area ?? "協商"} m²`}；取較大者{" "}
              {room.area ?? "協商"} m²（表 13-1）
            </Text>
          )}
          {room.check && (
            <Text style={[s.line, { color: room.check.ok ? C.green : C.red }]}>
              規劃 {fmt(r.input.room.length!)} × {fmt(r.input.room.width!)} ＝ {fmt(room.check.area)} m²：面積{room.check.areaOk ? " OK" : "不足"}、最窄長度
              {room.check.sideOk ? " OK" : "不足"}
            </Text>
          )}
        </View>

        <View wrap={false}>
          <Text style={s.sectionTitle}>引進管</Text>
          {r.pipes.lines.map((x) => (
            <Text key={x} style={s.line}>
              ・{x}
            </Text>
          ))}
          {r.pipes.flags.map((x) => (
            <Text key={x} style={s.warn}>
              ※ {x}
            </Text>
          ))}
          <Text style={s.note}>{PIPE_REMINDERS.join(" ")}</Text>
        </View>

        {boxes.length > 0 && (
          <>
            <Text style={s.sectionTitle} minPresenceAhead={60}>
              {r.mainBox ? "總配線箱（未設電信室）" : "各層主配線箱"}
            </Text>
            <Text style={s.note}>配置方式：{BOX_MODE_NAME[r.input.boxMode]}</Text>
            <Table
              widths={["20%", "22%", "18%", "12%", "18%", "10%"]}
              heads={["樓層", "用途", "需求", "型號", "內部尺寸 cm", "垂直管數"]}
              rows={boxes.flatMap((f) =>
                f.boxes.map((b, j) => [
                  j === 0 ? `${f.label}${f.floors > 1 ? `（×${f.floors} 層）` : ""}` : "",
                  b.role,
                  b.need,
                  b.box?.id ?? "超出表列",
                  b.box ? b.box.size.join("×") : "另行設計",
                  b.box?.pipes ? String(b.box.pipes) : "—",
                ]),
              )}
            />
          </>
        )}

        {r.mdf && (
          <View wrap={false}>
            <Text style={s.sectionTitle}>總配線架與光終端配線架</Text>
            <Text style={s.line}>
              總配線架：{r.mdf.id ?? "超過 MDF-36"}（引進 {r.inPairs} 對{r.dist !== null ? `、配線 ${r.dist} 對` : ""}）
              {r.mdf.frames ? `，${r.mdf.double ? "雙側" : "單側"} ${r.mdf.frames} 縱架，約寬 ${fmt(r.mdf.width! / 1000)} m × 深 ${fmt(r.mdf.depth / 1000)} m × 高 2 m` : ""}
            </Text>
            <Text style={s.note}>{r.mdf.note}</Text>
            <Text style={s.line}>
              光終端配線架：{r.oldf ? `${r.oldf.id}（${r.cores} 心），${r.oldf.kind} × ${r.oldf.cabinets} 只` : "未設光纜"}
            </Text>
          </View>
        )}

        {r.power && (
          <View wrap={false}>
            <Text style={s.sectionTitle}>電信室電源設備需求（表 13-2）</Text>
            <Text style={s.line}>
              電力總容量 {r.power.kva ?? "另洽"} kVA；總開關 {r.power.mccb}；預留回路 {r.power.circuits} 只；插座 {r.power.outlets} 只；{r.power.supply}；照明 300 lux
            </Text>
          </View>
        )}

        {room.required && (
          <View>
            <Text style={s.sectionTitle} minPresenceAhead={60}>
              電信室設置提醒
            </Text>
            <Bullets items={[...REMINDERS, ...r.notes]} />
          </View>
        )}

        <View wrap={false}>
          <Text style={s.sectionTitle}>引用法規</Text>
          <Text style={s.line}>1. {SOURCES.rules}：第 9 條、附件一</Text>
          <Text style={s.line}>2. {SOURCES.spec}：6.3、6.4、6.6、8、12.3、13、15.1</Text>
          <Text style={s.disclaimer}>{DISCLAIMER}</Text>
        </View>

        <PdfFooter />
      </Page>
    </Document>
  );
}
