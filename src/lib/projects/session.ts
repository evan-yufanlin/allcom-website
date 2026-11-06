// 專案登入憑證（docs/projects-spec.md 第 1 節）：簽章 JWT，存於 HttpOnly cookie，有效 7 天。
// 純模組：簽章金鑰由呼叫端傳入，可由 scripts/verify-projects.ts 直接執行。
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "allcom_projects";
export const SESSION_DAYS = 7;

export interface ProjectSession {
  /** 以管理密碼登入 */
  admin: boolean;
  /** 已以專案密碼登入之專案編號 */
  projects: string[];
}

export const EMPTY_SESSION: ProjectSession = { admin: false, projects: [] };

const key = (secret: string) => new TextEncoder().encode(secret);

export async function signSession(s: ProjectSession, secret: string, now = Date.now()): Promise<string> {
  return new SignJWT({ admin: s.admin, projects: s.projects })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(Math.floor(now / 1000))
    .setExpirationTime(Math.floor(now / 1000) + SESSION_DAYS * 86400)
    .sign(key(secret));
}

export async function readSession(token: string | undefined, secret: string, now = Date.now()): Promise<ProjectSession> {
  if (!token) return EMPTY_SESSION;
  try {
    const { payload } = await jwtVerify(token, key(secret), { algorithms: ["HS256"], currentDate: new Date(now) });
    const projects = Array.isArray(payload.projects) ? payload.projects.filter((p): p is string => typeof p === "string") : [];
    return { admin: payload.admin === true, projects };
  } catch {
    return EMPTY_SESSION;
  }
}

export const canAccess = (s: ProjectSession, code: string) => s.admin || s.projects.includes(code);

/** 專案編號：英數字、連字號、底線，1～20 字（建議「年度-流水號」，例：2026-001） */
export const CODE_PATTERN = /^[A-Za-z0-9_-]{1,20}$/;
