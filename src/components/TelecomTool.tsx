"use client";

import { useState, type ReactNode } from "react";
import PdfSaveButton from "@/components/PdfSaveButton";
import { Card, Check as CheckBox, Num, RemoveButton, Select, SmallButton, Text } from "@/components/ToolFields";
import { dateStamp } from "@/lib/dateStamp";
import {
  BOX_MODE_NAME,
  DISCLAIMER,
  PIPE_REMINDERS,
  RISER_REMINDERS,
  REMINDERS,
  USE_NAME,
  calculateTelecom,
  defaultTelecomInput,
  fmt,
  type BoxMode,
  type FloorRow,
  type Mode,
  type TelecomInput,
  type TelecomResult,
  type UseKey,
} from "@/lib/telecom";
import {
  A_BOXES,
  B_BOXES,
  C_BOXES,
  MDF_TABLE,
  OLDF_TABLE,
  PIPE_TABLE,
  RISER_TABLE,
  POWER_TABLE,
  ROOM_TABLE,
  RULE9,
  SOURCES,
  USE_CLASSES,
  type BoxType,
} from "@/lib/telecomTables";

type RowUI = FloorRow & { id: number };

let nextId = 1;
const newId = () => nextId++;

const USE_OPTIONS: UseKey[] = [1, 2, 3, 4, 5, 6, 7, "mc", "none"];

