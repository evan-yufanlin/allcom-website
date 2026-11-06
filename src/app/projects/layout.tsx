import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "專案機電空間檢討",
  robots: { index: false, follow: false },
};

export default function ProjectsLayout({ children }: LayoutProps<"/projects">) {
  return children;
}
