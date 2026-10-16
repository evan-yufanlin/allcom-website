"use client";

import { useState, type ReactNode } from "react";
import PdfSaveButton from "@/components/PdfSaveButton";
import { Card, Check as CheckBox, Num, RemoveButton, SmallButton, Text } from "@/components/ToolFields";
import { dateStamp } from "@/lib/dateStamp";
import {
  DEFINITIONS,
  DISCLAIMER,
  LAW_REFS,
  REMINDERS,
  SOURCES,
  calculateVent,
  defaultVentInput,
  fmt,
  type Louver,
  type VentFloor,
  type VentInput,
  type VentResult,
} from "@/lib/parkingVent";

type FloorUI = VentFloor & { id: number };

let nextId = 1;
const newId = () => nextId++;

export default function ParkingVentTool() {
  const [projectName, setProjectName] = useState("");
  const [p, setP] = useState<Omit<VentInput, "floors"> & { floors: FloorUI[] }>(() => ({
    ...defaultVentInput(),
    floors: [
      { id: newId(), label: "B1", floors: 1, area: 0 },
      { id: newId(), label: "B2", floors: 1, area: 0 },
    ],
  }));
  const [today] = useState(() => new Date());
  const set = (patch: Partial<Omit<VentInput, "floors">>) => setP((cur) => ({ ...cur, ...patch }));
  const setFloor = (id: number, patch: Partial<FloorUI>) =>
    setP((cur) => ({ ...cur, floors: cur.floors.map((f) => (f.id === id ? { ...f, ...patch } : f)) }));

  const r = calculateVent(p);
  const ready = r.totalFlow > 0;
  const fileName = `停車場通風_${fmt(r.totalFlow, 0)}CMH-${dateStamp(today, "")}`;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Card title="① 各層停車樓地板面積" aside={<SmallButton onClick={() => setP((c) => ({ ...c, floors: [...c.floors, { id: newId(), label: `B${c.floors.length + 1}`, floors: 1, area: 0 }] }))}>＋ 樓層</SmallButton>}>
        <Text label="工程名稱（選填）" value={projectName} onChange={setProjectName} />
        {p.floors.map((f) => (
          <div key={f.id} className="grid grid-cols-[minmax(0,1fr)_5rem_minmax(0,1.4fr)_auto] gap-2 border-l-2 border-line pl-3">
            <Text label="樓層" value={f.label} onChange={(label) => setFloor(f.id, { label })} />
            <Num label="層數" integer value={f.floors} onChange={(floors) => setFloor(f.id, { floors: floors ?? 1 })} />
            <Num label="每層停車樓地板面積" unit="m²" value={f.area} onChange={(area) => setFloor(f.id, { area: area ?? 0 })} />
            <RemoveButton label="刪除此列" onClick={() => setP((c) => ({ ...c, floors: c.floors.filter((x) => x.id !== f.id) }))} />
          </div>
        ))}
        <p className="text-[0.72rem] leading-relaxed text-muted">樓層由上而下排列（最上列最接近對外排出口）；相同面積之樓層可合併為一列並填層數。</p>
      </Card>

      <Card title="② 設計條件">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Num label="通風量（法規 25 以上）" unit="m³/h·m²" value={p.rate} onChange={(rate) => set({ rate: rate ?? 25 })} />
          <Num label="單台風機風量（選填）" unit="m³/h" value={p.fanFlow} allowEmpty placeholder="依廠商型錄" onChange={(fanFlow) => set({ fanFlow })} />
          <Num label="管道風速" unit="m/s" value={p.ductVelocity} onChange={(ductVelocity) => set({ ductVelocity: ductVelocity ?? 8 })} />
          <Num label="進氣百葉淨開口風速" unit="m/s" value={p.intakeVelocity} onChange={(intakeVelocity) => set({ intakeVelocity: intakeVelocity ?? 2.5 })} />
          <Num label="排氣百葉淨開口風速" unit="m/s" value={p.exhaustVelocity} onChange={(exhaustVelocity) => set({ exhaustVelocity: exhaustVelocity ?? 5 })} />
          <Num
            label="百葉開口率"
            unit="%"
            value={Math.round(p.freeRatio * 1000) / 10}
            onChange={(v) => set({ freeRatio: (v ?? 40) / 100 })}
          />
        </div>
        <CheckBox checked={p.simultaneous} onChange={(simultaneous) => set({ simultaneous })}>
          各層同時運轉（管道與百葉改依累計風量計算）；未勾選時為共用管道間、計時器分時運轉，風量不累計
        </CheckBox>
        <p className="text-[0.72rem] leading-relaxed text-muted">風速、開口率為設計假設值，非法規值，請依實際百葉規格、風機型錄調整。</p>
        <RefToggle title="百葉名詞定義（淨開口風速、表面風速）">
          <DefTable />
        </RefToggle>
      </Card>

      {ready ? (
        <Results r={r} projectName={projectName} fileName={fileName} generatedOn={dateStamp(today, "/")} />
      ) : (
        <p className="border border-dashed border-line p-5 text-center text-[0.85rem] text-muted">輸入停車樓地板面積後，即顯示計算結果</p>
      )}
    </div>
  );
}

