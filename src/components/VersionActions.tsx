"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/projects/actions";

type Action = (state: FormState, f: FormData) => Promise<FormState>;

/** 設為目前檢討：先確認，原目前檢討自動備份 */
export function RestoreVersionButton({ action, name, compact }: { action: Action; name: string; compact?: boolean }) {
  const [state, run, pending] = useActionState(action, {});
  return (
    <form
      action={run}
      onSubmit={(e) => {
        if (!window.confirm(`以版次「${name}」取代目前檢討？\n原目前檢討會先自動另存為「自動備份」版次。`)) e.preventDefault();
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <input name="by" placeholder="修改人（選填）" className={`border border-line bg-background px-2 py-1 text-[0.75rem] ${compact ? "w-24" : "w-32"}`} />
      <button type="submit" disabled={pending} className="border border-accent px-2.5 py-1 text-[0.75rem] font-bold text-accent disabled:opacity-50">
        {pending ? "處理中…" : "設為目前檢討"}
      </button>
      {state.error && <span className="basis-full text-[0.72rem] text-[var(--phase-r)]">{state.error}</span>}
    </form>
  );
}

/** 刪除版次（僅管理者顯示）：再次確認 */
export function DeleteVersionButton({ action, name }: { action: () => Promise<void>; name: string }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(`刪除版次「${name}」？刪除後無法復原。`)) e.preventDefault();
      }}
    >
      <button type="submit" className="border border-[var(--phase-r)] px-2.5 py-1 text-[0.75rem] text-[var(--phase-r)]">
        刪除
      </button>
    </form>
  );
}
