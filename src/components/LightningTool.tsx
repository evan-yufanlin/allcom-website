"use client";

import { useState } from "react";
import PdfSaveButton from "@/components/PdfSaveButton";
import { Card, Check as CheckBox, Num, Select, Text } from "@/components/ToolFields";
import { dateStamp } from "@/lib/dateStamp";
import {
  ASSUMPTIONS,
  CHECKLIST,
  DISCLAIMER,
  HEIGHT_NOTE,
  SOURCE,
  TERMINAL_NAME,
  TERMINAL_NOTE,
  calculateLightning,
  defaultLightningInput,
  fmt,
  type AirTerminal,
  type LightningInput,
  type LightningResult,
  type Step,
} from "@/lib/lightning";

const TERMINALS: AirTerminal[] = ["unset", "franklin", "ese", "multi", "other"];

export default function LightningTool() {
  const [projectName, setProjectName] = useState("");
  const [p, setP] = useState<LightningInput>(defaultLightningInput);
  const [today] = useState(() => new Date());
  const set = (patch: Partial<LightningInput>) => setP((cur) => ({ ...cur, ...patch }));

  const result = calculateLightning(p);
  const ready = p.height > 0;
  const fileName = `避雷設備檢討_H${fmt(p.height)}m-${dateStamp(today, "")}`;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Card title="① 建築物資料">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Text label="工程名稱（選填）" value={projectName} onChange={setProjectName} className="sm:col-span-2" />
          <Num label="建築物高度（不含屋突）" unit="m" value={p.height} onChange={(height) => set({ height: height ?? 0 })} />
        </div>
        <p className="text-[0.72rem] leading-relaxed text-muted">{HEIGHT_NOTE}</p>
        <CheckBox checked={p.hazmat} onChange={(hazmat) => set({ hazmat })}>
          危險物品倉庫（火藥庫、可燃性液體倉庫、可燃性氣體倉庫等）
        </CheckBox>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select<LightningInput["perimeterMode"]>
            label="外周長輸入方式"
            value={p.perimeterMode}
            onChange={(perimeterMode) => set({ perimeterMode })}
            options={[
              { value: "direct", label: "直接輸入外周長" },
              { value: "rect", label: "長 × 寬（矩形）" },
            ]}
          />
          {p.perimeterMode === "direct" ? (
            <Num label="建築物外周長" unit="m" value={p.perimeter} onChange={(perimeter) => set({ perimeter: perimeter ?? 0 })} />
          ) : (
            <>
              <Num label="長" unit="m" value={p.length} onChange={(length) => set({ length: length ?? 0 })} />
              <Num label="寬" unit="m" value={p.width} onChange={(width) => set({ width: width ?? 0 })} />
            </>
          )}
        </div>
      </Card>

      <Card title="② 受雷部型式（選填）">
        <Select<AirTerminal>
          label="型式"
          value={p.terminal}
          onChange={(terminal) => set({ terminal })}
          options={TERMINALS.map((t) => ({ value: t, label: TERMINAL_NAME[t] }))}
        />
        {p.terminal === "franklin" && (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Num label="針高（高出受保護面）" unit="m" value={p.rodHeight} onChange={(rodHeight) => set({ rodHeight: rodHeight ?? 0 })} />
              <Num
                label="至最遠受保護點水平距離（選填）"
                unit="m"
                value={p.distance}
                allowEmpty
                placeholder="例：屋角距離"
                onChange={(distance) => set({ distance })}
              />
            </div>
            <p className="text-[0.72rem] leading-relaxed text-muted">
              保護角：{p.hazmat ? "危險物品倉庫 45°" : "一般建築物 60°"}（第21條）。輸入距離後反算所需針高並判定是否涵蓋。
            </p>
          </>
        )}
        {(p.terminal === "ese" || p.terminal === "multi" || p.terminal === "other") && (
          <p className="border-l-2 border-accent pl-2.5 text-[0.75rem] leading-relaxed">{TERMINAL_NOTE}</p>
        )}
      </Card>

      {ready ? (
        <Results result={result} projectName={projectName} fileName={fileName} generatedOn={dateStamp(today, "/")} />
      ) : (
        <p className="border border-dashed border-line p-5 text-center text-[0.85rem] text-muted">輸入建築物高度後，即顯示檢討結果</p>
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
  result: LightningResult;
  projectName: string;
  fileName: string;
  generatedOn: string;
}) {
  const pr = r.protection;
  return (
    <div className="flex flex-col gap-6">
      <section className="border border-accent bg-accent-soft p-5">
        <span className="eyebrow">檢討結果</span>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Metric label="避雷設備" value={r.required ? "應設" : "非強制"} warn={!r.required} />
          <Metric label="避雷導線（銅）" value={String(r.conductor)} unit="mm²" />
          <Metric label="引下導線" value={String(r.downs)} unit="條" />
          {pr && <Metric label={`保護半徑（${pr.angle}°）`} value={fmt(pr.radius)} unit="m" />}
        </div>
        {!r.required && (
          <p className="mt-3 text-[0.75rem] text-muted">未達第20條應設條件；自願設置時，仍依本節規定設置（以下數值供參考）。</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[1.05rem] font-extrabold">計算式</h2>
        {r.steps.map((st, i) => (
          <StepBox key={st.title} n={i + 1} step={st} />
        ))}
        {pr && (
          <StepBox
            n={r.steps.length + 1}
            step={pr.step}
            verdict={pr.ok === null ? undefined : pr.ok ? "OK" : "不足"}
            verdictOk={pr.ok ?? undefined}
          />
        )}
        {r.input.terminal !== "franklin" && r.input.terminal !== "unset" && (
          <p className="border-l-2 border-accent pl-2.5 text-[0.78rem] leading-relaxed">
            {TERMINAL_NOTE}
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[1.05rem] font-extrabold">設置檢核清單</h2>
        {CHECKLIST.map((g) => (
          <div key={g.title} className="border border-line bg-surface p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-[0.85rem] font-bold">{g.title}</span>
              <span className="text-[0.7rem] text-muted">{g.cite}</span>
            </div>
            <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-[0.8rem] leading-relaxed">
              {g.items.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        ))}
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
          <li>{SOURCE}：第19～25條</li>
        </ol>
      </section>

      <p className="border-t border-dashed border-line pt-4 text-[0.75rem] leading-relaxed text-muted">{DISCLAIMER}</p>

      <PdfSaveButton
        fileName={fileName}
        label="下載檢討結果 PDF"
        build={async () => {
          const [{ pdf }, { default: LightningPdf }, { registerPdfFonts }] = await Promise.all([
            import("@react-pdf/renderer"),
            import("@/components/LightningPdf"),
            import("@/components/pdfCommon"),
          ]);
          registerPdfFonts(window.location.origin);
          return pdf(<LightningPdf result={r} projectName={projectName} generatedOn={generatedOn} />).toBlob();
        }}
      />
    </div>
  );
}

function Metric({ label, value, unit, warn }: { label: string; value: string; unit?: string; warn?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[0.72rem] text-muted">{label}</span>
      <span className="flex items-baseline gap-1">
        <span className={`font-mono text-[1.5rem] leading-none font-semibold tabular-nums ${warn ? "text-muted" : "text-accent"}`}>
          {value}
        </span>
        {unit && <span className="text-[0.8rem] font-bold">{unit}</span>}
      </span>
    </div>
  );
}

function StepBox({ step, n, verdict, verdictOk }: { step: Step; n: number; verdict?: string; verdictOk?: boolean }) {
  return (
    <div className="border border-line bg-surface p-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[0.85rem] font-bold">
          {"①②③④⑤⑥"[n - 1]} {step.title}
        </span>
        <span className="shrink-0 font-mono text-[0.95rem] font-semibold tabular-nums text-accent">{step.value}</span>
      </div>
      <ul className="mt-2 flex flex-col gap-1 font-mono text-[0.78rem] leading-relaxed tabular-nums">
        {step.lines.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
      {verdict && (
        <p className={`mt-2 text-[0.85rem] font-bold ${verdictOk ? "text-[#15803d] dark:text-[#4ade80]" : "text-[var(--phase-r)]"}`}>
          保護半徑 {verdictOk ? "≧" : "＜"} 最遠受保護點距離：{verdict}
        </p>
      )}
      <p className="mt-2 text-[0.7rem] text-muted">依據：{step.cite}</p>
    </div>
  );
}