function Results({ r, projectName, fileName, generatedOn }: { r: VentResult; projectName: string; fileName: string; generatedOn: string }) {
  const i = r.input;
  const sim = i.simultaneous;
  return (
    <div className="flex flex-col gap-6">
      <section className="border border-accent bg-accent-soft p-5">
        <span className="eyebrow">計算結果｜{sim ? "各層同時運轉" : "共用管道間・分時運轉"}</span>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Metric label="合計通風量" value={fmt(r.totalFlow, 0)} unit="m³/h" />
          <Metric label="管道間（進、排氣各）" value={fmt(r.ductArea)} unit="m²" strong />
          <Metric label="排氣百葉總面積" value={fmt(r.exhaust.grossArea)} unit="m²" />
          <Metric label="進氣百葉總面積" value={fmt(r.intake.grossArea)} unit="m²" />
        </div>
        <p className="mt-3 text-[0.78rem]">
          管道與百葉計算風量：{fmt(r.designFlow, 0)} m³/h（{sim ? "各層合計" : "各層最大值，分時運轉不累計"}）
          {r.totalFans !== null && `；排氣風機、進氣風機各 ${r.totalFans} 台`}
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[1.05rem] font-extrabold">各層通風量</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-[0.78rem] tabular-nums">
            <thead>
              <tr className="bg-accent-soft text-left">
                {["樓層", "層數", "面積 m²", "通風量 m³/h", ...(r.totalFans !== null ? ["每層風機（排／進）"] : []), ...(sim ? ["累計風量 m³/h", "管道段 m²"] : [])].map((h) => (
                  <th key={h} className="border border-line px-2 py-1.5 font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r.rows.map((x, k) => (
                <tr key={k} className={!sim && x.flow === r.maxFlow ? "bg-accent-soft/60 font-bold" : ""}>
                  <td className="border border-line px-2 py-1.5">{x.label || "—"}</td>
                  <td className="border border-line px-2 py-1.5 font-mono">{x.floors}</td>
                  <td className="border border-line px-2 py-1.5 font-mono">{fmt(x.area)}</td>
                  <td className="border border-line px-2 py-1.5 font-mono">
                    {fmt(x.area)} × {i.rate} ＝ {fmt(x.flow, 0)}
                  </td>
                  {r.totalFans !== null && (
                    <td className="border border-line px-2 py-1.5 font-mono">
                      {fmt(x.flow, 0)} ÷ {fmt(i.fanFlow!, 0)} → {x.fans} 台
                    </td>
                  )}
                  {sim && (
                    <>
                      <td className="border border-line px-2 py-1.5 font-mono">{fmt(x.cumulative, 0)}</td>
                      <td className="border border-line px-2 py-1.5 font-mono">{fmt(x.ductArea)}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!sim && <p className="text-[0.72rem] text-muted">框選列為通風量最大之樓層，管道間與百葉依此風量計算。</p>}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[1.05rem] font-extrabold">管道間與百葉</h2>
        <div className="flex flex-col gap-1 border border-line bg-surface p-4 font-mono text-[0.78rem] leading-relaxed tabular-nums">
          <span>
            管道間（進、排氣各一）＝ {fmt(r.designFlow, 0)} ÷ 3600 ÷ {i.ductVelocity} ＝ {fmt(r.ductArea)} m²
          </span>
          <LouverLine name="排氣百葉" q={r.designFlow} l={r.exhaust} ratio={i.freeRatio} />
          <LouverLine name="進氣百葉" q={r.designFlow} l={r.intake} ratio={i.freeRatio} />
        </div>
        <p className="text-[0.72rem] text-muted">管道間面積為風道淨斷面，未含結構、保溫及檢修空間。</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[1.05rem] font-extrabold">提醒</h2>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[0.82rem] leading-relaxed">
          {REMINDERS.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        <RefToggle title="相關法規條文">
          <div className="flex flex-col gap-2 text-[0.76rem] leading-relaxed">
            {LAW_REFS.map((x) => (
              <p key={x.cite}>
                <b>{x.cite}</b>：{x.text}
              </p>
            ))}
            <span className="text-[0.68rem] text-muted">
              出處：{SOURCES.equipment}；{SOURCES.design}。本工具不判定機械或自然通風，條文僅供參考。
            </span>
          </div>
        </RefToggle>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[1.05rem] font-extrabold">引用法規與資料</h2>
        <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-[0.82rem] leading-relaxed">
          <li>{SOURCES.equipment}：第 97 條、第 102 條</li>
          <li>{SOURCES.design}：第 62 條、第 138 條、第 139 條、第 144 條</li>
          <li>{SOURCES.louver}：P.1、P.3（百葉淨開口面積、淨開口風速）</li>
        </ol>
      </section>

      <p className="border-t border-dashed border-line pt-4 text-[0.75rem] leading-relaxed text-muted">{DISCLAIMER}</p>

      <PdfSaveButton
        fileName={fileName}
        label="下載計算書 PDF"
        build={async () => {
          const [{ pdf }, { default: ParkingVentPdf }, { registerPdfFonts }] = await Promise.all([
            import("@react-pdf/renderer"),
            import("@/components/ParkingVentPdf"),
            import("@/components/pdfCommon"),
          ]);
          registerPdfFonts(window.location.origin);
          return pdf(<ParkingVentPdf r={r} projectName={projectName} generatedOn={generatedOn} />).toBlob();
        }}
      />
    </div>
  );
}

function LouverLine({ name, q, l, ratio }: { name: string; q: number; l: Louver; ratio: number }) {
  return (
    <span>
      {name}：淨開口 {fmt(q, 0)} ÷ 3600 ÷ {l.velocity} ＝ {fmt(l.freeArea)} m²；總面積 ÷ {fmt(ratio * 100, 1)}% ＝ <b>{fmt(l.grossArea)} m²</b>（表面風速{" "}
      {fmt(l.faceVelocity)} m/s）
    </span>
  );
}

function DefTable() {
  return (
    <table className="w-full min-w-[32rem] border-collapse text-[0.74rem]">
      <thead>
        <tr className="bg-accent-soft text-left">
          {["名詞", "定義", "依據"].map((h) => (
            <th key={h} className="border border-line px-2 py-1.5 font-bold">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {DEFINITIONS.map((d) => (
          <tr key={d.term}>
            <td className="border border-line px-2 py-1 align-top font-bold">{d.term}</td>
            <td className="border border-line px-2 py-1 align-top">{d.def}</td>
            <td className="border border-line px-2 py-1 align-top text-muted">{d.basis}</td>
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
