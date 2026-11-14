import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DeleteProjectForm, ProjectInfoForm, ResetPasswordForm } from "@/components/ProjectForms";
import { Card } from "@/components/ToolFields";
import { PROJECT_TOOLS, summaryText } from "@/lib/projects/tools";
import { getSession } from "@/server/auth";
import { getProject, listReviews, versionCounts } from "@/server/projects";
import { deleteProject, logout, resetProjectPassword, updateProject } from "../actions";

const dt = (d: Date) => d.toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false });

export default async function ProjectPage({ params }: PageProps<"/projects/[code]">) {
  const code = decodeURIComponent((await params).code);
  const session = await getSession();
  if (!session.admin && !session.projects.includes(code)) redirect(`/projects?code=${encodeURIComponent(code)}`);
  const project = await getProject(code);
  if (!project) notFound();
  const [list, counts] = await Promise.all([listReviews(code), versionCounts(code)]);
  const reviews = new Map(list.map((r) => [r.tool, r]));

  return (
    <>
      <section className="border-b border-line px-5 pt-11 pb-7">
        <div className="mx-auto max-w-3xl">
          <Link href="/projects" className="font-mono text-[0.72rem] text-muted hover:text-accent">
            ← 專案
          </Link>
          <p className="mt-3 font-mono text-[0.75rem] text-muted">{project.code}</p>
          <h1 className="mt-1 text-[1.7rem] font-extrabold text-balance">{project.name}</h1>
          <p className="mt-2 text-[0.85rem] text-muted">
            {[project.site, project.floors, project.total_area ? `${project.total_area.toLocaleString("zh-TW")} m²` : "", project.owner_staff && `負責人 ${project.owner_staff}`]
              .filter(Boolean)
              .join("・") || "尚未填寫專案資料"}
          </p>
        </div>
      </section>

      <section className="px-5 py-10">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <Card title="機電空間檢討">
            <div className="flex flex-col divide-y divide-line border border-line">
              {PROJECT_TOOLS.map((t) => {
                const r = reviews.get(t.slug);
                return (
                  <div key={t.slug} className="flex flex-wrap items-center justify-between gap-3 bg-background px-3 py-2.5">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-[0.88rem] font-bold">{t.name}</span>
                      {r ? (
                        <>
                          <span className="text-[0.75rem]">{summaryText(t.slug, r.summary)}</span>
                          <span className="font-mono text-[0.68rem] text-muted">
                            {dt(r.updated_at)}
                            {r.updated_by && `｜${r.updated_by}`}
                          </span>
                        </>
                      ) : (
                        <span className="text-[0.75rem] text-muted">{t.ready ? "未開始" : "尚未開放存入專案（可先用即時規劃試算）"}</span>
                      )}
                    </div>
                    {t.ready ? (
                      <div className="flex items-center gap-2">
                      {(counts.get(t.slug) ?? 0) > 0 && (
                        <Link href={`/projects/${encodeURIComponent(code)}/${t.slug}/versions`} className="text-[0.75rem] text-accent underline">
                          版次（{counts.get(t.slug)}）
                        </Link>
                      )}
                      <Link
                        href={`/projects/${encodeURIComponent(code)}/${t.slug}`}
                        className={`px-3 py-1 text-[0.78rem] font-bold ${r ? "border border-accent text-accent" : "bg-accent text-white"}`}
                      >
                        {r ? "開啟" : "開始檢討"}
                      </Link>
                      </div>
                    ) : (
                      <Link href={t.href} className="border border-line px-3 py-1 text-[0.75rem] text-muted hover:border-accent">
                        即時規劃
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="專案資料">
            <ProjectInfoForm
              action={updateProject.bind(null, code)}
              values={{
                name: project.name,
                site: project.site,
                floors: project.floors,
                total_area: project.total_area,
                owner_staff: project.owner_staff,
                note: project.note,
              }}
            />
          </Card>

          {session.admin && (
            <Card title="管理者">
              <ResetPasswordForm action={resetProjectPassword.bind(null, code)} />
              <div className="border-t border-dashed border-line pt-4">
                <DeleteProjectForm action={deleteProject.bind(null, code)} code={code} />
              </div>
            </Card>
          )}

          <form action={logout}>
            <button type="submit" className="border border-line bg-background px-2.5 py-1 text-[0.75rem] text-accent hover:border-accent">
              登出全部專案
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
