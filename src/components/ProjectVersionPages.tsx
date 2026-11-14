// 專案檢討版次頁面（docs/project-versions-spec.md 第 2、3 節）：版次清單、版次檢視、比較。
// 伺服器元件；各工具之頁面檔只傳入工具代號。
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { deleteProjectVersion, restoreProjectVersion } from "@/app/projects/actions";
import SubstationPlan from "@/components/SubstationPlan";
import SubstationTool from "@/components/SubstationTool";
import { Card } from "@/components/ToolFields";
import { DeleteVersionButton, RestoreVersionButton } from "@/components/VersionActions";
import WaterSupplyTool from "@/components/WaterSupplyTool";
import { compareSubstation, compareWaterSupply, type Comparison } from "@/lib/projects/compare";
import { PROJECT_TOOLS, REVIEW_HANDLERS, summaryText, type ProjectToolSlug, type SubstationInput } from "@/lib/projects/tools";
import { calculateSubstation } from "@/lib/substation";
import { buildDrawing } from "@/lib/substationDrawing";
import type { WaterSupplyForm } from "@/lib/waterSupplyForm";
import { getSession } from "@/server/auth";
import { VERSION_LIMIT, getProject, getReview, getVersion, listVersions, type ProjectRow } from "@/server/projects";

const dt = (d: Date) => d.toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false });
const toolName = (tool: ProjectToolSlug) => PROJECT_TOOLS.find((t) => t.slug === tool)!.name;
const base = (code: string, tool: ProjectToolSlug) => `/projects/${encodeURIComponent(code)}/${tool}`;

async function guard(code: string) {
  const session = await getSession();
  if (!session.admin && !session.projects.includes(code)) redirect(`/projects?code=${encodeURIComponent(code)}`);
  const project = await getProject(code);
  if (!project) notFound();
  return { session, project };
}

/** 鍵順序無關之 JSON（資料庫 jsonb 會重排物件鍵） */
const canon = (v: unknown): string =>
  Array.isArray(v)
    ? `[${v.map(canon).join(",")}]`
    : v && typeof v === "object"
      ? `{${Object.keys(v)
          .sort()
          .map((k) => `${JSON.stringify(k)}:${canon((v as Record<string, unknown>)[k])}`)
          .join(",")}}`
      : JSON.stringify(v ?? null);

/** 以現行規則重算摘要；與存檔時不同者回傳現行摘要文字 */
function recheck(tool: ProjectToolSlug, input: unknown, stored: unknown): { parsed: unknown; changed: string | null } {
  const h = REVIEW_HANDLERS[tool];
  const parsed = h.parse(input);
  if (!parsed) return { parsed: null, changed: null };
  const now = h.summarize(parsed as never);
  return { parsed, changed: canon(now) === canon(stored) ? null : summaryText(tool, now) };
}

function Header({ project, tool, title, children }: { project: ProjectRow; tool: ProjectToolSlug; title: string; children?: ReactNode }) {
  return (
    <section className="border-b border-line px-5 pt-11 pb-7">
      <div className="mx-auto flex max-w-4xl flex-col gap-1">
        <Link href={`/projects/${encodeURIComponent(project.code)}`} className="font-mono text-[0.72rem] text-muted hover:text-accent">
          ← {project.code} {project.name}
        </Link>
        <Link href={base(project.code, tool)} className="mt-2 text-[0.8rem] text-accent hover:underline">
          {toolName(tool)}
        </Link>
        <h1 className="text-[1.6rem] font-extrabold text-balance">{title}</h1>
        {children}
      </div>
    </section>
  );
}

const Rule = ({ text }: { text: string }) => (
  <p className="text-[0.72rem] text-[var(--phase-r)]">依現行規則重算，結果與存檔時不同：{text}</p>
);

// ---- 版次清單 ----

