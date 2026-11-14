"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PASSWORD_MIN, hashPassword, safeEqual, verifyPassword } from "@/lib/projects/password";
import { CODE_PATTERN } from "@/lib/projects/session";
import { REVIEW_HANDLERS, isProjectTool } from "@/lib/projects/tools";
import { clearFailures, getSession, lockedMinutes, recordFailure, setSession } from "@/server/auth";
import {
  getPasswordHash,
  insertProject,
  removeProject,
  removeVersion,
  restoreVersion,
  saveReviewAndVersion,
  setPasswordHash,
  updateProjectFields,
  upsertReview,
  type ProjectFields,
  VERSION_LIMIT,
} from "@/server/projects";

export interface FormState {
  error?: string;
  message?: string;
  /** 送出失敗時保留之輸入（密碼除外），避免表單重設後須重新輸入 */
  values?: Record<string, string>;
}

const keep = (f: FormData): Record<string, string> =>
  Object.fromEntries([...f.entries()].filter(([k, v]) => typeof v === "string" && !k.startsWith("$") && k !== "password").map(([k, v]) => [k, v as string]));

const text = (f: FormData, k: string, max = 200) => String(f.get(k) ?? "").trim().slice(0, max);

function fields(f: FormData): ProjectFields | string {
  const name = text(f, "name", 100);
  if (!name) return "請輸入專案名稱";
  const areaRaw = text(f, "total_area", 20).replace(/,/g, "");
  const area = areaRaw === "" ? null : Number(areaRaw);
  if (area !== null && (!Number.isFinite(area) || area < 0)) return "總樓地板面積請輸入數字";
  return { name, site: text(f, "site", 100), floors: text(f, "floors", 40), total_area: area, owner_staff: text(f, "owner_staff", 40), note: text(f, "note", 1000) };
}

async function requireAdmin() {
  const s = await getSession();
  if (!s.admin) throw new Error("需管理者登入");
  return s;
}

async function requireProject(code: string) {
  const s = await getSession();
  if (!s.admin && !s.projects.includes(code)) throw new Error("未登入此專案");
  return s;
}

// ---- 登入、登出 ----

export async function loginProject(_: FormState, f: FormData): Promise<FormState> {
  const code = text(f, "code", 20);
  const password = String(f.get("password") ?? "");
  if (!CODE_PATTERN.test(code)) return { error: "專案編號格式不符", values: keep(f) };
  const wait = await lockedMinutes(`p:${code}`);
  if (wait) return { error: `登入失敗次數過多，請 ${wait} 分鐘後再試`, values: keep(f) };
  const hash = await getPasswordHash(code);
  if (!hash || !(await verifyPassword(password, hash))) {
    await recordFailure(`p:${code}`);
    return { error: "專案編號或密碼錯誤", values: keep(f) };
  }
  await clearFailures(`p:${code}`);
  const s = await getSession();
  await setSession({ ...s, projects: [...new Set([...s.projects, code])] });
  redirect(`/projects/${encodeURIComponent(code)}`);
}

export async function loginAdmin(_: FormState, f: FormData): Promise<FormState> {
  const wait = await lockedMinutes("admin");
  if (wait) return { error: `登入失敗次數過多，請 ${wait} 分鐘後再試` };
  if (!safeEqual(String(f.get("password") ?? ""), process.env.ADMIN_PASSWORD ?? "")) {
    await recordFailure("admin");
    return { error: "管理密碼錯誤" };
  }
  await clearFailures("admin");
  const s = await getSession();
  await setSession({ ...s, admin: true });
  redirect("/projects");
}

export async function logout() {
  await setSession({ admin: false, projects: [] });
  redirect("/projects");
}

// ---- 管理者：新增、修改、重設密碼、刪除 ----

export async function createProject(_: FormState, f: FormData): Promise<FormState> {
  await requireAdmin();
  const code = text(f, "code", 20);
  if (!CODE_PATTERN.test(code)) return { error: "專案編號限英數字、連字號，1～20 字（例：2026-001）", values: keep(f) };
  const fl = fields(f);
  if (typeof fl === "string") return { error: fl, values: keep(f) };
  const password = String(f.get("password") ?? "");
  if (password.length < PASSWORD_MIN) return { error: `專案密碼至少 ${PASSWORD_MIN} 字`, values: keep(f) };
  if (!(await insertProject(code, fl, await hashPassword(password)))) return { error: `專案編號 ${code} 已存在`, values: keep(f) };
  revalidatePath("/projects");
  redirect(`/projects/${encodeURIComponent(code)}`);
}

export async function updateProject(code: string, _: FormState, f: FormData): Promise<FormState> {
  await requireProject(code);
  const fl = fields(f);
  if (typeof fl === "string") return { error: fl, values: keep(f) };
  await updateProjectFields(code, fl);
  revalidatePath(`/projects/${code}`);
  return { message: "已儲存專案資料", values: keep(f) };
}

