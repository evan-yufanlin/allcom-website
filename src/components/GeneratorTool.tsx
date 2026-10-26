"use client";

import { useState, type ReactNode } from "react";
import GeneratorPlan from "@/components/GeneratorPlan";
import PdfSaveButton from "@/components/PdfSaveButton";
import { Card, Num, Select, SmallButton, Text } from "@/components/ToolFields";
import { CATALOGS, GENSETS, GEN_SERIES, TANKS, TANK_SOURCE, VENDOR_NAME, seriesLabel, seriesOf, type GenSet, type Vendor } from "@/data/generators";
import { dateStamp } from "@/lib/dateStamp";
import {
  CLEAR_LABEL,
  DEFINITIONS,
  DIKE_RULE_LABEL,
  DISCLAIMER,
  FIRE_DURATIONS,
  NOTES,
  REMINDERS,
  ROOM_TANK_LIMIT,
  SOURCES,
  SOURCE_LIST,
  calculateGenerator,
  clearLabel,
  defaultClearances,
  defaultGenInput,
  doorLine,
  fmt,
  fuelLines,
  suggestDoorWidth,
  louverLines,
  pickGensets,
  unitOf,
  type Basis,
  type Clearances,
  type DikeRule,
  type GenInput,
  type GenResult,
  type GenUnit,
  type OpSide,
} from "@/lib/generator";
import { buildDrawing } from "@/lib/generatorDrawing";

const CUSTOM = "custom";
const keyOf = (g: GenSet) => String(GENSETS.indexOf(g));

type Settings = Omit<GenInput, "unit">;

const initialPick = () => {
  const g = GENSETS.find((x) => x.series === "chem-cummins" && x.model === "CH-1000")!;
  return keyOf(g);
};

