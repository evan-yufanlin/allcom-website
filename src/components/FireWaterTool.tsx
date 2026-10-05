"use client";

import { useState, type ReactNode } from "react";
import PdfSaveButton from "@/components/PdfSaveButton";
import { Card, Check as CheckBox, Num, RemoveButton, Select, SmallButton, Text } from "@/components/ToolFields";
import { dateStamp } from "@/lib/dateStamp";
import {
  ASSUMPTIONS,
  BASIS_NAME,
  CLAUSE_TEXT,
  DISCLAIMER,
  FOAM_RATE,
  HEAD_FLOW,
  HINTS,
  INDOOR_FLOW,
  NEXT_VERSION_NOTE,
  REMINDERS,
  calculateFireWater,
  references,
  defaultFireInput,
  effectiveDepth,
  fmt,
  type FireInput,
  type FireResult,
  type FlowBasis,
  type FoamAgent,
  type HeadKind,
  type HydrantKind,
  type Pool,
  type ReservoirClause,
  type SprinklerZone,
  type Step,
} from "@/lib/fireWater";

type ZoneUI = SprinklerZone & { id: number };
type PoolUI = Pool & { id: number };
type InputUI = Omit<FireInput, "sprinkler" | "pools"> & {
  sprinkler: { on: boolean; zones: ZoneUI[] };
  pools: PoolUI[];
};

let nextId = 1;
const newId = () => nextId++;

const HEAD_ORDER: HeadKind[] = ["general", "rack", "small", "side"];

function newZone(n: number): ZoneUI {
  return { id: newId(), name: n === 1 ? "停車空間" : `區域 ${n}`, head: "general", heads: 0, dry: false };
}