export default function TelecomTool() {
  const [projectName, setProjectName] = useState("");
  const [p, setP] = useState<Omit<TelecomInput, "rows"> & { rows: RowUI[] }>(() => ({
    ...defaultTelecomInput(),
    rows: [
      { id: newId(), label: "2F～11F", floors: 10, use: 3, units: 4, area: 0 },
      { id: newId(), label: "1F", floors: 1, use: "mc", units: 1, area: 0 },
      { id: newId(), label: "B1", floors: 1, use: 7, units: 1, area: 0 },
    ],
  }));
  const [today] = useState(() => new Date());
  const set = (patch: Partial<Omit<TelecomInput, "rows">>) => setP((cur) => ({ ...cur, ...patch }));
  const setRow = (id: number, patch: Partial<RowUI>) =>
    setP((cur) => ({ ...cur, rows: cur.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));

  const r = calculateTelecom(p);
  const ready = p.mode === "direct" ? p.direct.pairs > 0 || p.direct.cores > 0 : p.mode === "houses" ? p.houses.area > 0 : r.sumPairs! > 0;
  const fileName = `電信室空間檢討_${r.inPairs}P-${r.cores}C-${dateStamp(today, "")}`;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Card title="① 基本資料">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <Text label="工程名稱（選填）" value={projectName} onChange={setProjectName} className="sm:col-span-2" />
          <Num label="地上層數" integer value={p.above} onChange={(above) => set({ above: above ?? 0 })} />
          <Num label="地下層數" integer value={p.below} onChange={(below) => set({ below: below ?? 0 })} />
        </div>
        <Select<Mode>
          label="計算方式"
          value={p.mode}
          onChange={(mode) => set({ mode })}
          options={[
            { value: "floors", label: "依樓層輸入（集合住宅、商業、辦公等）" },
            { value: "houses", label: "透天建築物（依戶數輸入）" },
            { value: "direct", label: "直接輸入引進對數與光纖心數" },
          ]}
        />
        <div className="flex flex-col gap-1.5">
          {p.mode !== "direct" && (
            <CheckBox checked={p.fiber} onChange={(fiber) => set({ fiber })}>
              引進光纜（公有建築物、集合住宅等應引進，見下方第 9 條）
            </CheckBox>
          )}
          <CheckBox checked={p.ftth} onChange={(ftth) => set({ ftth })}>
            所在地已公告有線電視全數光纖入戶（FTTH），不設同軸電纜
          </CheckBox>
          {p.mode === "floors" && (
            <CheckBox checked={p.singleOwner} onChange={(singleOwner) => set({ singleOwner })}>
              單獨所有權建築物（整棟同一所有人，以整層計算；每層至少 4 對、4 心）
            </CheckBox>
          )}
          {p.mode !== "direct" && !p.fiber && (
            <CheckBox checked={p.capResidential} onChange={(capResidential) => set({ capResidential })}>
              住宅每單位超過 4 對時，得採用 4 對（8.3.1.3）
            </CheckBox>
          )}
        </div>
        <RefToggle title="規則第 9 條：應設電信室、應引進光纜之條件">
          <Rule9Table r={r} />
        </RefToggle>
      </Card>

      <Card title="② 樓層與用途">
        {p.mode === "floors" && (
          <>
            {p.rows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-2 gap-2 border-l-2 border-line pl-3 sm:grid-cols-[minmax(0,0.9fr)_4.5rem_minmax(0,1.8fr)_4.5rem_minmax(0,1fr)_auto]"
              >
                <Text label="樓層" value={row.label} onChange={(label) => setRow(row.id, { label })} />
                <Num label="層數" integer value={row.floors} onChange={(floors) => setRow(row.id, { floors: floors ?? 1 })} />
                <Select<string>
                  label="用途（表 8-1）"
                  value={String(row.use)}
                  className="col-span-2 sm:col-span-1"
                  onChange={(v) => setRow(row.id, { use: (isNaN(Number(v)) ? v : Number(v)) as UseKey })}
                  options={USE_OPTIONS.map((u) => ({ value: String(u), label: USE_NAME(u) }))}
                />
                {row.use === "mc" || row.use === "none" ? (
                  <>
                    <span className="hidden sm:block" />
                    <span className="hidden sm:block" />
                  </>
                ) : (
                  <>
                    <Num
                      label={p.singleOwner ? "單位（整層）" : "單位數"}
                      integer
                      value={p.singleOwner ? 1 : row.units}
                      onChange={(units) => setRow(row.id, { units: units ?? 1 })}
                    />
                    <Num label="每層面積" unit="m²" value={row.area} onChange={(area) => setRow(row.id, { area: area ?? 0 })} />
                  </>
                )}
                <RemoveButton label="刪除此列" onClick={() => setP((cur) => ({ ...cur, rows: cur.rows.filter((x) => x.id !== row.id) }))} />
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <SmallButton onClick={() => setP((cur) => ({ ...cur, rows: [...cur.rows, { id: newId(), label: "", floors: 1, use: 2, units: 1, area: 0 }] }))}>
                ＋ 樓層
              </SmallButton>
              <SmallButton onClick={() => setP((cur) => ({ ...cur, rows: [...cur.rows, { id: newId(), label: "1F", floors: 1, use: "mc", units: 1, area: 0 }] }))}>
                ＋ 管委會
              </SmallButton>
            </div>
            <p className="text-[0.72rem] leading-relaxed text-muted">
              每單位面積 ＝ 每層面積 ÷ 單位數。同一樓層有不同用途時，以相同樓層名稱分列輸入，主配線箱依樓層合併計算。
            </p>
          </>
        )}
        {p.mode === "houses" && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Num label="戶數（1 戶為獨戶透天）" integer value={p.houses.count} onChange={(count) => set({ houses: { ...p.houses, count: count ?? 1 } })} />
            <Num label="每戶總樓地板面積" unit="m²" value={p.houses.area} onChange={(area) => set({ houses: { ...p.houses, area: area ?? 0 } })} />
          </div>
        )}
        {p.mode === "direct" && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Num label="引進電話電纜總對數" unit="對" integer value={p.direct.pairs} onChange={(pairs) => set({ direct: { ...p.direct, pairs: pairs ?? 0 } })} />
            <Num label="用戶側光纖總心數" unit="心" integer value={p.direct.cores} onChange={(cores) => set({ direct: { ...p.direct, cores: cores ?? 0 } })} />
          </div>
        )}
        {p.mode !== "direct" && (
          <RefToggle title="表 8-1 建築物使用類別電話電纜對數估計係數">
            <UseTable fiber={p.fiber} used={new Set(p.mode === "houses" ? [3] : p.rows.map((x) => x.use))} />
          </RefToggle>
        )}
      </Card>

      <Card title="③ 配線箱、配線架與電信室尺寸（選填）">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select<BoxMode>
            label="主配線箱配置方式"
            value={p.boxMode}
            onChange={(boxMode) => set({ boxMode })}
            options={(["bc", "c", "separate"] as const).map((m) => ({ value: m, label: BOX_MODE_NAME[m] }))}
          />
          <Select<string>
            label="總配線架（MDF）"
            value={p.mdfDouble ? "double" : "single"}
            onChange={(v) => set({ mdfDouble: v === "double" })}
            options={[
              { value: "single", label: "單側" },
              { value: "double", label: "雙側（MDF-6 以上）" },
            ]}
          />
          {p.mode === "floors" && (
            <div className="flex items-end pb-1.5 sm:col-span-2">
              <CheckBox checked={p.riserUniform} onChange={(riserUniform) => set({ riserUniform })}>
                垂直幹管（電信立管）統一採最大管徑（規範設計範例之做法）
              </CheckBox>
            </div>
          )}
          <Num label="電信室規劃長度" unit="m" value={p.room.length} allowEmpty onChange={(length) => set({ room: { ...p.room, length } })} />
          <Num label="電信室規劃寬度" unit="m" value={p.room.width} allowEmpty onChange={(width) => set({ room: { ...p.room, width } })} />
        </div>
      </Card>

      {ready ? (
        <Results r={r} projectName={projectName} fileName={fileName} generatedOn={dateStamp(today, "/")} />
      ) : (
        <p className="border border-dashed border-line p-5 text-center text-[0.85rem] text-muted">輸入樓層面積或線數後，即顯示檢討結果</p>
      )}
    </div>
  );
}

