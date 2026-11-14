import "server-only";
import type { TransactionSql } from "postgres";
import { db } from "@/server/db";

export interface ProjectRow {
  code: string;
  name: string;
  site: string;
  floors: string;
  total_area: number | null;
  owner_staff: string;
  note: string;
  created_at: Date;
  updated_at: Date;
}

export interface ReviewRow {
  tool: string;
  schema_version: number;
  input: unknown;
  summary: unknown;
  updated_by: string;
  updated_at: Date;
}

export type ProjectFields = Pick<ProjectRow, "name" | "site" | "floors" | "total_area" | "owner_staff" | "note">;

const cols = (sql: Awaited<ReturnType<typeof db>>) =>
  sql`code, name, site, floors, total_area::float8 as total_area, owner_staff, note, created_at, updated_at`;

export async function listProjects(): Promise<(ProjectRow & { reviews: number })[]> {
  const sql = await db();
  return sql<(ProjectRow & { reviews: number })[]>`
    select ${cols(sql)}, (select count(*)::int from project_reviews r where r.project_code = p.code) as reviews
    from projects p order by updated_at desc`;
}

export async function getProject(code: string): Promise<ProjectRow | null> {
  const sql = await db();
  const [row] = await sql<ProjectRow[]>`select ${cols(sql)} from projects where code = ${code}`;
  return row ?? null;
}

export async function getPasswordHash(code: string): Promise<string | null> {
  const sql = await db();
  const [row] = await sql<{ password_hash: string }[]>`select password_hash from projects where code = ${code}`;
  return row?.password_hash ?? null;
}

export async function insertProject(code: string, f: ProjectFields, passwordHash: string): Promise<boolean> {
  const sql = await db();
  const rows = await sql`
    insert into projects (code, name, site, floors, total_area, owner_staff, note, password_hash)
    values (${code}, ${f.name}, ${f.site}, ${f.floors}, ${f.total_area}, ${f.owner_staff}, ${f.note}, ${passwordHash})
    on conflict (code) do nothing returning code`;
  return rows.length > 0;
}

export async function updateProjectFields(code: string, f: ProjectFields) {
  const sql = await db();
  await sql`
    update projects set name = ${f.name}, site = ${f.site}, floors = ${f.floors}, total_area = ${f.total_area},
      owner_staff = ${f.owner_staff}, note = ${f.note}, updated_at = now()
    where code = ${code}`;
}

export async function setPasswordHash(code: string, hash: string) {
  const sql = await db();
  await sql`update projects set password_hash = ${hash}, updated_at = now() where code = ${code}`;
}

export async function removeProject(code: string) {
  const sql = await db();
  await sql`delete from projects where code = ${code}`;
}

export async function listReviews(code: string): Promise<ReviewRow[]> {
  const sql = await db();
  return sql<ReviewRow[]>`
    select tool, schema_version, input, summary, updated_by, updated_at from project_reviews where project_code = ${code}`;
}

export async function getReview(code: string, tool: string): Promise<ReviewRow | null> {
  const sql = await db();
  const [row] = await sql<ReviewRow[]>`
    select tool, schema_version, input, summary, updated_by, updated_at from project_reviews
    where project_code = ${code} and tool = ${tool}`;
  return row ?? null;
}

/** 儲存檢討；expected 與資料庫之修改時間不符（他人已先儲存）且未強制覆蓋時，回傳現存版本不寫入 */
export async function upsertReview(
  code: string,
  tool: string,
  schemaVersion: number,
  input: unknown,
  summary: unknown,
  updatedBy: string,
  expected: string | null,
  force: boolean,
): Promise<{ ok: true; updatedAt: Date } | { ok: false; updatedAt: Date; updatedBy: string }> {
  const sql = await db();
  return sql.begin(async (tx) => {
    const [cur] = await tx<{ updated_at: Date; updated_by: string }[]>`
      select updated_at, updated_by from project_reviews where project_code = ${code} and tool = ${tool} for update`;
    if (cur && !force && cur.updated_at.toISOString() !== expected) return { ok: false as const, updatedAt: cur.updated_at, updatedBy: cur.updated_by };
    const [row] = await tx<{ updated_at: Date }[]>`
      insert into project_reviews (project_code, tool, schema_version, input, summary, updated_by, updated_at)
      values (${code}, ${tool}, ${schemaVersion}, ${tx.json(input as never)}, ${tx.json(summary as never)}, ${updatedBy}, now())
      on conflict (project_code, tool) do update set schema_version = excluded.schema_version, input = excluded.input,
        summary = excluded.summary, updated_by = excluded.updated_by, updated_at = now()
      returning updated_at`;
    await tx`update projects set updated_at = now() where code = ${code}`;
    return { ok: true as const, updatedAt: row.updated_at };
  });
}

// ---- 版次（docs/project-versions-spec.md） ----

/** 每項檢討版次上限（負責人 2026.11.14 確認） */
export const VERSION_LIMIT = 30;

export interface VersionRow {
  id: number;
  tool: string;
  name: string;
  note: string;
  schema_version: number;
  input: unknown;
  summary: unknown;
  auto: boolean;
  created_by: string;
  created_at: Date;
}

const vcols = (sql: Awaited<ReturnType<typeof db>>) =>
  sql`id::int as id, tool, name, note, schema_version, input, summary, auto, created_by, created_at`;

export async function listVersions(code: string, tool: string): Promise<VersionRow[]> {
  const sql = await db();
  return sql<VersionRow[]>`
    select ${vcols(sql)} from project_review_versions where project_code = ${code} and tool = ${tool} order by created_at desc, id desc`;
}