export default function FireWaterTool() {
  const [projectName, setProjectName] = useState("");
  const [p, setP] = useState<InputUI>(() => {
    const d = defaultFireInput();
    return { ...d, sprinkler: { on: false, zones: [newZone(1)] }, pools: [] };
  });
  const [today] = useState(() => new Date());

  const result = calculateFireWater(p);
  const set = <K extends keyof InputUI>(k: K, patch: Partial<InputUI[K]>) =>
    setP((cur) => ({ ...cur, [k]: { ...(cur[k] as object), ...patch } }));
  const setZone = (id: number, patch: Partial<ZoneUI>) =>
    setP((cur) => ({
      ...cur,
      sprinkler: { ...cur.sprinkler, zones: cur.sprinkler.zones.map((z) => (z.id === id ? { ...z, ...patch } : z)) },
    }));
  const setPool = (id: number, patch: Partial<PoolUI>) =>
    setP((cur) => ({ ...cur, pools: cur.pools.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));

  const anyOn = p.indoor.on || p.outdoor.on || p.sprinkler.on || p.foam.on || p.reservoir.on;
  const eff = effectiveDepth(p.poolSpec);
  const fileName = `消防水池容量檢討_${fmt(result.required)}m3-${dateStamp(today, "")}`;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Card title="① 基本資料">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Text label="工程名稱（選填）" value={projectName} onChange={setProjectName} className="sm:col-span-2" />
          <Select<FlowBasis>
            label="流量基準"
            value={p.basis}
            onChange={(basis) => setP((cur) => ({ ...cur, basis }))}
            options={[
              { value: "pump", label: "幫浦出水量（實務，較保守）" },
              { value: "legal", label: "法定放水量" },
            ]}
          />
        </div>
        <p className="text-[0.72rem] leading-relaxed text-muted">
          幫浦出水量：室內消防栓 150／90、室外消防栓 400、撒水頭 90／130／60 L/min；法定放水量：130／80、350、80／114／50 L/min。
        </p>
      </Card>

      <Card title="② 勾選本案設置之消防系統">
        <System
          on={p.indoor.on}
          onToggle={(on) => set("indoor", { on })}
          title="室內消防栓"
          hint="最多樓層消防栓（2 支以上以 2 支計）× 20 分鐘"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select<HydrantKind>
              label="種類"
              value={p.indoor.kind}
              onChange={(kind) => set("indoor", { kind })}
              options={(["first", "second"] as const).map((k) => ({
                value: k,
                label: `${INDOOR_FLOW[k].name}（${INDOOR_FLOW[k][p.basis]} L/min）`,
              }))}
            />
          </div>
          <CheckBox checked={p.indoor.single} onChange={(single) => set("indoor", { single })}>
            最多樓層僅設 1 支消防栓
          </CheckBox>
          <Hint>{HINTS.indoorFirst}</Hint>
          <Hint>{HINTS.indoorFlow}</Hint>
        </System>

        <System on={p.outdoor.on} onToggle={(on) => set("outdoor", { on })} title="室外消防栓" hint="2 支 × 30 分鐘">
          <Hint>{HINTS.outdoor}</Hint>
        </System>

        <System
          on={p.sprinkler.on}
          onToggle={(on) => set("sprinkler", { on })}
          title="自動撒水設備"
          hint="各區域分別計算，取最大值"
        >
          {p.sprinkler.zones.map((z, i) => {
            const zr = result.zones[i];
            return (
              <div
                key={z.id}
                className="grid grid-cols-2 gap-2 border-l-2 border-line pl-3 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.5fr)_minmax(0,0.8fr)_auto_auto]"
              >
                <Text label="區域名稱" value={z.name} onChange={(name) => setZone(z.id, { name })} className="col-span-2 sm:col-span-1" />
                <Select<HeadKind>
                  label="撒水頭種類"
                  value={z.head}
                  onChange={(head) => setZone(z.id, { head })}
                  options={HEAD_ORDER.map((h) => ({ value: h, label: `${HEAD_FLOW[h].name}（${HEAD_FLOW[h][p.basis]}）` }))}
                />
                <Num label="撒水頭數" unit="個" integer value={z.heads} onChange={(heads) => setZone(z.id, { heads: heads ?? 0 })} />
                <div className="flex items-end pb-1.5">
                  <CheckBox checked={z.dry} onChange={(dry) => setZone(z.id, { dry })}>
                    乾式／預動式
                  </CheckBox>
                </div>
                {p.sprinkler.zones.length > 1 ? (
                  <RemoveButton
                    label="刪除此區域"
                    onClick={() =>
                      setP((cur) => ({ ...cur, sprinkler: { ...cur.sprinkler, zones: cur.sprinkler.zones.filter((x) => x.id !== z.id) } }))
                    }
                  />
                ) : (
                  <span className="hidden sm:block" />
                )}
                {zr && zr.heads > 0 && (
                  <span className="col-span-2 font-mono text-[0.72rem] text-muted tabular-nums sm:col-span-5">
                    {zr.flow} L/min × {zr.countedHeads} 個{zr.dry ? `（${zr.heads} × 1.5）` : ""} × 20 min ＝ {fmt(zr.m3)} m³
                    {zr.max && result.zones.length > 1 && <span className="ml-1.5 font-sans font-bold text-accent">← 最大</span>}
                  </span>
                )}
              </div>
            );
          })}
          <div>
            <SmallButton
              onClick={() =>
                setP((cur) => ({ ...cur, sprinkler: { ...cur.sprinkler, zones: [...cur.sprinkler.zones, newZone(cur.sprinkler.zones.length + 1)] } }))
              }
            >
              ＋ 新增區域
            </SmallButton>
          </div>
          <Hint>{HINTS.sprinklerHeads}</Hint>
          <Hint>{HINTS.sprinklerDry}</Hint>
        </System>

        <System
          on={p.foam.on}
          onToggle={(on) => set("foam", { on })}
          title="泡沫滅火設備（固定式泡沫噴頭）"
          hint="最大放射區域 × 20 分鐘 × 1.2"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Num label="最大放射區域面積（50～100）" unit="m²" value={p.foam.area} onChange={(area) => set("foam", { area: area ?? 0 })} />
            <Select<FoamAgent>
              label="泡沫原液"
              value={p.foam.agent}
              onChange={(agent) => set("foam", { agent })}
              options={(Object.keys(FOAM_RATE) as FoamAgent[]).map((k) => ({
                value: k,
                label: `${FOAM_RATE[k].name}（${FOAM_RATE[k].rate} L/min・m²）`,
              }))}
            />
            <Num label="配管充滿量" unit="m³" value={p.foam.pipeFill} onChange={(pipeFill) => set("foam", { pipeFill: pipeFill ?? 0 })} />
          </div>
          {(p.foam.area < 50 || p.foam.area > 100) && p.foam.area > 0 && (
            <p className="text-[0.72rem] text-[var(--phase-r)]">放射區域應在 50～100 m² 之間（第75條）。</p>
          )}
          <Hint>{HINTS.foamArea}</Hint>
          <Hint>{HINTS.foamTotal}</Hint>
        </System>

        <System
          on={p.reservoir.on}
          onToggle={(on) => set("reservoir", { on })}
          title="消防專用蓄水池"
          hint="第27條、第185條"
        >
          <Select<string>
            label="適用條款（第27條）"
            value={String(p.reservoir.clause)}
            onChange={(c) => set("reservoir", { clause: Number(c) as ReservoirClause })}
            options={([1, 2, 3] as const).map((c) => ({ value: String(c), label: CLAUSE_TEXT[c] }))}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Num label="第一層＋第二層樓地板面積" unit="m²" value={p.reservoir.floor12} onChange={(floor12) => set("reservoir", { floor12: floor12 ?? 0 })} />
            <Num label="總樓地板面積" unit="m²" value={p.reservoir.total} onChange={(total) => set("reservoir", { total: total ?? 0 })} />
            <Select<string>
              label="設置方式"
              value={p.reservoir.shared ? "shared" : "separate"}
              onChange={(v) => set("reservoir", { shared: v === "shared" })}
              options={[
                { value: "shared", label: "與消防水池共用（併入合計）" },
                { value: "separate", label: "獨立設置（另列）" },
              ]}
            />
          </div>
          {result.reservoir && (
            <p className="font-mono text-[0.72rem] text-muted tabular-nums">
              第一、三款：{fmt(result.reservoir.byFloor12)} m³｜第二款：{fmt(result.reservoir.byTotal)} m³｜本案採 {fmt(result.reservoir.m3)} m³
            </p>
          )}
          <Hint>{HINTS.reservoirFloor}</Hint>
          <Hint>{HINTS.reservoirDepth}</Hint>
        </System>
      </Card>

      <Card
        title="③ 實設水池（選填，用於有效水量檢核）"
        aside={
          <SmallButton
            onClick={() =>
              setP((cur) => ({
                ...cur,
                pools: [...cur.pools, { id: newId(), label: `消防水池 ${cur.pools.length + 1}`, area: 0, depth: null, count: 1 }],
              }))
            }
          >
            ＋ 水池
          </SmallButton>
        }
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Num label="池高" unit="m" value={p.poolSpec.height} onChange={(height) => set("poolSpec", { height: height ?? 0 })} />
          <Num label="底部（底閥座）" unit="m" value={p.poolSpec.bottom} onChange={(bottom) => set("poolSpec", { bottom: bottom ?? 0 })} />
          <Num label="吸水管徑 D" unit="mm" value={p.poolSpec.suction} onChange={(suction) => set("poolSpec", { suction: suction ?? 0 })} />
          <Num label="頂部" unit="m" value={p.poolSpec.top} onChange={(top) => set("poolSpec", { top: top ?? 0 })} />
        </div>
        <p className="font-mono text-[0.75rem] tabular-nums">
          有效高度 ＝ {fmt(p.poolSpec.height, 2)} − {fmt(p.poolSpec.bottom, 2)} − {fmt(eff.suctionCm / 100, 2)}（1.65D）−{" "}
          {fmt(p.poolSpec.top, 2)} ＝ <span className="font-bold text-accent">{fmt(eff.depth, 2)} m</span>
        </p>
        <Hint>{HINTS.pools}</Hint>
        {p.pools.map((x) => (
          <div
            key={x.id}
            className="grid grid-cols-2 gap-2 border-l-2 border-line pl-3 sm:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))_auto]"
          >
            <Text label="名稱／位置" value={x.label} onChange={(label) => setPool(x.id, { label })} className="col-span-2 sm:col-span-1" />
            <Num label="面積" unit="m²" value={x.area} onChange={(area) => setPool(x.id, { area: area ?? 0 })} />
            <Num
              label="有效高度（空白採試算值）"
              unit="m"
              value={x.depth}
              allowEmpty
              placeholder={fmt(eff.depth, 2)}
              onChange={(depth) => setPool(x.id, { depth })}
            />
            <Num label="座數" integer value={x.count} onChange={(count) => setPool(x.id, { count: count ?? 0 })} />
            <RemoveButton label="刪除此列" onClick={() => setP((cur) => ({ ...cur, pools: cur.pools.filter((y) => y.id !== x.id) }))} />
          </div>
        ))}
      </Card>

      {anyOn ? (
        <Results result={result} projectName={projectName} fileName={fileName} generatedOn={dateStamp(today, "/")} />
      ) : (
        <p className="border border-dashed border-line p-5 text-center text-[0.85rem] text-muted">勾選消防系統後，即顯示計算結果</p>
      )}
    </div>
  );
}

