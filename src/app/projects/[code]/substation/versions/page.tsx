import { VersionsPage } from "@/components/ProjectVersionPages";

export default async function Page({ params }: PageProps<"/projects/[code]/substation/versions">) {
  return <VersionsPage code={decodeURIComponent((await params).code)} tool="substation" />;
}
