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
  page?: string;
}>;

export default async function ChannelPage({ searchParams }: { searchParams: SP }) {
  await requirePage("/channel");
  return (
    <ProjectsBoard
      kind="channel"
      title="通路 Pipeline"
      basePath="/channel"
      cookieCols="channel-cols"
      searchParams={searchParams}
    />
  );
}