export default function GeneratorTool() {
  const [projectName, setProjectName] = useState("");
  const [required, setRequired] = useState(1000);
  const [basis, setBasis] = useState<Basis>("kva");
  const [vendor, setVendor] = useState<Vendor | "all">("all");
  const [pick, setPick] = useState(initialPick);
  const [custom, setCustom] = useState<GenUnit>({ label: "自訂機組", standbyKw: 500, size: [3500, 1400, 2000], baseTank: null, fuel: null });
  const [settings, setSettings] = useState<Settings>(() => {
    const { unit: _u, ...rest } = defaultGenInput(custom);
    void _u;
    return rest;
  });
  const [today] = useState(() => new Date());
  const set = (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch }));
  const setClear = (k: keyof Clearances, v: number) => setSettings((s) => ({ ...s, clear: { ...s.clear, [k]: v } }));

  const selected = pick === CUSTOM ? null : GENSETS[Number(pick)];
  const unit = selected ? unitOf(selected) : custom;
  const valid = unit.standbyKw > 0 && unit.size[0] > 0 && unit.size[1] > 0;
  const r = calculateGenerator({ ...settings, unit });

  const candidates = pickGensets(required, basis).filter((g) => vendor === "all" || seriesOf(g.series).vendor === vendor);
  const pickSeries = selected?.series ?? GEN_SERIES[0].id;
  const fileName = `緊急發電機室_${unit.label.replace(/[\\/:*?"<>|（）\s]+/g, "_")}-${dateStamp(today, "")}`;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Card title="① 機組選型">
        <Text label="工程名稱（選填）" value={projectName} onChange={setProjectName} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Num label="需求容量（Standby）" integer value={required} onChange={(v) => setRequired(v ?? 0)} />
          <Select<Basis>
            label="單位"
            value={basis}
            onChange={setBasis}
            options={[
              { value: "kva", label: "kVA" },
              { value: "kw", label: "kW" },
            ]}
          />
          <Select<Vendor | "all">
            label="廠牌"
            value={vendor}
            onChange={setVendor}
            options={[{ value: "all", label: "全部" }, ...(["teco", "chem"] as const).map((v) => ({ value: v, label: VENDOR_NAME[v] }))]}
          />
        </div>
        <p className="text-[0.72rem] leading-relaxed text-muted">下表列出各系列 Standby 容量 ≧ 需求之最小機型；點選一列即切換計算與平面圖。型錄未列尺寸之機型不列入。</p>
        <CandidateTable list={candidates} pick={pick} onPick={setPick} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <Select<string>
            label="或指定系列"
            value={pick === CUSTOM ? CUSTOM : pickSeries}
            onChange={(id) => {
              if (id === CUSTOM) return setPick(CUSTOM);
              const first = GENSETS.find((g) => g.series === id && g.size);
              if (first) setPick(keyOf(first));
            }}
            options={[...GEN_SERIES.map((s) => ({ value: s.id, label: seriesLabel(s) })), { value: CUSTOM, label: "自訂機組" }]}
          />
          {pick !== CUSTOM && (
            <Select<string>
              label="型號"
              value={pick}
              onChange={setPick}
              options={GENSETS.filter((g) => g.series === pickSeries && g.size).map((g) => ({
                value: keyOf(g),
                label: `${g.model}｜${g.engine}｜${g.standbyKva} kVA / ${g.standbyKw} kW${g.emission ? `｜${g.emission}` : ""}`,
              }))}
            />
          )}
        </div>

        {pick === CUSTOM && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Text label="名稱" value={custom.label} onChange={(label) => setCustom({ ...custom, label })} className="col-span-2" />
            <Num label="Standby 輸出" unit="kW" value={custom.standbyKw} onChange={(v) => setCustom({ ...custom, standbyKw: v ?? 0 })} />
            <Num label="滿載耗油量（選填）" unit="L/h" allowEmpty placeholder="依係數估算" value={custom.fuel} onChange={(fuel) => setCustom({ ...custom, fuel })} />
            {(["長", "寬", "高"] as const).map((lab, k) => (
              <Num
                key={lab}
                label={`機組${lab}`}
                unit="mm"
                integer
                value={custom.size[k]}
                onChange={(v) => {
                  const size: [number, number, number] = [...custom.size];
                  size[k] = v ?? 0;
                  setCustom({ ...custom, size });
                }}
              />
            ))}
            <Num label="附油箱（選填）" unit="L" allowEmpty placeholder="無" value={custom.baseTank} onChange={(baseTank) => setCustom({ ...custom, baseTank })} />
          </div>
        )}
        {selected && <SelectedInfo g={selected} />}
      </Card>

      <Card
        title="② 機組四周留設距離與門"
        aside={<SmallButton onClick={() => set({ clear: defaultClearances(settings.opSide) })}>恢復預設（110.6 決議）</SmallButton>}
      >
        <Select<OpSide>
          label="操作面（控制盤側）"
          value={settings.opSide}
          onChange={(opSide) => set({ opSide, clear: defaultClearances(opSide) })}
          options={[
            { value: "long", label: "前側長邊" },
            { value: "end", label: "發電機端" },
          ]}
          className="sm:max-w-xs"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(Object.keys(CLEAR_LABEL) as (keyof Clearances)[]).map((k) => (
            <Num key={k} label={clearLabel(k, settings.opSide)} unit="mm" integer value={settings.clear[k]} onChange={(v) => setClear(k, v ?? 0)} />
          ))}
        </div>
        <p className="text-[0.72rem] leading-relaxed text-muted">{NOTES.clearance}</p>
        <Num
          label={`雙開門寬（建議 ${fmt(suggestDoorWidth(unit.size[1]), 0)}）`}
          unit="mm"
          integer
          allowEmpty
          placeholder={`${suggestDoorWidth(unit.size[1])}`}
          value={settings.doorWidth}
          onChange={(doorWidth) => set({ doorWidth })}
          className="sm:max-w-xs"
        />
        <p className="text-[0.72rem] leading-relaxed text-muted">{NOTES.door}</p>
      </Card>

      <Card title="③ 油箱">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Num label="運轉時數（至少 2）" unit="h" value={settings.hours} onChange={(hours) => set({ hours: hours ?? 0 })} />
          <Select<string>
            label="日用油箱容量"
            value={r.tank.capacity > r.tankSuggested ? String(r.tank.capacity) : "auto"}
            onChange={(v) => set({ tankCapacity: v === "auto" ? null : Number(v) })}
            options={[
              { value: "auto", label: `建議 ${fmt(r.tankSuggested, 0)} L` },
              ...TANKS.filter((t) => t.capacity > r.tankSuggested && t.capacity <= ROOM_TANK_LIMIT).map((t) => ({
                value: String(t.capacity),
                label: `加大 ${fmt(t.capacity, 0)} L（${t.size.join("×")}）`,
              })),
            ]}
          />
          <Select<DikeRule>
            label="堤與油箱距離"
            value={settings.dikeRule}
            onChange={(dikeRule) => set({ dikeRule })}
            options={(["k5", "500"] as const).map((v) => ({ value: v, label: DIKE_RULE_LABEL[v] }))}
          />
          <Num label="防液堤牆厚" unit="mm" integer value={settings.dikeWall} onChange={(dikeWall) => set({ dikeWall: dikeWall ?? 0 })} />
        </div>
        <p className="text-[0.72rem] leading-relaxed text-muted">{NOTES.hours}</p>
        <p className="text-[0.72rem] leading-relaxed text-muted">{NOTES.dike}</p>
        <RefToggle title="消防設備緊急電源時間">
          <SimpleTable heads={["設備", "時間", "條文"]} rows={FIRE_DURATIONS.map((x) => [x.item, x.time, x.cite])} />
          <p className="mt-2 text-[0.68rem] text-muted">出處：{SOURCES.fire}。</p>
        </RefToggle>
      </Card>

      <Card title="④ 進、排氣百葉">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Num label="散熱水箱風量" unit="m³/min" allowEmpty placeholder="依廠商資料" value={settings.radiatorFlow} onChange={(radiatorFlow) => set({ radiatorFlow })} />
          <Num label="燃燒空氣量（選填）" unit="m³/min" allowEmpty placeholder="依廠商資料" value={settings.combustionFlow} onChange={(combustionFlow) => set({ combustionFlow })} />
          <Num label="風管風速（設風管時）" unit="m/s" value={settings.ductVelocity} onChange={(v) => set({ ductVelocity: v ?? 8 })} />
          <Num label="進氣百葉淨開口風速" unit="m/s" value={settings.intakeVelocity} onChange={(v) => set({ intakeVelocity: v ?? 2.5 })} />
          <Num label="排氣百葉淨開口風速" unit="m/s" value={settings.exhaustVelocity} onChange={(v) => set({ exhaustVelocity: v ?? 5 })} />
          <Num label="百葉開口率" unit="%" value={Math.round(settings.freeRatio * 1000) / 10} onChange={(v) => set({ freeRatio: (v ?? 40) / 100 })} />
        </div>
        <p className="text-[0.72rem] leading-relaxed text-muted">{NOTES.louver}</p>
        <RefToggle title="百葉名詞定義">
          <SimpleTable heads={["名詞", "定義", "依據"]} rows={DEFINITIONS.map((d) => [d.term, d.def, d.basis])} />
        </RefToggle>
      </Card>

      {valid ? (
        <Results r={r} projectName={projectName} fileName={fileName} generatedOn={dateStamp(today, "/")} />
      ) : (
        <p className="border border-dashed border-line p-5 text-center text-[0.85rem] text-muted">輸入機組輸出與長、寬後，即顯示檢討結果</p>
      )}
    </div>
  );
}

