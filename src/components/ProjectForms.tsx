"use client";

import { useActionState, type ReactNode } from "react";
import type { FormState } from "@/app/projects/actions";

type Action = (state: FormState, f: FormData) => Promise<FormState>;

const input = "w-full min-w-0 border border-line bg-background px-2 py-1.5 text-[0.85rem] outline-none focus:border-accent";

function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <span className="text-[0.72rem] text-muted">{label}</span>
      {children}
    </label>
  );
}

function Status({ state }: { state: FormState }) {
  if (state.error) return <p className="text-[0.8rem] text-[var(--phase-r)]">{state.error}</p>;
  if (state.message) return <p className="text-[0.8rem] text-accent">{state.message}</p>;
  return null;
}

function Submit({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <button type="submit" disabled={pending} className="self-start bg-accent px-4 py-1.5 text-[0.82rem] font-bold text-white disabled:opacity-50">
      {pending ? "處理中…" : children}
    </button>
  );
}

export function LoginProjectForm({ action, code }: { action: Action; code?: string }) {
  const [state, run, pending] = useActionState(action, {});
  return (
    <form action={run} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="專案編號">
          <input name="code" defaultValue={state.values?.code ?? code} required autoComplete="username" placeholder="例：2026-001" className={input} />
        </Field>
        <Field label="專案密碼">
          <input name="password" type="password" required autoComplete="current-password" className={input} />
        </Field>
      </div>
      <Status state={state} />
      <Submit pending={pending}>進入專案</Submit>
    </form>
  );
}

export function LoginAdminForm({ action }: { action: Action }) {
  const [state, run, pending] = useActionState(action, {});
  return (
    <form action={run} className="flex flex-col gap-3">
      <Field label="管理密碼" className="sm:max-w-xs">
        <input name="password" type="password" required autoComplete="current-password" className={input} />
      </Field>
      <Status state={state} />
      <Submit pending={pending}>管理者登入</Submit>
    </form>
  );
}

export interface ProjectFieldValues {
  name: string;
  site: string;
  floors: string;
  total_area: number | null;
  owner_staff: string;
  note: string;
}

function ProjectFieldInputs({ v: base, kept }: { v?: ProjectFieldValues; kept?: Record<string, string> }) {
  const v = kept ? { name: kept.name, site: kept.site, floors: kept.floors, total_area: kept.total_area as unknown as number, owner_staff: kept.owner_staff, note: kept.note } : base;
  return (
    <>
      <Field label="專案名稱" className="sm:col-span-2">
        <input name="name" defaultValue={v?.name} required className={input} />
      </Field>
      <Field label="基地位置">
        <input name="site" defaultValue={v?.site} className={input} />
      </Field>
      <Field label="樓層數">
        <input name="floors" defaultValue={v?.floors} placeholder="例：B3/12F" className={input} />
      </Field>
      <Field label="總樓地板面積（m²）">
        <input name="total_area" defaultValue={v?.total_area ?? ""} inputMode="decimal" className={input} />
      </Field>
      <Field label="負責人">
        <input name="owner_staff" defaultValue={v?.owner_staff} className={input} />
      </Field>
      <Field label="備註" className="sm:col-span-2">
        <textarea name="note" defaultValue={v?.note} rows={3} className={input} />
      </Field>
    </>
  );
}

export function CreateProjectForm({ action }: { action: Action }) {
  const [state, run, pending] = useActionState(action, {});
  return (
    <form action={run} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="專案編號（年度-流水號）">
          <input name="code" defaultValue={state.values?.code} required placeholder="例：2026-001" className={input} />
        </Field>
        <Field label="專案密碼（至少 6 字）">
          <input name="password" type="password" required autoComplete="new-password" className={input} />
        </Field>
        <ProjectFieldInputs kept={state.values} />
      </div>
      <Status state={state} />
      <Submit pending={pending}>新增專案</Submit>
    </form>
  );
}

export function ProjectInfoForm({ action, values }: { action: Action; values: ProjectFieldValues }) {
  const [state, run, pending] = useActionState(action, {});
  return (
    <form action={run} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ProjectFieldInputs v={values} kept={state.values} />
      </div>
      <Status state={state} />
      <Submit pending={pending}>儲存專案資料</Submit>
    </form>
  );
}

export function ResetPasswordForm({ action }: { action: Action }) {
  const [state, run, pending] = useActionState(action, {});
  return (
    <form action={run} className="flex flex-col gap-3">
      <Field label="新的專案密碼（至少 6 字）" className="sm:max-w-xs">
        <input name="password" type="password" required autoComplete="new-password" className={input} />
      </Field>
      <Status state={state} />
      <Submit pending={pending}>重設專案密碼</Submit>
    </form>
  );
}

export function DeleteProjectForm({ action, code }: { action: Action; code: string }) {
  const [state, run, pending] = useActionState(action, {});
  return (
    <form action={run} className="flex flex-col gap-3">
      <Field label={`輸入專案編號「${code}」確認刪除（含所有檢討資料，無法復原）`} className="sm:max-w-md">
        <input name="confirm" className={input} />
      </Field>
      <Status state={state} />
      <button type="submit" disabled={pending} className="self-start border border-[var(--phase-r)] px-4 py-1.5 text-[0.82rem] text-[var(--phase-r)] disabled:opacity-50">
        {pending ? "處理中…" : "刪除專案"}
      </button>
    </form>
  );
}
