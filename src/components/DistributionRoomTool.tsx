"use client";

import { useState } from "react";
import {
  ASSUMPTIONS,
  DISCLAIMER,
  LOCATION_NOTES,
  REFERENCES,
  reviewDistributionRoom,
  type CalcStep,
  type DistributionRoomResult,
  type SpecItem,
} from "@/lib/distributionRoom";

function dateStamp(d: Date, sep: string) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return [d.getFullYear(), mm, dd].join(sep);
}

function parsePositive(raw: string) {
  if (raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : NaN;
}

function parseSpaces(raw: string) {
  if (raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : NaN;
}

export default function DistributionRoomTool() {
  const [areaRaw, setAreaRaw] = useState("");
  const [spacesRaw, setSpacesRaw] = useState("");

  const area = parsePositive(areaRaw);
  const spaces = parseSpaces(spacesRaw);
  const areaError = Number.isNaN(area) ? "請輸入大於 0 的數字" : null;
  const spacesError = Number.isNaN(spaces) ? "請輸入 0 以上的整數" : null;
  const review =
    typeof area === "number" && !Number.isNaN(area) && typeof spaces === "number" && !Number.isNaN(spaces)
      ? { area, spaces, result: reviewDistributionRoom(area, spaces) }
      : null;
  const result = review?.result;
  const today = new Date();
  const fileName = review ? `配電場所面積檢討_${review.area}m2_${review.spaces}格-${dateStamp(today, "")}` : "";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <form
        onSubmit={(e) => e.preventDefault()}
        className="grid grid-cols-1 gap-4 border border-line bg-surface p-5 sm:grid-cols-2"
      >
        <Field
          id="floor-area"
          label="總樓地板面積"
          unit="m²"
          value={areaRaw}
          onChange={setAreaRaw}
          error={areaError}
          inputMode="decimal"
          placeholder="例如 15000"
        />
        <Field
          id="parking-spaces"
          label="汽車停車位數量"
          unit="格"
          value={spacesRaw}
          onChange={setSpacesRaw}
          error={spacesError}
          inputMode="numeric"
          placeholder="例如 180"
        />
        <p className="text-[0.75rem] leading-relaxed text-muted sm:col-span-2">
          適用：台電低壓新設。總樓地板面積以同一建造執照所載為準。
        </p>
      </form>

      {review && result ? (
        <>
          <section className="border border-accent bg-accent-soft p-5">
            <span className="eyebrow">檢討結果</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-[2.4rem] leading-none font-semibold tabular-nums text-accent">
                {result.total}
              </span>
              <span className="text-[1rem] font-bold">m²</span>
            </div>
            <p className="mt-2 text-[0.85rem] text-muted">
              台電配電場所應設面積 = 基本面積 {result.base.value} m² ＋ 停車位擴增 {result.parking.value} m²
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-[1.1rem] font-extrabold">計算式</h2>
            <Step title="① 基本面積" step={result.base} />
            <Step title="② 停車位擴增面積" step={result.parking} />
            <div className="border border-line bg-surface p-4">
              <div className="text-[0.85rem] font-bold">③ 合計</div>
              <p className="mt-2 font-mono text-[0.85rem] tabular-nums">
                {result.base.value} + {result.parking.value} = {result.total} m²
              </p>
            </div>
          </section>

          <SpecTable title="配電場所規格需求" items={result.specs} />
          <SpecTable title="設置位置注意事項" items={LOCATION_NOTES} />

          <section className="flex flex-col gap-2">
            <h2 className="text-[1.1rem] font-extrabold">適用範圍與說明</h2>
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[0.82rem] leading-relaxed text-muted">
              {ASSUMPTIONS.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-[1.1rem] font-extrabold">引用法規</h2>
            <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-[0.82rem] leading-relaxed">
              {REFERENCES.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ol>
          </section>

          <p className="border-t border-dashed border-line pt-4 text-[0.75rem] leading-relaxed text-muted">
            {DISCLAIMER}
          </p>

          <PdfDownload
            floorArea={review.area}
            parkingSpaces={review.spaces}
            result={review.result}
            generatedOn={dateStamp(today, "/")}
            fileName={fileName}
          />
        </>
      ) : (
        <p className="border border-dashed border-line p-5 text-center text-[0.85rem] text-muted">
          輸入總樓地板面積與汽車停車位數量後，即顯示檢討結果
        </p>
      )}
    </div>
  );
}

function Field({
  id,
  label,
  unit,
  value,
  onChange,
  error,
  inputMode,
  placeholder,
}: {
  id: string;
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  error: string | null;
  inputMode: "decimal" | "numeric";
  placeholder: string;
}) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="text-[0.85rem] font-bold">{label}</span>
      <span className="flex items-center border border-line bg-background focus-within:border-accent">
        <input
          id={id}
          type="text"
          inputMode={inputMode}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value.replace(/,/g, ""))}
          aria-invalid={!!error}
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 font-mono text-[1rem] tabular-nums outline-none"
        />
        <span className="px-3 text-[0.85rem] text-muted">{unit}</span>
      </span>
      {error && <span className="text-[0.75rem] text-[var(--phase-r)]">{error}</span>}
    </label>
  );
}