export async function getVersion(code: string, tool: string, id: number): Promise<VersionRow | null> {
  const sql = await db();
  const [row] = await sql<VersionRow[]>`
    select ${vcols(sql)} from project_review_versions where project_code = ${code} and tool = ${tool} and id = ${id}`;
  return row ?? null;
}

/** 各工具版次數（專案總覽用） */
export async function versionCounts(code: string): Promise<Map<string, number>> {
  const sql = await db();
  const rows = await sql<{ tool: string; n: number }[]>`
    select tool, count(*)::int as n from project_review_versions where project_code = ${code} group by tool`;
  return new Map(rows.map((r) => [r.tool, r.n]));
}

type Tx = TransactionSql;

async function insertVersionTx(
  tx: Tx,
  v: { code: string; tool: string; name: string; note: string; schemaVersion: number; input: unknown; summary: unknown; auto: boolean; by: string },
): Promise<number | null> {
  const [{ n }] = await tx<{ n: number }[]>`
    select count(*)::int as n from project_review_versions where project_code = ${v.code} and tool = ${v.tool}`;
  if (n >= VERSION_LIMIT) return null;
  const [row] = await tx<{ id: number }[]>`
    insert into project_review_versions (project_code, tool, name, note, schema_version, input, summary, auto, created_by)
    values (${v.code}, ${v.tool}, ${v.name}, ${v.note}, ${v.schemaVersion}, ${tx.json(v.input as never)}, ${tx.json(v.summary as never)}, ${v.auto}, ${v.by})
    returning id::int as id`;
  return row.id;
}

export type VersionSaveResult =
  | { ok: true; updatedAt: Date; versionId: number }
  | { ok: false; reason: "conflict"; updatedAt: Date; updatedBy: string }
  | { ok: false; reason: "limit" };

/** 另存版次：同時儲存目前檢討（負責人確認做法 A），再新增版次；兩者在同一交易內 */
export async function saveReviewAndVersion(
  code: string,
  tool: string,
  schemaVersion: number,
  input: unknown,
  summary: unknown,
  by: string,
  name: string,
  note: string,
  expected: string | null,
  force: boolean,
): Promise<VersionSaveResult> {
  const sql = await db();
  return sql.begin(async (tx) => {
    const [cur] = await tx<{ updated_at: Date; updated_by: string }[]>`
      select updated_at, updated_by from project_reviews where project_code = ${code} and tool = ${tool} for update`;
    if (cur && !force && cur.updated_at.toISOString() !== expected) return { ok: false as const, reason: "conflict" as const, updatedAt: cur.updated_at, updatedBy: cur.updated_by };
    const id = await insertVersionTx(tx, { code, tool, name, note, schemaVersion, input, summary, auto: false, by });
    if (id === null) return { ok: false as const, reason: "limit" as const };
    const [row] = await tx<{ updated_at: Date }[]>`
      insert into project_reviews (project_code, tool, schema_version, input, summary, updated_by, updated_at)
      values (${code}, ${tool}, ${schemaVersion}, ${tx.json(input as never)}, ${tx.json(summary as never)}, ${by}, now())
      on conflict (project_code, tool) do update set schema_version = excluded.schema_version, input = excluded.input,
        summary = excluded.summary, updated_by = excluded.updated_by, updated_at = now()
      returning updated_at`;
    await tx`update projects set updated_at = now() where code = ${code}`;
    return { ok: true as const, updatedAt: row.updated_at, versionId: id };
  });
}

const stamp = (d: Date) =>
  d.toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false, month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

/** 設為目前檢討：原目前檢討先自動備份為版次，再以該版次取代 */
export async function restoreVersion(code: string, tool: string, id: number, by: string): Promise<{ ok: true } | { ok: false; reason: "missing" | "limit" }> {
  const sql = await db();
  return sql.begin(async (tx) => {
    const [v] = await tx<{ schema_version: number; input: unknown; summary: unknown }[]>`
      select schema_version, input, summary from project_review_versions where project_code = ${code} and tool = ${tool} and id = ${id}`;
    if (!v) return { ok: false as const, reason: "missing" as const };
    const [cur] = await tx<{ schema_version: number; input: unknown; summary: unknown; updated_at: Date }[]>`
      select schema_version, input, summary, updated_at from project_reviews where project_code = ${code} and tool = ${tool} for update`;
    if (cur) {
      const backup = await insertVersionTx(tx, {
        code,
        tool,
        name: `自動備份 ${stamp(new Date())}`,
        note: "設為目前檢討前之內容",
        schemaVersion: cur.schema_version,
        input: cur.input,
        summary: cur.summary,
        auto: true,
        by,
      });
      if (backup === null) return { ok: false as const, reason: "limit" as const };
    }
    await tx`
      insert into project_reviews (project_code, tool, schema_version, input, summary, updated_by, updated_at)
      values (${code}, ${tool}, ${v.schema_version}, ${tx.json(v.input as never)}, ${tx.json(v.summary as never)}, ${by}, now())
      on conflict (project_code, tool) do update set schema_version = excluded.schema_version, input = excluded.input,
        summary = excluded.summary, updated_by = excluded.updated_by, updated_at = now()`;
    await tx`update projects set updated_at = now() where code = ${code}`;
    return { ok: true as const };
  });
}

export async function removeVersion(code: string, tool: string, id: number): Promise<void> {
  const sql = await db();
  await sql`delete from project_review_versions where project_code = ${code} and tool = ${tool} and id = ${id}`;
}
