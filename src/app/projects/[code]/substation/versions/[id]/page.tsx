import { VersionViewPage } from "@/components/ProjectVersionPages";

export default async function Page({ params }: PageProps<"/projects/[code]/substation/versions/[id]">) {
  const { code, id } = await params;
  return <VersionViewPage code={decodeURIComponent(code)} tool="substation" id={id} />;
}
