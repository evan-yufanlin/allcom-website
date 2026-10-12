"use client";

import { useState } from "react";
import PdfSaveButton from "@/components/PdfSaveButton";
import SubstationPlan from "@/components/SubstationPlan";
import { Card, Num, Select, SmallButton, Text } from "@/components/ToolFields";
import { dateStamp } from "@/lib/dateStamp";
import {
  CLEARANCE_LABEL,
  DISCLAIMER,
  DOOR_NAME,
  GROUP_NAME,
  LIBRARY,
  NOTES,
  REMINDERS,
  SOURCE,
  TEMPLATES,
  calculateSubstation,
  summarize,
  type Clearances,
  type Door,
  type Equip,
  type Facing,
  type SubstationResult,
} from "@/lib/substation";
import { buildDrawing } from "@/lib/substationDrawing";

type ItemUI = Equip & { key: number };
type RowUI = { id: number; facing: Facing; items: ItemUI[] };

let nextId = 1;
const newId = () => nextId++;

function fromTemplate(id: string) {
  const t = TEMPLATES.find((x) => x.id === id)!;
  return {
    clearances: { ...t.clearances },
    rows: t.rows.map((r): RowUI => ({ id: newId(), facing: r.facing, items: r.items.map((e) => ({ ...e, key: newId() })) })),
  };
}

const n = (v: number) => v.toLocaleString("zh-TW", { maximumFractionDigits: 1 });
/** mm → m，保留至小數 2 位 */
const m = (v: number) => (v / 1000).toLocaleString("zh-TW", { maximumFractionDigits: 2 });

export default function SubstationTool() {
  const [projectName, setProjectName] = useState("");
  const [state, setState] = useState(() => fromTemplate("three"));
  const [today] = useState(() => new Date());
  const { clearances, rows } = state;

  const setRows = (f: (rows: RowUI[]) => RowUI[]) => setState((s) => ({ ...s, rows: f(s.rows) }));
  const setRow = (id: number, f: (r: RowUI) => RowUI) => setRows((rs) => rs.map((r) => (r.id === id ? f(r) : r)));
  const setClearance = (k: keyof Clearances, v: number) => setState((s) => ({ ...s, clearances: { ...s.clearances, [k]: v } }));

  const result = calculateSubstation(rows, clearances);
  const hasItems = result.rows.length > 0;
  const fileName = `自設變電站空間檢討_${m(result.length)}x${m(result.depth)}m-${dateStamp(today, "")}`;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Card title="① 基本資料與範本">
        <Text label="工程名稱（選填）" value={projectName} onChange={setProjectName} />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[0.75rem] text-muted">帶入範本：</span>
          {TEMPLATES.map((t) => (
            <SmallButton key={t.id} onClick={() => setState(fromTemplate(t.id))}>
              {t.name}
            </SmallButton>
          ))}
          <SmallButton onClick={() => setState((s) => ({ ...s, rows: [{ id: newId(), facing: "down", items: [] }] }))}>清空設備</SmallButton>
        </div>
        <p className="text-[0.72rem] leading-relaxed text-muted">設備尺寸依據：{SOURCE}。範本為電氣組討論之配置案例。</p>
      </Card>

      <Card title="② 通道條件（汎德建議值）">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(Object.keys(CLEARANCE_LABEL) as (keyof Clearances)[]).map((k) => (
            <Num key={k} label={CLEARANCE_LABEL[k]} unit="mm" integer value={clearances[k]} onChange={(v) => setClearance(k, v ?? 0)} />
          ))}
        </div>
        <p className="text-[0.72rem] leading-relaxed text-muted">{NOTES.clearance}</p>
        <p className="text-[0.72rem] leading-relaxed text-muted">{NOTES.backToBack}</p>
      </Card>

      <Card
        title="③ 設備排列（由上而下，每列由左而右）"
        aside={<SmallButton onClick={() => setRows((rs) => [...rs, { id: newId(), facing: "down", items: [] }])}>＋ 新增列</SmallButton>}
      >
        {rows.map((r, i) => (
          <RowEditor
            key={r.id}
            index={i}
            row={r}
            count={rows.length}
            update={(f) => setRow(r.id, f)}
            move={(d) =>
              setRows((rs) => {
                const j = i + d;
                if (j < 0 || j >= rs.length) return rs;
                const out = [...rs];
                [out[i], out[j]] = [out[j], out[i]];
                return out;
              })
            }
            remove={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}
          />
        ))}
        <p className="text-[0.72rem] leading-relaxed text-muted">{NOTES.cast}</p>
      </Card>

      {hasItems ? (
        <Results result={result} projectName={projectName} fileName={fileName} generatedOn={dateStamp(today, "/")} />
      ) : (
        <p className="border border-dashed border-line p-5 text-center text-[0.85rem] text-muted">加入設備後，即顯示檢討結果</p>
      )}
    </div>
  );
}

