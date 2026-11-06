import "server-only";
import postgres from "postgres";

// 連線字串由 Vercel 環境變數提供（Neon 整合自動寫入 DATABASE_URL 或 POSTGRES_URL），不進 repo。
const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

type Sql = ReturnType<typeof postgres>;
const g = globalThis as unknown as { __allcomSql?: Sql; __allcomSchema?: Promise<void> };

export function dbConfigured() {
  return Boolean(url);
}

function client(): Sql {
  if (!url) throw new Error("資料庫尚未設定（DATABASE_URL）");
  g.__allcomSql ??= postgres(url, { max: 3, idle_timeout: 20, onnotice: () => {}, ssl: /localhost|127\.0\.0\.1/.test(url) ? false : "require" });
  return g.__allcomSql;
}

/** 首次使用時建立資料表（docs/projects-spec.md 第 2.1 節） */
async function ensureSchema(sql: Sql) {
  await sql`
    create table if not exists projects (
      code text primary key,
      name text not null,
      site text not null default '',
      floors text not null default '',
      total_area numeric,
      owner_staff text not null default '',
      note text not null default '',
      password_hash text not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )`;
  await sql`
    create table if not exists project_reviews (
      project_code text not null references projects(code) on delete cascade,
      tool text not null,
      schema_version int not null,
      input jsonb not null,
      summary jsonb,
      updated_by text not null default '',
      updated_at timestamptz not null default now(),
      primary key (project_code, tool)
    )`;
  await sql`
    create table if not exists login_attempts (
      key text primary key,
      count int not null default 0,
      first_at timestamptz not null default now(),
      locked_until timestamptz
    )`;
}

export async function db(): Promise<Sql> {
  const sql = client();
  g.__allcomSchema ??= ensureSchema(sql).catch((e) => {
    g.__allcomSchema = undefined;
    throw e;
  });
  await g.__allcomSchema;
  return sql;
}
