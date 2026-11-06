import "server-only";
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
