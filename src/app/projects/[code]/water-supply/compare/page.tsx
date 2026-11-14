import { ComparePage } from "@/components/ProjectVersionPages";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function Page({ params, searchParams }: PageProps<"/projects/[code]/water-supply/compare">) {
  const [{ code }, q] = await Promise.all([params, searchParams]);
  return <ComparePage code={decodeURIComponent(code)} tool="water-supply" a={one(q.a)} b={one(q.b)} />;
}