// ---- 結果 ----

function Results({ r, projectName, fileName, generatedOn }: { r: TelecomResult; projectName: string; fileName: string; generatedOn: string }) {
  const room = r.room;
  return (
    <div className="flex flex-col gap-6">
      <section className="border border-accent bg-accent-soft p-5">
        <span className="eyebrow">檢討結果</span>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Metric label="電信室" value={room.required ? (room.area === null ? "協商" : `${room.area}`) : "不須設置"} unit={room.required && room.area !== null ? "m² 以上" : ""} strong />
          <Metric label="引進電話電纜總對數" value={String(r.inPairs)} unit="對" />
          <Metric label="用戶側光纖總心數" value={String(r.cores)} unit="心" />
          <Metric label="引進管" value={`${r.pipes.size} mm × ${r.pipes.count}`} unit="管" />
        </div>
        {room.required && (
          <p className="mt-3 text-[0.8rem]">
            最窄平面長度 {room.minSide} m 以上、室內淨高 {room.height} m 以上
            {r.input.below >= 2 ? "；以設於非最底層樓層為原則" : ""}。
          </p>
        )}
      </section>

      {r.rows.length > 0 && (
        <Section title="各層電信線數" open>
          <FloorTable r={r} />
          <div className="flex flex-col gap-1 border border-line bg-surface p-3 font-mono text-[0.78rem] leading-relaxed tabular-nums">
            <span>
              引進電話電纜總對數 ＝ {r.sumPairs} × 4/3 ＝ {fmt(((r.sumPairs ?? 0) * 4) / 3)} → {r.inPairs} 對（8.5.1）
            </span>
            <span>用戶側光纖總心數 ＝ {r.cores} 心（8.3.2）</span>
            {r.dist !== null && <span>用戶側配線電纜對數 ＝ Σ 各層對數 × 5/3 ＝ {r.dist} 對（8.4.1）</span>}
          </div>
        </Section>
      )}

      <Section title="電信室" open>
        <div className="flex flex-col gap-1 text-[0.82rem] leading-relaxed">
          {room.required ? (
            room.reasons.map((x) => <span key={x}>✔ {x}</span>)
          ) : (
            <span className="text-muted">未符合第 9 條第 1 項各款，不須設置電信室，設置總配線箱。</span>
          )}
          {room.required && (
            <span className="font-mono tabular-nums">
              依對數 {r.inPairs} 對 → {ROOM_TABLE[room.byPairs].area ?? "協商"} m²；依心數{" "}
              {room.byCores === null ? `${r.cores} 心（未超過 48 心）` : `${r.cores} 心 → ${ROOM_TABLE[room.byCores].area ?? "協商"} m²`}
              ；取較大者 {room.area ?? "協商"} m²
            </span>
          )}
          {room.check && (
            <span className={room.check.ok ? "font-bold text-[#15803d] dark:text-[#4ade80]" : "font-bold text-[var(--phase-r)]"}>
              規劃 {fmt(r.input.room.length!)} × {fmt(r.input.room.width!)} ＝ {fmt(room.check.area)} m²：面積{room.check.areaOk ? " OK" : "不足"}、最窄長度
              {room.check.sideOk ? " OK" : "不足"}
            </span>
          )}
          {r.notes.map((x) => (
            <span key={x} className="text-muted">
              ※ {x}
            </span>
          ))}
        </div>
        <RefToggle title="表 13-1 電信室面積一覽表">
          <RoomTable r={r} />
        </RefToggle>
      </Section>

      <Section title="引進管" open>
        <ul className="flex list-disc flex-col gap-1 pl-5 text-[0.8rem] leading-relaxed">
          {r.pipes.lines.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        {r.pipes.flags.map((x) => (
          <p key={x} className="border-l-2 border-[var(--phase-r)] pl-2.5 text-[0.78rem]">
            ⚠ {x}
          </p>
        ))}
        <p className="text-[0.72rem] leading-relaxed text-muted">{PIPE_REMINDERS.join(" ")}</p>
        <RefToggle title="表 6-13 引進管管徑適用表">
          <PipeTable size={r.pipes.size} />
        </RefToggle>
      </Section>

      {(r.floorBoxes.length > 0 || r.mainBox) && (
        <Section title={r.mainBox ? "總配線箱（未設電信室）" : "各層主配線箱"} open>
          <span className="text-[0.75rem] text-muted">配置方式：{BOX_MODE_NAME[r.input.boxMode]}</span>
          <BoxResultTable r={r} />
          {r.input.boxMode === "separate" && <p className="text-[0.72rem] text-muted">分開設置時須設置 28 mm 以上之連通管（12.3.4）。</p>}
          {r.floorBoxes.length > 0 && (
            <p className="text-[0.72rem] text-muted">地下停車層等得不設主配線箱，電話插座直接配線至總配線架（參考設計範例三）。</p>
          )}
          <RefToggle title={r.mainBox ? "表 6-8 總配線箱種類" : "表 6-9、6-10 主配線箱種類"}>
            {r.mainBox ? <BoxTable list={A_BOXES} used={r.mainBox.map((b) => b.box?.id)} total /> : (
              <>
                <BoxTable list={B_BOXES} used={r.floorBoxes.flatMap((f) => f.boxes.map((b) => b.box?.id))} />
                <BoxTable list={C_BOXES} used={r.floorBoxes.flatMap((f) => f.boxes.map((b) => b.box?.id))} coax />
              </>
            )}
          </RefToggle>
        </Section>
      )}

      {r.riser && (
        <Section title="垂直幹管（電信立管）" open>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-[0.8rem] leading-relaxed">
            {r.riser.lines.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <div className="overflow-x-auto">
            <Grid
              heads={["用途", "需求（每路由）", "管徑", "管數"]}
              rows={r.riser.pipes.map((x) => [
                x.role,
                x.need,
                x.mm === null ? <span key="t" className="text-[var(--phase-r)]">採用線架或線槽</span> : `${x.mm} mm`,
                x.count || "—",
              ])}
            />
          </div>
          <p className="text-[0.8rem] font-bold">
            每一路由 {r.riser.count} 管 × {r.riser.routes} 路由
            {r.riser.dedicatedShaft && <span className="ml-1.5 text-[var(--phase-r)]">→ 應設電信專用管道間或於公共管道間預留電信專用位置</span>}
          </p>
          {r.riser.flags.map((x) => (
            <p key={x} className="border-l-2 border-[var(--phase-r)] pl-2.5 text-[0.78rem]">
              ⚠ {x}
            </p>
          ))}
          <ul className="flex list-disc flex-col gap-1 pl-5 text-[0.72rem] leading-relaxed text-muted">
            {RISER_REMINDERS.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <RefToggle title="表 6-14 主幹線纜對數適用管徑參照表">
            <Grid
              heads={["線纜種類", "主幹線纜對數", "管徑 mm", "英制 inch"]}
              rows={RISER_TABLE.map((x) => [x.kind, x.range, x.mm ?? "—", x.inch])}
              mark={(k) => r.riser!.pipes.some((q) => q.mm !== null && q.mm === RISER_TABLE[k].mm && RISER_TABLE[k].range !== "同軸電纜" && (RISER_TABLE[k].kind === "光纜") === (q.role === "光纜"))}
            />
            <span className="text-[0.68rem] text-muted">主幹線纜對數 200 對以下者亦可採用線架或線槽；300 對以上者採用線架或線槽。</span>
          </RefToggle>
        </Section>
      )}

      {r.mdf && (
        <Section title="總配線架（MDF）與光終端配線架（OLDF）" open>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="border border-line bg-surface p-4 text-[0.8rem] leading-relaxed">
              <div className="flex items-baseline justify-between">
                <span className="font-bold">總配線架 MDF</span>
                <span className="font-mono font-semibold text-accent">{r.mdf.id ?? "超過 MDF-36"}</span>
              </div>
              <span className="block font-mono text-[0.76rem] tabular-nums">
                引進 {r.inPairs} 對{r.dist !== null ? `、配線 ${r.dist} 對` : "（直接輸入，未檢核配線對數）"}
              </span>
              {r.mdf.frames && (
                <span className="block font-mono text-[0.76rem] tabular-nums">
                  {r.mdf.double ? "雙側" : "單側"} {r.mdf.frames} 縱架；約寬 {fmt(r.mdf.width! / 1000)} m × 深 {fmt(r.mdf.depth / 1000)} m × 高 2 m
                </span>
              )}
              <span className="mt-1 block text-[0.7rem] text-muted">{r.mdf.note} 電信室面積已包含總配線架空間。</span>
            </div>
            <div className="border border-line bg-surface p-4 text-[0.8rem] leading-relaxed">
              <div className="flex items-baseline justify-between">
                <span className="font-bold">光終端配線架 OLDF</span>
                <span className="font-mono font-semibold text-accent">{r.oldf?.id ?? "—"}</span>
              </div>
              {r.oldf ? (
                <span className="block font-mono text-[0.76rem] tabular-nums">
                  {r.cores} 心；{r.oldf.kind} × {r.oldf.cabinets} 只
                </span>
              ) : (
                <span className="block text-[0.76rem] text-muted">未設光纜</span>
              )}
            </div>
          </div>
          <RefToggle title="表 6-15 總配線架種類、表 6-16 光終端配線架種類">
            <MdfTables r={r} />
          </RefToggle>
        </Section>
      )}

      {r.power && (
        <Section title="電信室電源設備需求" open>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 border border-line bg-surface p-4 text-[0.8rem] sm:grid-cols-3">
            <span>電力總容量：{r.power.kva ?? "另洽"} kVA</span>
            <span>總開關：{r.power.mccb}</span>
            <span>供電方式：{r.power.supply}</span>
            <span>預留回路：{r.power.circuits} 只</span>
            <span>插座：{r.power.outlets} 只</span>
            <span>照明：室內各處 300 lux</span>
          </div>
          <p className="text-[0.72rem] text-muted">預留回路與插座為 110V／15A～20A；電信室得設獨立電表或電力分表。</p>
          <RefToggle title="表 13-2 建築物電信室電源設備需求表">
            <PowerTable inPairs={r.inPairs} />
          </RefToggle>
        </Section>
      )}

      {r.room.required && (
        <Section title="電信室設置提醒" open>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[0.8rem] leading-relaxed">
            {REMINDERS.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </Section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-[1.05rem] font-extrabold">引用法規</h2>
        <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-[0.82rem] leading-relaxed">
          <li>{SOURCES.rules}：第 9 條、附件一</li>
          <li>{SOURCES.spec}：6.3、6.4、6.5、6.6、8、11.1、11.2、12.3、13、15.1</li>
        </ol>
      </section>

      <p className="border-t border-dashed border-line pt-4 text-[0.75rem] leading-relaxed text-muted">{DISCLAIMER}</p>

      <PdfSaveButton
        fileName={fileName}
        label="下載計算書 PDF"
        build={async () => {
          const [{ pdf }, { default: TelecomPdf }, { registerPdfFonts }] = await Promise.all([
            import("@react-pdf/renderer"),
            import("@/components/TelecomPdf"),
            import("@/components/pdfCommon"),
          ]);
          registerPdfFonts(window.location.origin);
          return pdf(<TelecomPdf r={r} projectName={projectName} generatedOn={generatedOn} />).toBlob();
        }}
      />
    </div>
  );
}

// ---- 共用 ----

function Section({ title, open: initial, children }: { title: string; open?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(initial ?? true);
  return (
    <section className="flex flex-col gap-2.5">
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="flex items-baseline gap-2 text-left">
        <span className="text-[0.8rem] text-muted">{open ? "▾" : "▸"}</span>
        <h2 className="text-[1.05rem] font-extrabold">{title}</h2>
      </button>
      {open && children}
    </section>
  );
}

function RefToggle({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="self-start text-left text-[0.75rem] text-accent hover:underline">
        {open ? "▾" : "▸"} 查看{title}
      </button>
      {open && (
        <div className="flex flex-col gap-2 overflow-x-auto border border-line bg-background p-3">
          {children}
          <span className="text-[0.68rem] text-muted">框選列為本案適用。出處：{SOURCES.spec}{title.includes("第 9 條") ? `；${SOURCES.rules}` : ""}</span>
        </div>
      )}
    </div>
  );
}

const th = "border border-line px-2 py-1.5 text-left font-bold whitespace-nowrap";
const td = "border border-line px-2 py-1 align-top";
const hit = "bg-accent-soft/70 font-bold outline-2 -outline-offset-2 outline-accent";

function Grid({ heads, rows, mark, min = "28rem" }: { heads: string[]; rows: ReactNode[][]; mark?: (i: number) => boolean; min?: string }) {
  return (
    <table className="w-full border-collapse text-[0.74rem] tabular-nums" style={{ minWidth: min }}>
      <thead>
        <tr className="bg-accent-soft">
          {heads.map((h) => (
            <th key={h} className={th}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((cells, i) => (
          <tr key={i} className={mark?.(i) ? hit : ""}>
            {cells.map((c, j) => (
              <td key={j} className={td}>
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FloorTable({ r }: { r: TelecomResult }) {
  return (
    <div className="overflow-x-auto">
      <Grid
        min="52rem"
        heads={["樓層", "層數", "用途", "單位數", "每單位面積 m²", "每單位對數", "每層 對／心／同軸", "小計 對", "小計 心"]}
        rows={[
          ...r.rows.map((x) => [
            x.label || "—",
            x.floors,
            USE_NAME(x.use),
            x.use === "mc" || x.use === "none" ? "—" : x.units,
            x.use === "mc" || x.use === "none" ? "—" : fmt(x.unitArea),
            <span key="n">
              <b>{x.unitPairs}</b>
              <span className="block text-[0.66rem] text-muted">{x.unitPairsNote}</span>
            </span>,
            `${x.floorPairs}P／${x.floorCores}C／${x.floorCoax}V`,
            x.pairs,
            x.cores,
          ]),
          ["合計", "", "", "", "", "", "", <b key="p">{r.sumPairs}</b>, <b key="c">{r.cores}</b>],
        ]}
      />
    </div>
  );
}

function UseTable({ fiber, used }: { fiber: boolean; used: Set<UseKey> }) {
  return (
    <Grid
      heads={["類別", "建築物用途", "未引進光纜", "引進光纜"]}
      rows={USE_CLASSES.map((u) => [u.id, u.name, fiber ? u.noFiber : <b key="a">{u.noFiber}</b>, fiber ? <b key="b">{u.fiber}</b> : u.fiber])}
      mark={(i) => used.has(USE_CLASSES[i].id as UseKey)}
    />
  );
}

function Rule9Table({ r }: { r: TelecomResult }) {
  const hitRoom = [r.cores > 48, r.input.above >= 5 && r.input.below >= 1 && r.inPairs > 20];
  return (
    <div className="flex flex-col gap-2 text-[0.76rem] leading-relaxed">
      <span className="font-bold">第 9 條第 1 項：新建建築物有下列情形之一者，應設置電信室</span>
      {RULE9.room.map((x, i) => (
        <span key={x} className={hitRoom[i] ? hit + " px-2 py-0.5" : "px-2 py-0.5"}>
          {hitRoom[i] ? "✔" : "　"} {i + 1}. {x}
        </span>
      ))}
      <span className="font-bold">第 9 條第 3 項：下列建築物，起造人應引進光纜</span>
      {RULE9.fiber.map((x, i) => (
        <span key={x} className="px-2">
          {i + 1}. {x}
        </span>
      ))}
    </div>
  );
}

function RoomTable({ r }: { r: TelecomResult }) {
  return (
    <Grid
      heads={["引進電話電纜總對數", "用戶側光纖心數", "電信室面積", "備註"]}
      rows={ROOM_TABLE.map((x, i) => [
        <span key="p">
          {x.pairsLabel}
          {i === r.room.byPairs && <em className="ml-1 not-italic text-accent">← 依對數</em>}
        </span>,
        <span key="c">
          {x.coresLabel}
          {i === r.room.byCores && <em className="ml-1 not-italic text-accent">← 依心數</em>}
        </span>,
        x.area === null ? "由業者與起造人協商" : `${x.area} m² 以上`,
        `室內淨高至少 2.1 m，最窄平面長度不得少於 ${x.minSide} m`,
      ])}
      mark={(i) => r.room.required && i === r.room.row}
    />
  );
}

function PipeTable({ size }: { size: number }) {
  return (
    <Grid
      heads={["線路引進方式", "引進線纜對數", "管徑 mm", "英制 inch"]}
      rows={PIPE_TABLE.map((x) => [x.kind, x.range, x.mm, x.inch])}
      mark={(i) => PIPE_TABLE[i].mm === size}
    />
  );
}

function BoxResultTable({ r }: { r: TelecomResult }) {
  const list = r.mainBox ? [{ label: "總配線箱", floors: 1, boxes: r.mainBox }] : r.floorBoxes;
  return (
    <div className="overflow-x-auto">
      <Grid
        min="36rem"
        heads={["樓層", "用途", "需求", "型號", "內部尺寸 寬×高×深 cm", "垂直管數"]}
        rows={list.flatMap((f) =>
          f.boxes.map((b, j) => [
            j === 0 ? `${f.label}${f.floors > 1 ? `（×${f.floors} 層）` : ""}` : "",
            b.role,
            b.need,
            b.box ? <b key="id">{b.box.id}</b> : <span key="x" className="text-[var(--phase-r)]">超出表列，另行設計</span>,
            b.box ? b.box.size.join("×") : "—",
            b.box?.pipes ?? "—",
          ]),
        )}
      />
    </div>
  );
}

function BoxTable({ list, used, coax, total }: { list: BoxType[]; used: (string | undefined)[]; coax?: boolean; total?: boolean }) {
  const set = new Set(used);
  const sh = (b: BoxType) =>
    b.shared ? [b.shared.p && `${b.shared.p}P`, b.shared.c && `${b.shared.c}C`, b.shared.v && `${b.shared.v}V`].filter(Boolean).join("＋") : "—";
  return (
    <Grid
      heads={
        total
          ? ["型號", "內部尺寸 寬×高×深 cm", "用戶側端子 P", "光纜 C", "同軸 V", "共用（用戶側）"]
          : coax
            ? ["型號", "內部尺寸 寬×高×深 cm", "單獨同軸 V", "共用 P＋C＋V", "垂直管數"]
            : ["型號", "內部尺寸 寬×高×深 cm", "單獨端子 P", "單獨光纜 C", "共用 P＋C", "垂直管數"]
      }
      rows={list.map((b) =>
        total
          ? [b.id, b.size.join("×"), b.p, b.c, b.v, sh(b)]
          : coax
            ? [b.id, b.size.join("×"), b.v, sh(b), b.pipes]
            : [b.id, b.size.join("×"), b.p, b.c || "—", sh(b), b.pipes],
      )}
      mark={(i) => set.has(list[i].id)}
    />
  );
}

function MdfTables({ r }: { r: TelecomResult }) {
  return (
    <>
      <Grid
        heads={["MDF 型式", "引進電纜對數", "配線電纜對數", "單側縱架數", "雙側縱架數"]}
        rows={MDF_TABLE.map((x) => [x.id, x.inPairs, x.outPairs, x.single, x.double ?? "—"])}
        mark={(i) => MDF_TABLE[i].id === r.mdf?.id}
      />
      <span className="text-[0.68rem] text-muted">原則上每一縱架最多收容 600 對；縱架寬 190 mm、高 2000 mm，深 320 mm（單側）／640 mm（雙側）（圖 6-3）。</span>
      <Grid
        heads={["OLDF 型式", "引進／配線光纖心數", "機櫃數", "備註"]}
        rows={OLDF_TABLE.map((x) => [x.id, x.cores, x.cabinets, x.kind])}
        mark={(i) => OLDF_TABLE[i].id === r.oldf?.id}
      />
    </>
  );
}

function PowerTable({ inPairs }: { inPairs: number }) {
  const idx = POWER_TABLE.findIndex((p) => p.max === null || inPairs <= p.max);
  return (
    <Grid
      min="40rem"
      heads={["引進總對數", "電力容量 kVA", "總開關 MCCB", "預留回路", "插座", "供電方式", "照明"]}
      rows={POWER_TABLE.map((p) => [p.label, p.kva ?? "另洽", p.mccb, p.circuits || "—", p.outlets || "—", p.supply, "300 lux"])}
      mark={(i) => i === idx}
    />
  );
}

function Metric({ label, value, unit, strong }: { label: string; value: string; unit: string; strong?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[0.72rem] text-muted">{label}</span>
      <span className="flex items-baseline gap-1">
        <span className={`font-mono font-semibold tabular-nums text-accent ${strong ? "text-[1.6rem] leading-none" : "text-[1.15rem]"}`}>{value}</span>
        <span className="text-[0.75rem] font-bold">{unit}</span>
      </span>
    </div>
  );
}
