import { VersionViewPage } from "@/components/ProjectVersionPages";

export default async function Page({ params }: PageProps<"/projects/[code]/water-supply/versions/[id]">) {
  const { code, id } = await params;
  return <VersionViewPage code={decodeURIComponent(code)} tool="water-supply" id={id} />;
}
