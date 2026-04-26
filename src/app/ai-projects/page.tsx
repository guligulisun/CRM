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

export default async function AiProjectsPage({ searchParams }: { searchParams: SP }) {
  await requirePage("/ai-projects");
  return (
    <ProjectsBoard
      kind="ai"
      title="解鎖AI Pipeline"
      basePath="/ai-projects"
      cookieCols="ai-projects-cols"
      searchParams={searchParams}
    />
  );
}