function Step({ title, step }: { title: string; step: CalcStep }) {
  return (
    <div className="border border-line bg-surface p-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[0.85rem] font-bold">{title}</span>
        <span className="font-mono text-[0.95rem] font-semibold tabular-nums text-accent">{step.value} m²</span>
      </div>
      <ul className="mt-2 flex flex-col gap-1 font-mono text-[0.8rem] leading-relaxed tabular-nums">
        {step.lines.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
      <p className="mt-2 text-[0.72rem] text-muted">依據：{step.cite}</p>
    </div>
  );
}

function SpecTable({ title, items }: { title: string; items: SpecItem[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[1.1rem] font-extrabold">{title}</h2>
      <div className="flex flex-col border border-line">
        {items.map((s, i) => (
          <div
            key={s.item}
            className={`grid grid-cols-1 gap-1 bg-surface p-3.5 sm:grid-cols-[8.5rem_1fr] sm:gap-4 ${
              i > 0 ? "border-t border-line" : ""
            }`}
          >
            <div className="text-[0.82rem] font-bold">{s.item}</div>
            <div className="flex flex-col gap-1">
              <div className="text-[0.85rem] leading-relaxed">{s.requirement}</div>
              <div className="text-[0.7rem] leading-relaxed text-muted">依據：{s.cite}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

type SaveFilePicker = (options: {
  suggestedName?: string;
  types?: { description: string; accept: Record<string, string[]> }[];
}) => Promise<FileSystemFileHandle>;

function PdfDownload({
  floorArea,
  parkingSpaces,
  result,
  generatedOn,
  fileName,
}: {
  floorArea: number;
  parkingSpaces: number;
  result: DistributionRoomResult;
  generatedOn: string;
  fileName: string;
}) {
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [savedAs, setSavedAs] = useState("");

  async function download() {
    const name = `${fileName}.pdf`;

    // 存檔視窗必須在點擊當下開啟（瀏覽器限制），所以先選位置，再產生 PDF。
    // 不支援的瀏覽器（Safari、Firefox、手機）改用一般下載，存成預設檔名。
    let handle: FileSystemFileHandle | null = null;
    const picker = (window as Window & { showSaveFilePicker?: SaveFilePicker }).showSaveFilePicker;
    if (picker) {
      try {
        handle = await picker({
          suggestedName: name,
          types: [{ description: "PDF 文件", accept: { "application/pdf": [".pdf"] } }],
        });
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }

    setState("working");
    // 先讓「產生中」顯示出來，再進行耗時的排版
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
    try {
      const [{ pdf }, { default: DistributionRoomPdf, registerPdfFonts }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/DistributionRoomPdf"),
      ]);
      registerPdfFonts(window.location.origin);
      const blob = await pdf(
        <DistributionRoomPdf
          floorArea={floorArea}
          parkingSpaces={parkingSpaces}
          result={result}
          generatedOn={generatedOn}
        />,
      ).toBlob();

      if (handle) {
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        setSavedAs(handle.name);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
        setSavedAs(name);
      }
      setState("done");
    } catch (e) {
      console.error(e);
      setState("error");
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      <button
        type="button"
        onClick={download}
        disabled={state === "working"}
        className="self-start rounded-[2px] bg-accent px-5 py-2.75 text-[0.85rem] font-bold text-white disabled:opacity-60"
      >
        {state === "working" ? "PDF 產生中…" : "下載檢討結果 PDF"}
      </button>
      {state !== "done" && <span className="text-[0.72rem] text-muted">預設檔名：{fileName}.pdf</span>}
      {state === "done" && <span className="text-[0.75rem] text-muted">已儲存：{savedAs}</span>}
      {state === "error" && (
        <span className="text-[0.75rem] text-[var(--phase-r)]">PDF 產生失敗，請重新整理頁面後再試一次。</span>
      )}
    </div>
  );
}