function RowEditor({
  index,
  row,
  count,
  update,
  move,
  remove,
}: {
  index: number;
  row: RowUI;
  count: number;
  update: (f: (r: RowUI) => RowUI) => void;
  move: (d: number) => void;
  remove: () => void;
}) {
  const [pick, setPick] = useState(LIBRARY[0].id);
  const [qty, setQty] = useState(1);
  const [custom, setCustom] = useState<Equip | null>(null);
  const setItems = (f: (items: ItemUI[]) => ItemUI[]) => update((r) => ({ ...r, items: f(r.items) }));
  const shift = (k: number, d: number) =>
    setItems((items) => {
      const i = items.findIndex((x) => x.key === k);
      const j = i + d;
      if (j < 0 || j >= items.length) return items;
      const out = [...items];
      [out[i], out[j]] = [out[j], out[i]];
      return out;
    });
  const rowLength = row.items.reduce((s, e) => s + e.width, 0);

  return (
    <div className="flex flex-col gap-2.5 border-l-2 border-accent pl-3">
      <div className="flex flex-wrap items-end gap-2">
        <span className="pb-1.5 text-[0.88rem] font-bold">第{index + 1}列</span>
        <Select<Facing>
          label="前側朝向"
          value={row.facing}
          onChange={(facing) => update((r) => ({ ...r, facing }))}
          options={[
            { value: "down", label: "前側朝下 ↓" },
            { value: "up", label: "前側朝上 ↑" },
          ]}
        />
        <span className="pb-1.5 text-[0.72rem] text-muted">
          列長 {n(rowLength)}
          {row.items.length ? `・列深 ${n(Math.max(...row.items.map((e) => e.depth)))}` : ""}
        </span>
        <div className="ml-auto flex gap-1">
          {index > 0 && <SmallButton onClick={() => move(-1)}>↑ 上移</SmallButton>}
          {index < count - 1 && <SmallButton onClick={() => move(1)}>↓ 下移</SmallButton>}
          {count > 1 && <SmallButton onClick={remove}>刪除列</SmallButton>}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {row.items.map((e, i) => (
          <span key={e.key} className="flex items-center gap-1 border border-line bg-background py-0.5 pr-0.5 pl-2 text-[0.75rem]">
            <span className="font-bold">{e.name}</span>
            <span className="font-mono text-[0.68rem] text-muted">
              {e.width}×{e.depth}
            </span>
            {i > 0 && (
              <button type="button" aria-label="左移" onClick={() => shift(e.key, -1)} className="px-1 text-muted hover:text-accent">
                ←
              </button>
            )}
            {i < row.items.length - 1 && (
              <button type="button" aria-label="右移" onClick={() => shift(e.key, 1)} className="px-1 text-muted hover:text-accent">
                →
              </button>
            )}
            <button
              type="button"
              aria-label={`刪除 ${e.name}`}
              onClick={() => setItems((items) => items.filter((x) => x.key !== e.key))}
              className="px-1 text-muted hover:text-[var(--phase-r)]"
            >
              ×
            </button>
          </span>
        ))}
        {row.items.length === 0 && <span className="text-[0.75rem] text-muted">尚無設備</span>}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_5rem_auto] items-end gap-2 sm:grid-cols-[minmax(0,18rem)_5rem_auto_auto]">
        <Select<string>
          label="加入設備"
          value={pick}
          onChange={setPick}
          options={LIBRARY.map((e) => ({ value: e.id, label: `${GROUP_NAME[e.group]}｜${e.name}（${e.width}×${e.depth}）` }))}
        />
        <Num label="數量" integer value={qty} onChange={(v) => setQty(v ?? 1)} />
        <SmallButton
          onClick={() => {
            const e = LIBRARY.find((x) => x.id === pick)!;
            const { id: _id, ...equip } = e;
            void _id;
            setItems((items) => [...items, ...Array.from({ length: Math.max(1, qty) }, () => ({ ...equip, key: newId() }))]);
          }}
        >
          加入
        </SmallButton>
        <SmallButton onClick={() => setCustom(custom ? null : { name: "", group: "custom", width: 1200, depth: 1800, door: "single" })}>
          {custom ? "取消自訂" : "＋ 自訂設備"}
        </SmallButton>
      </div>

      {custom && (
        <div className="grid grid-cols-2 items-end gap-2 sm:grid-cols-[minmax(0,1fr)_6rem_6rem_8rem_auto]">
          <Text label="名稱" value={custom.name} onChange={(name) => setCustom({ ...custom, name })} className="col-span-2 sm:col-span-1" />
          <Num label="寬" unit="mm" integer value={custom.width} onChange={(width) => setCustom({ ...custom, width: width ?? 0 })} />
          <Num label="深" unit="mm" integer value={custom.depth} onChange={(depth) => setCustom({ ...custom, depth: depth ?? 0 })} />
          <Select<Door>
            label="門"
            value={custom.door}
            onChange={(door) => setCustom({ ...custom, door })}
            options={(["single", "double", "none"] as const).map((d) => ({ value: d, label: DOOR_NAME[d] }))}
          />
          <SmallButton
            onClick={() => {
              if (!custom.name || custom.width <= 0 || custom.depth <= 0) return;
              setItems((items) => [...items, { ...custom, key: newId() }]);
              setCustom(null);
            }}
          >
            加入自訂
          </SmallButton>
        </div>
      )}
    </div>
  );
}

