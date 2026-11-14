import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import WaterSupplyTool from "@/components/WaterSupplyTool";
import { parseWaterSupplyForm } from "@/lib/waterSupplyForm";
import { getSession } from "@/server/auth";
import { getProject, getReview, versionCounts } from "@/server/projects";

export default async function ProjectWaterSupplyPage({ params }: PageProps<"/projects/[code]/water-supply">) {
  const code = decodeURIComponent((await params).code);
  const session = await getSession();
  if (!session.admin && !session.projects.includes(code)) redirect(`/projects?code=${encodeURIComponent(code)}`);
  const project = await getProject(code);
  if (!project) notFound();
  const [review, counts] = await Promise.all([getReview(code, "water-supply"), versionCounts(code)]);
  const initial = review ? parseWaterSupplyForm(review.input) : null;

  return (
    <>
      <section className="border-b border-line px-5 pt-11 pb-7">
        <div className="mx-auto max-w-3xl">
          <Link href={`/projects/${encodeURIComponent(code)}`} className="font-mono text-[0.72rem] text-muted hover:text-accent">
            ← {project.code} {project.name}
          </Link>
          <h1 className="mt-3 text-[1.7rem] font-extrabold text-balance">給水水理計算（自來水水箱）</h1>
        </div>
      </section>

      <section className="px-5 py-10">
        <WaterSupplyTool
          project={{
            code,
            name: project.name,
            savedAt: review?.updated_at.toISOString() ?? null,
            savedBy: review?.updated_by ?? "",
            versions: counts.get("water-supply") ?? 0,
          }}
          initial={initial}
        />
      </section>
    </>
  );
}