function CandidateTable({ list, pick, onPick }: { list: GenSet[]; pick: string; onPick: (k: string) => void }) {
  if (list.length === 0) return <p className="border border-dashed border-line p-3 text-[0.8rem] text-muted">型錄無符合需求容量之機型，請改用自訂機組。</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[46rem] border-collapse text-[0.74rem] tabular-nums">
        <thead>
          <tr className="bg-accent-soft text-left">
            {["", "系列", "型號", "引擎", "環保等級", "Standby", "長×寬×高 mm", "重量 kg", "附油箱 L", "耗油 L/h"].map((h, i) => (
              <th key={i} className="border border-line px-2 py-1.5 font-bold whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.map((g) => {
            const k = keyOf(g);
            const on = k === pick;
            return (
              <tr key={k} onClick={() => onPick(k)} className={`cursor-pointer hover:bg-accent-soft/40 ${on ? "bg-accent-soft font-bold" : ""}`}>
                <td className="border border-line px-2 py-1 text-center">
                  <input type="radio" checked={on} onChange={() => onPick(k)} aria-label={`選擇 ${g.model}`} className="accent-[var(--accent)]" />
                </td>
                <td className="border border-line px-2 py-1 whitespace-nowrap">{seriesLabel(seriesOf(g.series))}</td>
                <td className="border border-line px-2 py-1 whitespace-nowrap">{g.model}</td>
                <td className="border border-line px-2 py-1 whitespace-nowrap">{g.engine}</td>
                <td className="border border-line px-2 py-1 whitespace-nowrap">{g.emission || "—"}</td>
                <td className="border border-line px-2 py-1 font-mono whitespace-nowrap">
                  {g.standbyKva} kVA / {g.standbyKw} kW
                </td>
                <td className="border border-line px-2 py-1 font-mono whitespace-nowrap">{g.size!.join("×")}</td>
                <td className="border border-line px-2 py-1 font-mono">{g.weight ?? "—"}</td>
                <td className="border border-line px-2 py-1 font-mono">{g.baseTank ?? "—"}</td>
                <td className="border border-line px-2 py-1 font-mono">{g.fuel ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SelectedInfo({ g }: { g: GenSet }) {
  const s = seriesOf(g.series);
  return (
    <p className="border-l-2 border-accent pl-3 text-[0.75rem] leading-relaxed">
      已選：<b>{seriesLabel(s)}</b> {g.model}（{g.engine}）｜Standby {g.standbyKva} kVA / {g.standbyKw} kW
      {g.primeKw !== null ? `｜Prime ${g.primeKva} kVA / ${g.primeKw} kW` : "｜型錄無 Prime 額定"}｜{g.size!.join(" × ")} mm
      {g.weight ? `｜${fmt(g.weight, 0)} kg` : ""}
      <br />
      <span className="text-muted">
        出處：{CATALOGS[s.vendor]}。{s.note ? `${s.note}。` : ""}
        {NOTES.size}
      </span>
    </p>
  );
}

function Results({ r, projectName, fileName, generatedOn }: { r: GenResult; projectName: string; fileName: string; generatedOn: string }) {
  const drawing = buildDrawing(r);
  const i = r.input;
  return (
    <div className="flex flex-col gap-6">
      <section className="border border-accent bg-accent-soft p-5">
        <span className="eyebrow">檢討結果｜{i.unit.label}</span>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Metric label="機房淨長" value={fmt(r.length, 0)} unit="mm" />
          <Metric label="機房淨寬" value={fmt(r.width, 0)} unit="mm" />
          <Metric label="淨面積" value={fmt(r.area, 1)} unit="m²" strong />
          <Metric label="日用油箱" value={fmt(r.tank.capacity, 0)} unit="L" />
        </div>
        <p className="mt-3 text-[0.78rem]">
          耗油量 {fmt(r.fuelRate, 1)} L/h{r.fuelEstimated ? "（暫定）" : "（型錄）"}・運轉 {fmt(r.hours, 1)} h・日用油箱 {fmt(r.roomTank, 0)} L（管制量{" "}
          {fmt(r.roomMultiple)} 倍）{r.storage > 0 ? `・儲油槽 ${fmt(r.storage, 1)} L` : "・不需儲油槽"}
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[1.05rem] font-extrabold">平面示意圖</h2>
        <div className="border border-line bg-white p-2">
          <GeneratorPlan d={drawing} />
        </div>
        <p className="text-[0.72rem] text-muted">左側為散熱水箱端（排風百葉）；右側為發電機端，設雙開門供機組進出；進風百葉示意於前側牆發電機段；日用油箱與防液堤置於後側長邊、散熱水箱端（排風側）角落，發電機端靠門側留空，可配置電盤。尺寸單位 mm。</p>
      </section>

      {r.warnings.length > 0 && (
        <section className="flex flex-col gap-1.5 border-l-2 border-[var(--phase-r)] pl-3">
          <h2 className="text-[0.95rem] font-extrabold">提醒</h2>
          {r.warnings.map((w) => (
            <p key={w} className="text-[0.8rem]">
              {w}
            </p>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-[1.05rem] font-extrabold">計算式</h2>
        <div className="flex flex-col gap-1 border border-line bg-surface p-4 font-mono text-[0.78rem] leading-relaxed tabular-nums">
          <b className="font-sans">機房</b>
          <span>機房淨長 ＝ {r.lengthLine}</span>
          <span>機房淨寬 ＝ {r.widthLine}</span>
          <span>
            淨面積 ＝ {fmt(r.length / 1000)} × {fmt(r.width / 1000)} ＝ {fmt(r.area, 1)} m²
          </span>
          <span>{doorLine(r)}</span>
          <b className="mt-2 font-sans">油箱</b>
          {fuelLines(r).map((t) => (
            <span key={t}>{t}</span>
          ))}
          {r.exhaust && r.intake && (
            <>
              <b className="mt-2 font-sans">進、排氣百葉</b>
              {louverLines(r).map((t) => (
                <span key={t}>{t}</span>
              ))}
            </>
          )}
        </div>
        <p className="text-[0.72rem] text-muted">{NOTES.fuel}</p>
        <p className="text-[0.72rem] text-muted">
          {NOTES.tank}油箱尺寸：{TANK_SOURCE}。
        </p>
        <p className="text-[0.72rem] text-muted">{NOTES.dike}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[1.05rem] font-extrabold">規劃提醒</h2>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[0.82rem] leading-relaxed">
          {REMINDERS.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[1.05rem] font-extrabold">引用法規與資料</h2>
        <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-[0.82rem] leading-relaxed">
          {SOURCE_LIST.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ol>
      </section>

      <p className="border-t border-dashed border-line pt-4 text-[0.75rem] leading-relaxed text-muted">{DISCLAIMER}</p>

      <PdfSaveButton
        fileName={fileName}
        label="下載檢討結果 PDF"
        build={async () => {
          const [{ pdf }, { default: GeneratorPdf }, { registerPdfFonts }] = await Promise.all([
            import("@react-pdf/renderer"),
            import("@/components/GeneratorPdf"),
            import("@/components/pdfCommon"),
          ]);
          registerPdfFonts(window.location.origin);
          return pdf(<GeneratorPdf r={r} projectName={projectName} generatedOn={generatedOn} />).toBlob();
        }}
      />
    </div>
  );
}

function SimpleTable({ heads, rows }: { heads: string[]; rows: string[][] }) {
  return (
    <table className="w-full min-w-[28rem] border-collapse text-[0.74rem]">
      <thead>
        <tr className="bg-accent-soft text-left">
          {heads.map((h) => (
            <th key={h} className="border border-line px-2 py-1.5 font-bold">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r[0]}>
            {r.map((c, k) => (
              <td key={k} className="border border-line px-2 py-1 align-top">
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RefToggle({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="self-start text-left text-[0.75rem] text-accent hover:underline">
        {open ? "▾" : "▸"} 查看{title}
      </button>
      {open && <div className="overflow-x-auto border border-line bg-background p-3">{children}</div>}
    </div>
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