function System({
  on,
  onToggle,
  title,
  hint,
  children,
}: {
  on: boolean;
  onToggle: (v: boolean) => void;
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-2.5 border p-3 ${on ? "border-accent" : "border-line"}`}>
      <label className="flex cursor-pointer flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <span className="flex items-center gap-2">
          <input type="checkbox" checked={on} onChange={(e) => onToggle(e.target.checked)} className="accent-[var(--accent)]" />
          <span className="text-[0.88rem] font-bold">{title}</span>
        </span>
        <span className="text-[0.72rem] text-muted">{hint}</span>
      </label>
      {on && children}
    </div>
  );
}

function Hint({ children }: { children: ReactNode }) {
  return <p className="text-[0.72rem] leading-relaxed text-muted">{children}</p>;
}

// ---- 結果 ----

function Results({
  result: r,
  projectName,
  fileName,
  generatedOn,
}: {
  result: FireResult;
  projectName: string;
  fileName: string;
  generatedOn: string;
}) {
  const refs = references(r);

  return (
    <div className="flex flex-col gap-6">
      <section className="border border-accent bg-accent-soft p-5">
        <span className="eyebrow">計算結果｜流量基準：{BASIS_NAME[r.input.basis]}</span>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Metric label="消防水池應設容量" value={fmt(r.required)} unit="m³" strong />
          {r.separate !== null && <Metric label="消防專用蓄水池（獨立）" value={fmt(r.separate)} unit="m³" />}
          {r.roofTank && <Metric label="屋頂水箱" value={fmt(r.roofTank.m3)} unit="m³" />}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[1.05rem] font-extrabold">所須水源</h2>
        <SourceTable r={r} />
        {r.zones.length > 1 && <ZoneTable r={r} />}
      </section>

      {r.reservoir && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[1.05rem] font-extrabold">消防專用蓄水池</h2>
          <StepBox step={r.reservoir.step} />
        </section>
      )}

      {r.pools.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[1.05rem] font-extrabold">實設有效水量檢核</h2>
          <PoolTable r={r} />
        </section>
      )}

      {r.roofTank && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[1.05rem] font-extrabold">屋頂水箱</h2>
          <StepBox step={r.roofTank.step} />
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-[1.05rem] font-extrabold">設置提醒</h2>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[0.82rem] leading-relaxed">
          {REMINDERS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <p className="text-[0.72rem] text-muted/60">{NEXT_VERSION_NOTE}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[1.05rem] font-extrabold">適用範圍與說明</h2>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[0.82rem] leading-relaxed text-muted">
          {ASSUMPTIONS.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[1.05rem] font-extrabold">引用法規</h2>
        <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-[0.82rem] leading-relaxed">
          {refs.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ol>
      </section>

      <p className="border-t border-dashed border-line pt-4 text-[0.75rem] leading-relaxed text-muted">{DISCLAIMER}</p>

      <PdfSaveButton
        fileName={fileName}
        label="下載計算書 PDF"
        build={async () => {
          const [{ pdf }, { default: FireWaterPdf }, { registerPdfFonts }] = await Promise.all([
            import("@react-pdf/renderer"),
            import("@/components/FireWaterPdf"),
            import("@/components/pdfCommon"),
          ]);
          registerPdfFonts(window.location.origin);
          return pdf(<FireWaterPdf result={r} projectName={projectName} generatedOn={generatedOn} references={refs} />).toBlob();
        }}
      />
    </div>
  );
}

function SourceTable({ r }: { r: FireResult }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[0.78rem]">
        <thead>
          <tr className="bg-accent-soft text-left">
            <th className="border border-line px-2.5 py-2 font-bold">系統</th>
            <th className="border border-line px-2.5 py-2 font-bold">算式</th>
            <th className="border border-line px-2.5 py-2 text-right font-bold">水源</th>
          </tr>
        </thead>
        <tbody>
          {r.lines.map((l) => (
            <tr key={l.key}>
              <td className="border border-line px-2.5 py-2 align-top">
                <span className="font-bold">{l.name}</span>
                <span className="block text-[0.68rem] text-muted">{l.cite}</span>
              </td>
              <td className="border border-line px-2.5 py-2 align-top font-mono tabular-nums">{l.formula}</td>
              <td className="border border-line px-2.5 py-2 text-right align-top font-mono whitespace-nowrap tabular-nums">{fmt(l.m3)} m³</td>
            </tr>
          ))}
          <tr className="bg-accent-soft/60">
            <td className="border border-line px-2.5 py-2 font-bold" colSpan={2}>
              所須水源合計（消防水池應設容量）
            </td>
            <td className="border border-line px-2.5 py-2 text-right font-mono font-bold whitespace-nowrap text-accent tabular-nums">
              {fmt(r.required)} m³
            </td>
          </tr>
          {r.separate !== null && (
            <tr>
              <td className="border border-line px-2.5 py-2" colSpan={2}>
                消防專用蓄水池（獨立設置，另列）
              </td>
              <td className="border border-line px-2.5 py-2 text-right font-mono whitespace-nowrap tabular-nums">{fmt(r.separate)} m³</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ZoneTable({ r }: { r: FireResult }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="text-[0.85rem] font-bold">撒水各區域（取最大值）</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[0.76rem]">
          <thead>
            <tr className="text-left">
              {["區域", "撒水頭種類", "算式", "水源"].map((h) => (
                <th key={h} className="border-b border-line px-2 py-1.5 font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {r.zones.map((z, i) => (
              <tr key={i} className={z.max ? "bg-accent-soft/60 font-bold" : "text-muted"}>
                <td className="border-b border-line px-2 py-1.5">
                  {z.name || "—"}
                  {z.max && <span className="ml-1.5 bg-accent px-1.5 py-0.5 text-[0.62rem] text-white">最大</span>}
                </td>
                <td className="border-b border-line px-2 py-1.5">{HEAD_FLOW[z.head].name}</td>
                <td className="border-b border-line px-2 py-1.5 font-mono tabular-nums">
                  {z.flow} × {z.countedHeads}
                  {z.dry ? `（${z.heads} × 1.5）` : ""} × 20
                </td>
                <td className="border-b border-line px-2 py-1.5 text-right font-mono tabular-nums">{fmt(z.m3)} m³</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PoolTable({ r }: { r: FireResult }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[0.78rem]">
          <thead>
            <tr className="bg-accent-soft text-left">
              {["水池", "面積", "有效高度", "座數", "容量"].map((h) => (
                <th key={h} className="border border-line px-2.5 py-2 font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {r.pools.map((x, i) => (
              <tr key={i}>
                <td className="border border-line px-2.5 py-1.5">{x.label || "—"}</td>
                <td className="border border-line px-2.5 py-1.5 font-mono tabular-nums">{fmt(x.area, 2)} m²</td>
                <td className="border border-line px-2.5 py-1.5 font-mono tabular-nums">
                  {fmt(x.usedDepth, 2)} m{x.depth === null ? <span className="ml-1 font-sans text-[0.68rem] text-muted">試算</span> : ""}
                </td>
                <td className="border border-line px-2.5 py-1.5 font-mono tabular-nums">{x.count}</td>
                <td className="border border-line px-2.5 py-1.5 text-right font-mono tabular-nums">{fmt(x.m3, 2)} m³</td>
              </tr>
            ))}
            <tr className="bg-accent-soft/60 font-bold">
              <td className="border border-line px-2.5 py-1.5" colSpan={4}>
                合計
              </td>
              <td className="border border-line px-2.5 py-1.5 text-right font-mono tabular-nums">{fmt(r.poolTotal, 2)} m³</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-[0.85rem]">
        實設有效水量 <span className="font-mono font-bold tabular-nums">{fmt(r.poolTotal, 2)} m³</span>
        {r.poolOk === null ? (
          <span className="text-muted">（輸入水池尺寸並勾選系統後判定）</span>
        ) : (
          <>
            {" "}
            {r.poolOk ? "≧" : "＜"} 應設容量 <span className="font-mono font-bold tabular-nums">{fmt(r.required)} m³</span>{" "}
            <span className={`font-bold ${r.poolOk ? "text-[#15803d] dark:text-[#4ade80]" : "text-[var(--phase-r)]"}`}>
              {r.poolOk ? "OK" : "不足"}
            </span>
          </>
        )}
      </p>
    </div>
  );
}

function Metric({ label, value, unit, strong }: { label: string; value: string; unit: string; strong?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[0.72rem] text-muted">{label}</span>
      <span className="flex items-baseline gap-1">
        <span className={`font-mono font-semibold tabular-nums text-accent ${strong ? "text-[1.9rem] leading-none" : "text-[1.25rem]"}`}>
          {value}
        </span>
        <span className="text-[0.8rem] font-bold">{unit}</span>
      </span>
    </div>
  );
}

function StepBox({ step }: { step: Step }) {
  return (
    <div className="border border-line bg-surface p-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[0.85rem] font-bold">{step.title}</span>
        <span className="shrink-0 font-mono text-[0.95rem] font-semibold tabular-nums text-accent">{step.value}</span>
      </div>
      <ul className="mt-2 flex flex-col gap-1 font-mono text-[0.78rem] leading-relaxed tabular-nums">
        {step.lines.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
      <p className="mt-2 text-[0.7rem] text-muted">依據：{step.cite}</p>
    </div>
  );
}