export async function VersionsPage({ code, tool }: { code: string; tool: ProjectToolSlug }) {
  const { session, project } = await guard(code);
  const [current, versions] = await Promise.all([getReview(code, tool), listVersions(code, tool)]);
  const options = [...(current ? [{ value: "current", label: "目前檢討" }] : []), ...versions.map((v) => ({ value: String(v.id), label: v.name }))];

  return (
    <>
      <Header project={project} tool={tool} title="版次">
        <p className="text-[0.8rem] text-muted">
          共 {versions.length} 個版次（上限 {VERSION_LIMIT}）。於檢討頁按「另存版次」新增；刪除限管理者。
        </p>
      </Header>
      <section className="px-5 py-10">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          {options.length >= 2 && (
            <Card title="比較">
              <form action={`${base(code, tool)}/compare`} className="flex flex-wrap items-end gap-3">
                {(["a", "b"] as const).map((k, i) => (
                  <label key={k} className="flex min-w-0 flex-col gap-1">
                    <span className="text-[0.72rem] text-muted">{k === "a" ? "比較基準（舊）" : "比較對象（新）"}</span>
                    <select
                      name={k}
                      defaultValue={k === "a" ? (options[1]?.value ?? options[0].value) : options[0].value}
                      className="max-w-[18rem] border border-line bg-background px-2 py-1.5 text-[0.85rem]"
                      aria-label={i === 0 ? "比較基準" : "比較對象"}
                    >
                      {options.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
                <button type="submit" className="bg-accent px-4 py-1.5 text-[0.82rem] font-bold text-white">
                  比較
                </button>
              </form>
            </Card>
          )}

          <Card title="目前檢討">
            {current ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[0.8rem]">{summaryText(tool, current.summary)}</span>
                  <span className="font-mono text-[0.68rem] text-muted">
                    {dt(current.updated_at)}
                    {current.updated_by && `｜${current.updated_by}`}
                  </span>
                </div>
                <Link href={base(code, tool)} className="bg-accent px-3 py-1 text-[0.78rem] font-bold text-white">
                  開啟
                </Link>
              </div>
            ) : (
              <p className="text-[0.8rem] text-muted">尚未儲存</p>
            )}
          </Card>

          <Card title="已存版次">
            {versions.length === 0 ? (
              <p className="text-[0.8rem] text-muted">尚無版次。於檢討頁按「另存版次」即可保留當下內容。</p>
            ) : (
              <div className="flex flex-col divide-y divide-line border border-line">
                {versions.map((v) => {
                  const { changed } = recheck(tool, v.input, v.summary);
                  return (
                    <div key={v.id} className="flex flex-col gap-2 bg-background px-3 py-2.5">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-[0.9rem] font-bold">{v.name}</span>
                        {v.auto && <span className="bg-accent-soft px-1.5 font-mono text-[0.62rem] text-accent">自動備份</span>}
                        <span className="font-mono text-[0.68rem] text-muted">
                          {dt(v.created_at)}
                          {v.created_by && `｜${v.created_by}`}
                        </span>
                      </div>
                      {v.note && <span className="text-[0.75rem] text-muted">{v.note}</span>}
                      <span className="text-[0.78rem]">{summaryText(tool, v.summary)}</span>
                      {changed && <Rule text={changed} />}
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`${base(code, tool)}/versions/${v.id}`} className="border border-line px-2.5 py-1 text-[0.75rem] hover:border-accent">
                          檢視
                        </Link>
                        {current && (
                          <Link href={`${base(code, tool)}/compare?a=${v.id}&b=current`} className="border border-line px-2.5 py-1 text-[0.75rem] hover:border-accent">
                            與目前檢討比較
                          </Link>
                        )}
                        <RestoreVersionButton action={restoreProjectVersion.bind(null, code, tool, v.id)} name={v.name} compact />
                        {session.admin && <DeleteVersionButton action={deleteProjectVersion.bind(null, code, tool, v.id)} name={v.name} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </section>
    </>
  );
}

// ---- 版次檢視（唯讀） ----

export async function VersionViewPage({ code, tool, id }: { code: string; tool: ProjectToolSlug; id: string }) {
  const { session, project } = await guard(code);
  const v = /^\d+$/.test(id) ? await getVersion(code, tool, Number(id)) : null;
  if (!v) notFound();
  const { parsed, changed } = recheck(tool, v.input, v.summary);
  if (!parsed) notFound();

  return (
    <>
      <Header project={project} tool={tool} title={`版次：${v.name}`}>
        <p className="font-mono text-[0.72rem] text-muted">
          {dt(v.created_at)}
          {v.created_by && `｜${v.created_by}`}
          {v.auto && "｜自動備份"}
        </p>
        {v.note && <p className="text-[0.8rem] text-muted">{v.note}</p>}
      </Header>
      <section className="px-5 py-10">
        <div className="mx-auto mb-6 flex max-w-3xl flex-col gap-2 border border-accent bg-accent-soft p-3 sm:p-4">
          <p className="text-[0.8rem] font-bold">唯讀檢視：此版次不可修改，可存 PDF。要以此版次繼續修改，請按「設為目前檢討」。</p>
          <p className="text-[0.78rem]">存檔時結果：{summaryText(tool, v.summary)}</p>
          {changed && <Rule text={changed} />}
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`${base(code, tool)}/versions`} className="border border-line bg-background px-2.5 py-1 text-[0.75rem] hover:border-accent">
              ← 版次清單
            </Link>
            <Link href={`${base(code, tool)}/compare?a=${v.id}&b=current`} className="border border-line bg-background px-2.5 py-1 text-[0.75rem] hover:border-accent">
              與目前檢討比較
            </Link>
            <RestoreVersionButton action={restoreProjectVersion.bind(null, code, tool, v.id)} name={v.name} />
            {session.admin && <DeleteVersionButton action={deleteProjectVersion.bind(null, code, tool, v.id)} name={v.name} />}
          </div>
        </div>
        {tool === "substation" ? (
          <SubstationTool initial={parsed as SubstationInput} readOnly />
        ) : (
          <WaterSupplyTool initial={parsed as WaterSupplyForm} readOnly />
        )}
      </section>
    </>
  );
}

// ---- 比較 ----

interface Side {
  label: string;
  meta: string;
  input: unknown;
  changed: string | null;
}

async function loadSide(code: string, tool: ProjectToolSlug, key: string | undefined): Promise<Side | null> {
  if (key === "current") {
    const r = await getReview(code, tool);
    if (!r) return null;
    const { parsed } = recheck(tool, r.input, r.summary);
    return parsed ? { label: "目前檢討", meta: `${dt(r.updated_at)}${r.updated_by ? `｜${r.updated_by}` : ""}`, input: parsed, changed: null } : null;
  }
  if (!key || !/^\d+$/.test(key)) return null;
  const v = await getVersion(code, tool, Number(key));
  if (!v) return null;
  const { parsed, changed } = recheck(tool, v.input, v.summary);
  return parsed ? { label: v.name, meta: `${dt(v.created_at)}${v.created_by ? `｜${v.created_by}` : ""}`, input: parsed, changed } : null;
}

export async function ComparePage({ code, tool, a, b }: { code: string; tool: ProjectToolSlug; a?: string; b?: string }) {
  const { project } = await guard(code);
  const [A, B] = await Promise.all([loadSide(code, tool, a), loadSide(code, tool, b)]);
  if (!A || !B) notFound();
  const cmp: Comparison =
    tool === "substation"
      ? compareSubstation(A.input as SubstationInput, B.input as SubstationInput)
      : compareWaterSupply(A.input as WaterSupplyForm, B.input as WaterSupplyForm);

  return (
    <>
      <Header project={project} tool={tool} title="版次比較">
        <Link href={`${base(code, tool)}/versions`} className="text-[0.75rem] text-muted hover:text-accent">
          ← 版次清單
        </Link>
      </Header>
      <section className="px-5 py-10">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          <Card title="結果">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] border-collapse text-[0.8rem] tabular-nums">
                <thead>
                  <tr className="bg-accent-soft text-left">
                    <th className="border border-line px-2 py-1.5">項目</th>
                    {[A, B].map((s, i) => (
                      <th key={i} className="border border-line px-2 py-1.5">
                        <span className="block font-bold">{s.label}</span>
                        <span className="block font-mono text-[0.65rem] font-normal text-muted">{s.meta}</span>
                      </th>
                    ))}
                    <th className="border border-line px-2 py-1.5">差異</th>
                  </tr>
                </thead>
                <tbody>
                  {cmp.metrics.map((m) => (
                    <tr key={m.label} className={m.changed ? "bg-accent-soft/50" : ""}>
                      <td className="border border-line px-2 py-1.5 font-bold">{m.label}</td>
                      <td className="border border-line px-2 py-1.5 font-mono">{m.a}</td>
                      <td className={`border border-line px-2 py-1.5 font-mono ${m.changed ? "font-bold text-accent" : ""}`}>{m.b}</td>
                      <td className="border border-line px-2 py-1.5 font-mono">{m.diff ?? (m.changed ? "不同" : "")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {[A, B].map((s, i) => s.changed && <Rule key={i} text={`「${s.label}」現行結果 ${s.changed}`} />)}
            <p className="text-[0.7rem] text-muted">結果均依現行規則計算。</p>
          </Card>

          <Card title={`輸入差異（${cmp.changes.length} 項）`}>
            {cmp.changes.length ? (
              <ul className="flex list-disc flex-col gap-1 pl-5 text-[0.8rem]">
                {cmp.changes.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            ) : (
              <p className="text-[0.8rem] text-muted">兩者輸入相同</p>
            )}
          </Card>

          {tool === "substation" && (
            <Card title="平面示意圖">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[A, B].map((s, i) => {
                  const inp = s.input as SubstationInput;
                  const r = calculateSubstation(inp.rows, inp.clearances);
                  return (
                    <figure key={i} className="flex flex-col gap-1.5">
                      <figcaption className="text-[0.78rem] font-bold">{s.label}</figcaption>
                      {r.rows.length ? (
                        <div className="border border-line bg-background p-2">
                          <SubstationPlan d={buildDrawing(r)} />
                        </div>
                      ) : (
                        <p className="text-[0.75rem] text-muted">無設備</p>
                      )}
                    </figure>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </section>
    </>
  );
}
