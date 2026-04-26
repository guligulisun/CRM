import { ProjectsBoard } from "@/components/projects-board";
import { requirePage } from "@/lib/auth";

type SP = Promise<{
  customer?: string;
  status?: string;
  sales?: string;
  pm?: string;
  q?: string;
  sort?: string;
  dir?: string;
}>;

export default async function ProjectsPage({ searchParams }: { searchParams: SP }) {
  await requirePage("/projects");
  return (
    <ProjectsBoard
      kind="project"
      title="專案Pipeline"
      basePath="/projects"
      cookieCols="projects-cols"
      searchParams={searchParams}
    />
  );
}