function Results({
  result: r,
  projectName,
  fileName,
  generatedOn,
}: {
  result: SubstationResult;
  projectName: string;
  fileName: string;
  generatedOn: string;
}) {
  const drawing = buildDrawing(r);
  return (
    <div className="flex flex-col gap-6">
      <section className="border border-accent bg-accent-soft p-5">
        <span className="eyebrow">檢討結果</span>
        <div className="mt-3 grid grid-cols-3 gap-4">
          <Metric label="室內淨長" value={n(r.length)} unit="mm" />
          <Metric label="室內淨深" value={n(r.depth)} unit="mm" />
          <Metric label="淨面積" value={n(Math.round(r.area * 10) / 10)} unit="m²" strong />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[1.05rem] font-extrabold">平面示意圖</h2>
        <div className="border border-line bg-white p-2">
          <SubstationPlan d={drawing} />
        </div>
        <p className="text-[0.72rem] text-muted">虛線為門扇開啟範圍。{NOTES.door}</p>
      </section>

      {r.warnings.length > 0 && (
        <section className="flex flex-col gap-1.5 border-l-2 border-[var(--phase-r)] pl-3">
          <h2 className="text-[0.95rem] font-extrabold">門扇干涉提醒</h2>
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
          <span>室內淨長 ＝ {r.lengthLine}</span>
          <span>室內淨深 ＝ {r.depthLine}</span>
          <span>
            淨面積 ＝ {m(r.length)} × {m(r.depth)} ＝ {r.area.toFixed(1)} m²
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-[0.76rem]">
            <thead>
              <tr className="bg-accent-soft text-left">
                {["列", "前側", "設備（由左而右）", "列長", "列深"].map((h) => (
                  <th key={h} className="border border-line px-2 py-1.5 font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r.rows.map((row) => (
                <tr key={row.index}>
                  <td className="border border-line px-2 py-1.5 whitespace-nowrap">第{row.index}列</td>
                  <td className="border border-line px-2 py-1.5 whitespace-nowrap">{row.facing === "down" ? "朝下" : "朝上"}</td>
                  <td className="border border-line px-2 py-1.5">{summarize(row.items.map((e) => e.name))}</td>
                  <td className="border border-line px-2 py-1.5 font-mono tabular-nums">{n(row.length)}</td>
                  <td className="border border-line px-2 py-1.5 font-mono tabular-nums">{n(row.depth)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[1.05rem] font-extrabold">提醒與未計入項目</h2>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[0.82rem] leading-relaxed">
          {[NOTES.clearance, ...REMINDERS].map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      <p className="border-t border-dashed border-line pt-4 text-[0.75rem] leading-relaxed text-muted">{DISCLAIMER}</p>

      <PdfSaveButton
        fileName={fileName}
        label="下載檢討結果 PDF"
        build={async () => {
          const [{ pdf }, { default: SubstationPdf }, { registerPdfFonts }] = await Promise.all([
            import("@react-pdf/renderer"),
            import("@/components/SubstationPdf"),
            import("@/components/pdfCommon"),
          ]);
          registerPdfFonts(window.location.origin);
          return pdf(<SubstationPdf result={r} projectName={projectName} generatedOn={generatedOn} />).toBlob();
        }}
      />
    </div>
  );
}

function Metric({ label, value, unit, strong }: { label: string; value: string; unit: string; strong?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[0.72rem] text-muted">{label}</span>
      <span className="flex items-baseline gap-1">
        <span className={`font-mono font-semibold tabular-nums text-accent ${strong ? "text-[1.6rem] leading-none" : "text-[1.25rem]"}`}>
          {value}
        </span>
        <span className="text-[0.8rem] font-bold">{unit}</span>
      </span>
    </div>
  );
}
