import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import SubstationTool from "@/components/SubstationTool";
import { parseSubstationInput } from "@/lib/projects/tools";
import { getSession } from "@/server/auth";
import { getProject, getReview } from "@/server/projects";

export default async function ProjectSubstationPage({ params }: PageProps<"/projects/[code]/substation">) {
  const code = decodeURIComponent((await params).code);
  const session = await getSession();
  if (!session.admin && !session.projects.includes(code)) redirect(`/projects?code=${encodeURIComponent(code)}`);
  const project = await getProject(code);
  if (!project) notFound();
  const review = await getReview(code, "substation");
  const initial = review ? parseSubstationInput(review.input) : null;

  return (
    <>
      <section className="border-b border-line px-5 pt-11 pb-7">
        <div className="mx-auto max-w-4xl">
          <Link href={`/projects/${encodeURIComponent(code)}`} className="font-mono text-[0.72rem] text-muted hover:text-accent">
            ← {project.code} {project.name}
          </Link>
          <h1 className="mt-3 text-[1.7rem] font-extrabold text-balance">自設變電站空間檢討</h1>
        </div>
      </section>

      <section className="px-5 py-10">
        <SubstationTool
          project={{
            code,
            name: project.name,
            savedAt: review?.updated_at.toISOString() ?? null,
            savedBy: review?.updated_by ?? "",
          }}
          initial={initial}
        />
      </section>
    </>
  );
}
