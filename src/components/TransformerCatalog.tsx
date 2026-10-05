"use client";

import { useState } from "react";
import { Card, Check as CheckBox, Select } from "@/components/ToolFields";
import {
  CAPACITIES,
  CATALOGS,
  KIND_NAME,
  ROWS,
  SECONDARY_NAME,
  SERIES,
  type Kind,
  type Secondary,
  type SeriesId,
  type SeriesInfo,
  type TransformerRow,
} from "@/data/transformers";

type View = "series" | "compare";
type OilForm = "standard" | "duct";

const n = (v: number) => v.toLocaleString("zh-TW");
const dims = (s?: [number, number, number]) => (s ? s.map(n).join(" × ") : "—");
const opt = (v: number | string | undefined, digits?: number) =>
  v === undefined ? "—" : typeof v === "number" ? v.toLocaleString("zh-TW", { maximumFractionDigits: digits ?? 2 }) : v;

function sizeOf(r: TransformerRow, form: OilForm) {
  return form === "duct" && r.ductSize ? r.ductSize : r.size;
}
function weightOf(r: TransformerRow, form: OilForm) {
  return form === "duct" && r.ductWeight ? r.ductWeight : r.weight;
}

export default function TransformerCatalog() {
  const [kva, setKva] = useState(1000);
  const [secondary, setSecondary] = useState<Secondary>("380Y");
  const [kind, setKind] = useState<"all" | Kind>("all");
  const [picked, setPicked] = useState<SeriesId[]>([]);
  const [view, setView] = useState<View>("series");
  const [form, setForm] = useState<OilForm>("standard");

  const series = SERIES.filter((s) => (kind === "all" || s.kind === kind) && (picked.length === 0 || picked.includes(s.id)));
  const rowsOf = (s: SeriesInfo) => ROWS.filter((r) => r.series === s.id && r.secondary === secondary);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <Source />

      <Card title="查詢條件">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select<string>
            label="① 容量"
            value={String(kva)}
            onChange={(v) => setKva(Number(v))}
            options={CAPACITIES.map((c) => ({ value: String(c), label: `${n(c)} kVA` }))}
          />
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-[0.72rem] text-muted">② 一次側</span>
            <select className="w-full min-w-0 border border-line bg-background px-2 py-1.5 text-[0.85rem] outline-none focus:border-accent" defaultValue="hv">
              <option value="hv">高壓 22.8/11.4 kV</option>
              <option value="lv" disabled>
                低壓（第二版提供）
              </option>
            </select>
          </label>
          <Select<Secondary>
            label="③ 二次側"
            value={secondary}
            onChange={setSecondary}
            options={(["380Y", "220"] as const).map((s) => ({ value: s, label: SECONDARY_NAME[s] }))}
          />
        </div>
        <div className="flex flex-col gap-2.5 border-t border-line pt-3">
          <span className="text-[0.72rem] text-muted">選填條件</span>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Select<"all" | Kind>
              label="型式"
              value={kind}
              onChange={(k) => {
                setKind(k);
                setPicked([]);
              }}
              options={[
                { value: "all", label: "全部" },
                { value: "oil", label: "油浸式" },
                { value: "cast", label: "模鑄式" },
              ]}
            />
            <Select<OilForm>
              label="油浸式外形"
              value={form}
              onChange={setForm}
              options={[
                { value: "standard", label: "標準型" },
                { value: "duct", label: "導口型" },
              ]}
            />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {SERIES.filter((s) => kind === "all" || s.kind === kind).map((s) => (
              <CheckBox
                key={s.id}
                checked={picked.includes(s.id)}
                onChange={(on) => setPicked((cur) => (on ? [...cur, s.id] : cur.filter((x) => x !== s.id)))}
              >
                {KIND_NAME[s.kind]} {s.name}
              </CheckBox>
            ))}
          </div>
          <span className="text-[0.7rem] text-muted">系列未勾選時顯示全部。</span>
        </div>
      </Card>

      <div className="flex gap-1.5" role="tablist">
        {(
          [
            ["series", "同型式・各容量"],
            ["compare", "同容量・各型式比較"],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={view === v}
            onClick={() => setView(v)}
            className={`border px-3.5 py-1.5 text-[0.85rem] ${
              view === v ? "border-accent bg-accent-soft font-bold text-accent" : "border-line text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "series" ? (
        <div className="flex flex-col gap-6">
          {series.map((s) => (
            <SeriesTable key={s.id} s={s} rows={rowsOf(s)} kva={kva} form={form} />
          ))}
        </div>
      ) : (
        <Compare series={series} secondary={secondary} kva={kva} form={form} />
      )}

      <Notes />
    </div>
  );
}

function Source() {
  return (
    <div className="flex flex-col gap-1.5 border-l-2 border-accent bg-surface p-4 text-[0.8rem] leading-relaxed">
      <span className="font-bold">資料來源：參考士林電機型錄</span>
      <span>
        {CATALOGS.oil}；{CATALOGS.cast}
      </span>
      <span className="text-[0.75rem] text-muted">
        數值依型錄 2019.05 版整理，最新規格以廠商為準。本版收錄一次側高壓（22.8/11.4 kV）機種；3～100 kVA 小容量及低壓型號將於第二版提供。
      </span>
    </div>
  );
}

function SeriesHead({ s }: { s: SeriesInfo }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex flex-wrap items-baseline gap-x-2.5">
        <span className="bg-accent-soft px-2 py-0.5 font-mono text-[0.62rem] text-accent">{KIND_NAME[s.kind]}</span>
        <h2 className="text-[1rem] font-extrabold">{s.name}</h2>
      </div>
      <span className="text-[0.7rem] text-muted">外形：{s.sizeNote}</span>
      {s.note && <span className="text-[0.7rem] text-muted">※ {s.note}</span>}
    </div>
  );
}

function SeriesTable({ s, rows, kva, form }: { s: SeriesInfo; rows: TransformerRow[]; kva: number; form: OilForm }) {
  const oil = s.kind === "oil";
  const has = rows.some((r) => r.kva === kva);
  const heads = [
    "容量 kVA",
    `外形 寬×深×高（mm）${oil ? (form === "duct" ? "・導口型" : "・標準型") : ""}`,
    "重量 kg",
    "效率 %",
    "阻抗 %",
    "噪音 dB",
    "全損失 W",
    oil ? "油量 L" : "配電箱 寬×深×高（mm）・重量 kg",
    "型錄頁碼",
  ];

  return (
    <section className="flex flex-col gap-2">
      <SeriesHead s={s} />
      {!has && <p className="text-[0.75rem] text-[var(--phase-r)]">此系列無 {n(kva)} kVA 機種。</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] border-collapse text-[0.76rem] tabular-nums">
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
            {rows.map((r) => {
              const hit = r.kva === kva;
              return (
                <tr key={r.kva} className={hit ? "bg-accent-soft/60 font-bold text-accent outline-2 -outline-offset-2 outline-accent" : ""}>
                  <td className="border border-line px-2 py-1.5 font-mono whitespace-nowrap">
                    {hit ? "▶ " : ""}
                    {n(r.kva)}
                  </td>
                  <td className="border border-line px-2 py-1.5 font-mono whitespace-nowrap">{dims(sizeOf(r, form))}</td>
                  <td className="border border-line px-2 py-1.5 font-mono whitespace-nowrap">
                    {n(weightOf(r, form))}
                    {r.weightNote && <span className="ml-0.5 text-[var(--phase-r)]" title={r.weightNote}>※</span>}
                  </td>
                  <td className="border border-line px-2 py-1.5 font-mono">{opt(r.eff)}</td>
                  <td className="border border-line px-2 py-1.5 font-mono whitespace-nowrap">{opt(r.imp)}</td>
                  <td className="border border-line px-2 py-1.5 font-mono">{opt(r.noise)}</td>
                  <td className="border border-line px-2 py-1.5 font-mono">{opt(r.fullLoss)}</td>
                  <td className="border border-line px-2 py-1.5 font-mono whitespace-nowrap">
                    {oil ? opt(r.oil) : r.box ? `${dims(r.box)}・${n(r.boxWeight!)}` : <span className="font-sans text-muted">型錄未列，請洽廠商</span>}
                  </td>
                  <td className="border border-line px-2 py-1.5 whitespace-nowrap text-muted">{r.pages}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.some((r) => r.weightNote) && (
        <p className="text-[0.7rem] text-[var(--phase-r)]">※ {rows.find((r) => r.weightNote)!.weightNote}</p>
      )}
    </section>
  );
}

function Compare({ series, secondary, kva, form }: { series: SeriesInfo[]; secondary: Secondary; kva: number; form: OilForm }) {
  const cols = series
    .map((s) => ({ s, r: ROWS.find((r) => r.series === s.id && r.secondary === secondary && r.kva === kva) }))
    .filter((c): c is { s: SeriesInfo; r: TransformerRow } => c.r !== undefined);
  const missing = series.filter((s) => !cols.some((c) => c.s.id === s.id));

  if (cols.length === 0)
    return <p className="border border-dashed border-line p-5 text-center text-[0.85rem] text-muted">所選條件無 {n(kva)} kVA 機種</p>;

  const items: { label: string; get: (c: { s: SeriesInfo; r: TransformerRow }) => React.ReactNode }[] = [
    { label: "型式", get: (c) => KIND_NAME[c.s.kind] },
    { label: "外形 寬×深×高（mm）", get: (c) => dims(sizeOf(c.r, form)) },
    {
      label: "重量 kg",
      get: (c) => (
        <>
          {n(weightOf(c.r, form))}
          {c.r.weightNote && <span className="block font-sans text-[0.68rem] font-normal text-[var(--phase-r)]">※ {c.r.weightNote}</span>}
        </>
      ),
    },
    { label: "效率 %", get: (c) => opt(c.r.eff) },
    { label: "阻抗 %", get: (c) => opt(c.r.imp) },
    { label: "噪音 dB", get: (c) => opt(c.r.noise) },
    { label: "全損失 W", get: (c) => opt(c.r.fullLoss) },
    { label: "無載電流 %", get: (c) => opt(c.r.nlc) },
    { label: "油量 L", get: (c) => (c.s.kind === "oil" ? opt(c.r.oil) : "—") },
    {
      label: "配電箱 寬×深×高（mm）",
      get: (c) =>
        c.s.kind === "oil" ? "—" : c.r.box ? dims(c.r.box) : <span className="font-sans text-muted">型錄未列，請洽廠商</span>,
    },
    { label: "配電箱重量 kg", get: (c) => (c.r.boxWeight ? n(c.r.boxWeight) : "—") },
    { label: "型錄頁碼", get: (c) => <span className="font-sans text-muted">{c.r.pages}</span> },
  ];

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-[1rem] font-extrabold">
        {n(kva)} kVA・高壓 22.8/11.4 kV → {SECONDARY_NAME[secondary]}
      </h2>
      {cols.length > 1 && <span className="text-[0.7rem] text-muted sm:hidden">共 {cols.length} 種型式，表格可左右滑動 →</span>}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[0.76rem] tabular-nums" style={{ minWidth: `${10 + cols.length * 9}rem` }}>
          <thead>
            <tr className="bg-accent-soft text-left">
              <th className="sticky left-0 border border-line bg-accent-soft px-2 py-1.5 font-bold">項目</th>
              {cols.map((c) => (
                <th key={c.s.id} className="border border-line px-2 py-1.5 font-bold">
                  {c.s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.label}>
                <td className="sticky left-0 border border-line bg-surface px-2 py-1.5 font-bold whitespace-nowrap">{it.label}</td>
                {cols.map((c) => (
                  <td key={c.s.id} className="border border-line px-2 py-1.5 font-mono">
                    {it.get(c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {missing.length > 0 && (
        <p className="text-[0.72rem] text-muted">無 {n(kva)} kVA 機種：{missing.map((s) => s.name).join("、")}</p>
      )}
      {cols.some((c) => c.s.note) && (
        <ul className="flex flex-col gap-0.5 text-[0.7rem] text-muted">
          {cols
            .filter((c) => c.s.note)
            .map((c) => (
              <li key={c.s.id}>
                ※ {c.s.name}：{c.s.note}
              </li>
            ))}
        </ul>
      )}
    </section>
  );
}

function Notes() {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-[1rem] font-extrabold">說明</h2>
      <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[0.8rem] leading-relaxed text-muted">
        <li>外形尺寸僅列最外長、寬、高。油浸式標準型高度為本體 ZS 加高壓套管 ZH；導口型為型錄 XD × Y × Z。</li>
        <li>油浸式型錄未列各機種噪音值；模鑄式型錄未列效率。型錄未列者以「—」表示。</li>
        <li>油浸式阻抗電壓型錄以範圍表示；特性值公差依 IEC、CNS 規定。</li>
        <li>DI 系列與 DH 系列之特性值型錄共用同一張特性表（型錄 P.10）。</li>
        <li>變電站空間檢討時，另應考慮維修通道、對地絕緣距離及通風等需求。</li>
      </ul>
    </section>
  );
}
