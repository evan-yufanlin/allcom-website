// 專案密碼雜湊（docs/projects-spec.md 第 1 節）：scrypt 加鹽，只存雜湊不存原文。
// 純模組：可由 scripts/verify-projects.ts 以 node 直接執行。
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const KEYLEN = 32;

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => scrypt(password.normalize("NFKC"), salt, KEYLEN, (err, key) => (err ? reject(err) : resolve(key))));
}

/** 回傳「scrypt$鹽$雜湊」（base64url） */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [kind, salt, hash] = stored.split("$");
  if (kind !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const key = await derive(password, Buffer.from(salt, "base64url"));
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** 管理密碼等固定字串比對（等時） */
export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a.normalize("NFKC"));
  const y = Buffer.from(b.normalize("NFKC"));
  return x.length === y.length && timingSafeEqual(x, y);
}

export const PASSWORD_MIN = 6;
