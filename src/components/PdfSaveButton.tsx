"use client";

import { useState } from "react";

type SaveFilePicker = (options: {
  suggestedName?: string;
  types?: { description: string; accept: Record<string, string[]> }[];
}) => Promise<FileSystemFileHandle>;

/** 下載 PDF：先開啟存檔視窗（須在點擊當下），再產生 PDF；不支援的瀏覽器改用一般下載。 */
export default function PdfSaveButton({
  fileName,
  build,
  label = "下載檢討結果 PDF",
}: {
  fileName: string;
  build: () => Promise<Blob>;
  label?: string;
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
      const blob = await build();
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
        {state === "working" ? "PDF 產生中…" : label}
      </button>
      {state !== "done" && <span className="text-[0.72rem] text-muted">預設檔名：{fileName}.pdf</span>}
      {state === "done" && <span className="text-[0.75rem] text-muted">已儲存：{savedAs}</span>}
      {state === "error" && (
        <span className="text-[0.75rem] text-[var(--phase-r)]">PDF 產生失敗，請重新整理頁面後再試一次。</span>
      )}
    </div>
  );
}