export async function resetProjectPassword(code: string, _: FormState, f: FormData): Promise<FormState> {
  await requireAdmin();
  const password = String(f.get("password") ?? "");
  if (password.length < PASSWORD_MIN) return { error: `專案密碼至少 ${PASSWORD_MIN} 字` };
  await setPasswordHash(code, await hashPassword(password));
  return { message: "已設定新的專案密碼" };
}

export async function deleteProject(code: string, _: FormState, f: FormData): Promise<FormState> {
  await requireAdmin();
  if (text(f, "confirm", 20) !== code) return { error: `請輸入專案編號「${code}」確認刪除` };
  await removeProject(code);
  revalidatePath("/projects");
  redirect("/projects");
}

// ---- 檢討存檔 ----

export type SaveResult =
  | { ok: true; updatedAt: string }
  | { ok: false; conflict: true; updatedAt: string; updatedBy: string }
  | { ok: false; conflict: false; error: string };

export async function saveProjectReview(
  code: string,
  tool: string,
  input: unknown,
  updatedBy: string,
  expected: string | null,
  force: boolean,
): Promise<SaveResult> {
  await requireProject(code);
  if (!isProjectTool(tool)) return { ok: false, conflict: false, error: "此工具尚未開放存入專案" };
  const h = REVIEW_HANDLERS[tool];
  const parsed = h.parse(input);
  if (!parsed) return { ok: false, conflict: false, error: "資料格式不符，未儲存" };
  const summary = h.summarize(parsed as never);
  const r = await upsertReview(code, tool, h.schema, parsed, summary, updatedBy.trim().slice(0, 40), expected, force);
  revalidatePath(`/projects/${code}`);
  return r.ok
    ? { ok: true, updatedAt: r.updatedAt.toISOString() }
    : { ok: false, conflict: true, updatedAt: r.updatedAt.toISOString(), updatedBy: r.updatedBy };
}

// ---- 版次（docs/project-versions-spec.md） ----

export type VersionResult =
  | { ok: true; updatedAt: string; versionId: number }
  | { ok: false; conflict: true; updatedAt: string; updatedBy: string }
  | { ok: false; conflict: false; error: string };

/** 另存版次：同時儲存目前檢討 */
export async function saveProjectVersion(
  code: string,
  tool: string,
  input: unknown,
  name: string,
  note: string,
  updatedBy: string,
  expected: string | null,
  force: boolean,
): Promise<VersionResult> {
  await requireProject(code);
  if (!isProjectTool(tool)) return { ok: false, conflict: false, error: "此工具尚未開放存入專案" };
  const label = name.trim().slice(0, 40);
  if (!label) return { ok: false, conflict: false, error: "請輸入版次名稱" };
  const h = REVIEW_HANDLERS[tool];
  const parsed = h.parse(input);
  if (!parsed) return { ok: false, conflict: false, error: "資料格式不符，未儲存" };
  const r = await saveReviewAndVersion(code, tool, h.schema, parsed, h.summarize(parsed as never), updatedBy.trim().slice(0, 40), label, note.trim().slice(0, 200), expected, force);
  revalidatePath(`/projects/${code}`);
  if (r.ok) return { ok: true, updatedAt: r.updatedAt.toISOString(), versionId: r.versionId };
  if (r.reason === "limit") return { ok: false, conflict: false, error: `版次已達 ${VERSION_LIMIT} 個，請管理者刪除不需要的版次後再另存` };
  return { ok: false, conflict: true, updatedAt: r.updatedAt.toISOString(), updatedBy: r.updatedBy };
}

const versionPath = (code: string, tool: string) => `/projects/${encodeURIComponent(code)}/${tool}`;

/** 設為目前檢討（表單動作） */
export async function restoreProjectVersion(code: string, tool: string, id: number, _: FormState, f: FormData): Promise<FormState> {
  await requireProject(code);
  if (!isProjectTool(tool)) return { error: "此工具尚未開放存入專案" };
  const r = await restoreVersion(code, tool, id, text(f, "by", 40));
  if (!r.ok) return { error: r.reason === "limit" ? `版次已達 ${VERSION_LIMIT} 個，無法自動備份目前檢討；請管理者先刪除不需要的版次` : "找不到此版次" };
  revalidatePath(`/projects/${code}`);
  redirect(versionPath(code, tool));
}

/** 刪除版次（僅管理者） */
export async function deleteProjectVersion(code: string, tool: string, id: number): Promise<void> {
  await requireAdmin();
  if (!isProjectTool(tool)) return;
  await removeVersion(code, tool, id);
  revalidatePath(`/projects/${code}`);
  redirect(`${versionPath(code, tool)}/versions`);
}
