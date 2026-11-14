"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { saveProjectReview, saveProjectVersion } from "@/app/projects/actions";
import { Text } from "@/components/ToolFields";
import type { ProjectToolSlug } from "@/lib/projects/tools";

export interface ProjectContext {
  code: string;
  name: string;
  savedAt: string | null;
  savedBy: string;
  /** 已存版次數 */
  versions?: number;
}

const fmtTime = (iso: string) => new Date(iso).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false });

/** 專案模式：儲存列（修改人、儲存、未儲存提醒、他人已更新時之覆蓋確認） */
export default function ProjectSaveBar({
  project,
  tool,
  input,
  emptyNote = "尚未儲存",
}: {
  project: ProjectContext;
  tool: ProjectToolSlug;
  input: unknown;
  emptyNote?: string;
}) {
  const json = JSON.stringify(input);
  const [saved, setSaved] = useState({ json: project.savedAt ? json : "", at: project.savedAt, by: project.savedBy });
  const [by, setBy] = useState(project.savedBy);
  const [status, setStatus] = useState<{ kind: "ok" | "err" | "conflict"; text: string; at?: string; by?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [versions, setVersions] = useState(project.versions ?? 0);
  /** 另存版次表單（null 為收合） */
  const [draft, setDraft] = useState<{ name: string; note: string } | null>(null);
  const dirty = json !== saved.json;
  const versionsHref = `/projects/${encodeURIComponent(project.code)}/${tool}/versions`;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  /** 儲存目前檢討；有 draft 時另存版次（同時儲存目前檢討） */
  async function save(force: boolean) {
    setBusy(true);
    try {
      const v = draft;
      const r = v
        ? await saveProjectVersion(project.code, tool, JSON.parse(json), v.name, v.note, by, saved.at, force)
        : await saveProjectReview(project.code, tool, JSON.parse(json), by, saved.at, force);
      if (r.ok) {
        setSaved({ json, at: r.updatedAt, by });
        if (v) {
          setVersions((n) => n + 1);
          setDraft(null);
        }
        setStatus({ kind: "ok", text: v ? `已另存版次「${v.name.trim()}」並儲存目前檢討（${fmtTime(r.updatedAt)}）` : `已儲存（${fmtTime(r.updatedAt)}）` });
      } else if (r.conflict) {
        setStatus({ kind: "conflict", text: `此檢討已由 ${r.updatedBy || "其他人"} 於 ${fmtTime(r.updatedAt)} 更新。`, at: r.updatedAt, by: r.updatedBy });
      } else {
        setStatus({ kind: "err", text: r.error });
      }
    } catch {
      setStatus({ kind: "err", text: "儲存失敗，請確認登入狀態後再試" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="sticky top-16 z-10 flex flex-col gap-2 border border-accent bg-accent-soft p-3 sm:p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[0.72rem] text-muted">專案 {project.code}</span>
          <span className="text-[0.9rem] font-bold">{project.name}</span>
          <span className="text-[0.7rem] text-muted">
            {saved.at ? `上次儲存 ${fmtTime(saved.at)}${saved.by ? `｜${saved.by}` : ""}` : emptyNote}
            {dirty && <b className="ml-2 text-[var(--phase-r)]">有未儲存的修改</b>}
          </span>
        </div>
        <Text label="修改人（選填）" value={by} onChange={setBy} className="w-36" />
        <button
          type="button"
          disabled={busy || !dirty}
          onClick={() => save(false)}
          className="bg-accent px-4 py-1.5 text-[0.82rem] font-bold text-white disabled:opacity-40"
        >
          {busy && !draft ? "儲存中…" : "儲存"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setDraft(draft ? null : { name: "", note: "" })}
          className="border border-accent bg-background px-3 py-1.5 text-[0.82rem] font-bold text-accent disabled:opacity-40"
        >
          {draft ? "取消另存" : "另存版次"}
        </button>
        <Link href={versionsHref} className="py-1.5 text-[0.78rem] text-accent underline">
          版次（{versions}）
        </Link>
      </div>
      {draft && (
        <div className="flex flex-wrap items-end gap-3 border-t border-accent/40 pt-2">
          <Text label="版次名稱（必填，例：方案 A、11/14 送審版）" value={draft.name} onChange={(name) => setDraft({ ...draft, name })} className="min-w-48 flex-1" />
          <Text label="備註（選填）" value={draft.note} onChange={(note) => setDraft({ ...draft, note })} className="min-w-48 flex-[2]" />
          <button
            type="button"
            disabled={busy || !draft.name.trim()}
            onClick={() => save(false)}
            className="bg-accent px-4 py-1.5 text-[0.82rem] font-bold text-white disabled:opacity-40"
          >
            {busy ? "另存中…" : "確定另存"}
          </button>
          <span className="basis-full text-[0.7rem] text-muted">另存版次時，同時儲存目前檢討；版次存檔後不可修改。</span>
        </div>
      )}
      {status && (
        <p className={`text-[0.78rem] ${status.kind === "ok" ? "text-accent" : "text-[var(--phase-r)]"}`}>
          {status.text}
          {status.kind === "conflict" && (
            <>
              <button type="button" onClick={() => save(true)} className="ml-2 underline">
                以我的版本覆蓋
              </button>
              <button type="button" onClick={() => window.location.reload()} className="ml-2 underline">
                重新載入對方版本
              </button>
            </>
          )}
        </p>
      )}
    </section>
  );
}
