import { VersionsPage } from "@/components/ProjectVersionPages";

export default async function Page({ params }: PageProps<"/projects/[code]/water-supply/versions">) {
  return <VersionsPage code={decodeURIComponent((await params).code)} tool="water-supply" />;
}
