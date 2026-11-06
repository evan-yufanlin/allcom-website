import Link from "next/link";
import { CreateProjectForm, LoginAdminForm, LoginProjectForm } from "@/components/ProjectForms";
import { Card } from "@/components/ToolFields";
import { authConfigured, getSession } from "@/server/auth";
import { dbConfigured } from "@/server/db";
import { getProject, listProjects } from "@/server/projects";
import { createProject, loginAdmin, loginProject, logout } from "./actions";

const dt = (d: Date) => d.toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false });

export default async function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  const sp = await searchParams;
  const code = typeof sp.code === "string" ? sp.code : undefined;
  const ready = dbConfigured() && authConfigured();
  const session = ready ? await getSession() : { admin: false, projects: [] };
  const mine = ready ? (await Promise.all(session.projects.map(getProject))).filter((p) => p !== null) : [];
  const all = ready && session.admin ? await listProjects() : [];

  return (
    <>
      <section className="border-b border-line px-5 pt-11 pb-7">
        <div className="mx-auto max-w-3xl">
          <span className="eyebrow">Projects</span>
          <h1 className="mt-2 text-[1.7rem] font-extrabold">專案機電空間檢討</h1>
          <p className="mt-2.5 max-w-[50ch] text-[0.92rem] leading-relaxed text-muted">
            汎德內部使用。依專案保存各機電空間檢討，可分次檢討、陸續修改；一般試算請使用
            <Link href="/tools" className="text-accent hover:underline">
              即時規劃
            </Link>
            。
          </p>
        </div>
      </section>

      <section className="px-5 py-10">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          {!ready && (
            <p className="border border-dashed border-[var(--phase-r)] p-4 text-[0.85rem]">
              專案功能尚未啟用：需於 Vercel 設定資料庫（DATABASE_URL）、管理密碼（ADMIN_PASSWORD）與 SESSION_SECRET。
            </p>
          )}

          {ready && (mine.length > 0 || session.admin) && (
            <div className="flex flex-wrap items-center justify-between gap-2 border border-line bg-surface px-4 py-3 text-[0.82rem]">
              <span>
                {session.admin ? "管理者已登入" : "已登入專案"}
                {mine.length > 0 && "："}
                {mine.map((p) => (
                  <Link key={p.code} href={`/projects/${encodeURIComponent(p.code)}`} className="ml-2 text-accent hover:underline">
                    {p.code} {p.name}
                  </Link>
                ))}
              </span>
              <form action={logout}>
                <button type="submit" className="border border-line bg-background px-2.5 py-1 text-[0.75rem] text-accent hover:border-accent">
                  登出
                </button>
              </form>
            </div>
          )}

          {ready && session.admin && (
            <>
              <Card title="全部專案">
                {all.length === 0 ? (
                  <p className="text-[0.82rem] text-muted">尚無專案</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[34rem] border-collapse text-[0.78rem]">
                      <thead>
                        <tr className="bg-accent-soft text-left">
                          {["專案編號", "專案名稱", "基地位置", "負責人", "已檢討", "最後修改"].map((h) => (
                            <th key={h} className="border border-line px-2 py-1.5 font-bold whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {all.map((p) => (
                          <tr key={p.code}>
                            <td className="border border-line px-2 py-1.5 font-mono whitespace-nowrap">
                              <Link href={`/projects/${encodeURIComponent(p.code)}`} className="text-accent hover:underline">
                                {p.code}
                              </Link>
                            </td>
                            <td className="border border-line px-2 py-1.5">{p.name}</td>
                            <td className="border border-line px-2 py-1.5">{p.site || "—"}</td>
                            <td className="border border-line px-2 py-1.5">{p.owner_staff || "—"}</td>
                            <td className="border border-line px-2 py-1.5 font-mono">{p.reviews}</td>
                            <td className="border border-line px-2 py-1.5 font-mono whitespace-nowrap">{dt(p.updated_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
              <Card title="新增專案">
                <CreateProjectForm action={createProject} />
              </Card>
            </>
          )}

          {ready && (
            <Card title="進入專案">
              <LoginProjectForm action={loginProject} code={code} />
            </Card>
          )}
          {ready && !session.admin && (
            <Card title="管理者">
              <p className="text-[0.75rem] text-muted">管理者可檢視全部專案、新增專案、重設專案密碼及刪除專案。</p>
              <LoginAdminForm action={loginAdmin} />
            </Card>
          )}
        </div>
      </section>
    </>
  );
}
