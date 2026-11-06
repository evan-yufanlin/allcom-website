import "server-only";
import { cookies, headers } from "next/headers";
import { EMPTY_SESSION, SESSION_COOKIE, SESSION_DAYS, canAccess, readSession, signSession, type ProjectSession } from "@/lib/projects/session";
import { db } from "@/server/db";

const secret = () => {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET 未設定或長度不足 32");
  return s;
};

export function authConfigured() {
  return Boolean(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32 && process.env.ADMIN_PASSWORD);
}

export async function getSession(): Promise<ProjectSession> {
  if (!authConfigured()) return EMPTY_SESSION;
  const store = await cookies();
  return readSession(store.get(SESSION_COOKIE)?.value, secret());
}

export async function setSession(s: ProjectSession) {
  const store = await cookies();
  if (!s.admin && s.projects.length === 0) {
    // 刪除時路徑須與設定時相同
    store.set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/projects", maxAge: 0 });
    return;
  }
  store.set(SESSION_COOKIE, await signSession(s, secret()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/projects",
    maxAge: SESSION_DAYS * 86400,
  });
}

export async function hasProjectAccess(code: string) {
  return canAccess(await getSession(), code);
}

// ---- 登入失敗限制：同一來源連續 5 次失敗，暫停 10 分鐘 ----

const MAX_FAILS = 5;
const LOCK_MIN = 10;

async function clientKey(target: string) {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "local";
  return `${ip}|${target}`;
}

/** 回傳鎖定剩餘分鐘數；未鎖定回傳 0 */
export async function lockedMinutes(target: string): Promise<number> {
  const sql = await db();
  const [row] = await sql<{ locked_until: Date | null }[]>`select locked_until from login_attempts where key = ${await clientKey(target)}`;
  const until = row?.locked_until?.getTime() ?? 0;
  return until > Date.now() ? Math.ceil((until - Date.now()) / 60000) : 0;
}

export async function recordFailure(target: string) {
  const sql = await db();
  const key = await clientKey(target);
  await sql`
    insert into login_attempts (key, count, first_at) values (${key}, 1, now())
    on conflict (key) do update set
      count = case when login_attempts.first_at < now() - interval '10 minutes' then 1 else login_attempts.count + 1 end,
      first_at = case when login_attempts.first_at < now() - interval '10 minutes' then now() else login_attempts.first_at end`;
  await sql`
    update login_attempts set locked_until = now() + make_interval(mins => ${LOCK_MIN}), count = 0, first_at = now()
    where key = ${key} and count >= ${MAX_FAILS}`;
}

export async function clearFailures(target: string) {
  const sql = await db();
  await sql`delete from login_attempts where key = ${await clientKey(target)}`;
}
