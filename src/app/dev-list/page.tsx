import Link from "next/link";
import { readAll } from "@/lib/db";
import { Badge, Card, Field, PageHeader, inputClass } from "@/components/ui";
import { AddDevProjectModal } from "@/components/add-dev-project-modal";
import { AddProgressInline } from "@/components/add-progress-inline";
import { DevModalManager, DevNameTrigger } from "@/components/dev-modal-manager";
import { createProject } from "@/app/projects/actions";
import { requirePage } from "@/lib/auth";
import { DEV_STAGES, PROJECT_STATUSES } from "@/lib/types";
import type { Person, Project } from "@/lib/types";
import {
  addDevTracking,
  addMilestone,
  deleteDevTracking,
  deleteMilestone,
  removeFromDevList,
  updateDevProject,
  updateDevStage,
  updateDevTracking,
  updateMilestone,
} from "./actions";

const GRID =
  "grid grid-cols-[110px_70px_minmax(140px,1fr)_minmax(160px,1fr)_70px_70px_70px_80px_minmax(180px,1.3fr)_minmax(180px,1.3fr)] items-stretch gap-2 px-3";

const SORTABLE = new Set([
  "customer",
  "sales",
  "pm",
  "status",
  "devStage",
  "milestone",
  "tracking",
]);

const STATUS_ORDER: Record<string, number> = Object.fromEntries(
  PROJECT_STATUSES.map((s, i) => [s, i]),
);
const DEV_STAGE_ORDER: Record<string, number> = Object.fromEntries(
  DEV_STAGES.map((s, i) => [s, i]),
);

const DEV_STAGE_COLOR: Record<string, string> = {
  需求: "bg-amber-100 text-amber-700",
  開發: "bg-sky-100 text-sky-700",
  測試: "bg-orange-100 text-orange-700",
  完成: "bg-emerald-100 text-emerald-700",
  停止: "bg-rose-100 text-rose-700",
  擱置: "bg-zinc-200 text-zinc-600",
};

type SP = Promise<{
  q?: string;
  pm?: string;
  rd?: string;
  devStage?: string;
  sort?: string;
  dir?: string;
}>;

export default async function DevListPage({ searchParams }: { searchParams: SP }) {
  await requirePage("/dev-list");
  const sp = await searchParams;
  const [projects, milestones, devTracking, people] = await Promise.all([
    readAll("projects"),
    readAll("milestones"),
    readAll("devTracking"),
    readAll("people"),
  ]);
  const pmList = pickNames(people, "pm");
  const rdList = pickNames(people, "rd");
  const salesList = pickNames(people, "sales");
  const progressPeople = Array.from(new Set([...pmList, ...rdList])).sort((a, b) =>
    a.localeCompare(b, "zh-Hant"),
  );

  const milestonesByProject = new Map<string, typeof milestones>();
  const latestMilestoneByProject = new Map<string, string>();
  for (const m of milestones) {
    const arr = milestonesByProject.get(m.projectId) ?? [];
    arr.push(m);
    milestonesByProject.set(m.projectId, arr);
    const cur = latestMilestoneByProject.get(m.projectId);
    if (!cur || m.date > cur) latestMilestoneByProject.set(m.projectId, m.date);
  }
  const trackingByProject = new Map<string, typeof devTracking>();
  const latestTrackingByProject = new Map<string, string>();
  for (const t of devTracking) {
    const arr = trackingByProject.get(t.projectId) ?? [];
    arr.push(t);
    trackingByProject.set(t.projectId, arr);
    const cur = latestTrackingByProject.get(t.projectId);
    if (!cur || t.date > cur) latestTrackingByProject.set(t.projectId, t.date);
  }

  let rdProjects = projects.filter((p) => {
    const k = p.kind ?? "project";
    if (k === "dev") return true;
    const r = p.rdStatus ?? "";
    return (r === "啟動" || r === "結束") && (k === "project" || k === "ai");
  });

  const distinctPms = Array.from(
    new Set(rdProjects.map((p) => p.pm).filter((s) => s)),
  ).sort((a, b) => a.localeCompare(b, "zh-Hant"));
  const distinctRds = Array.from(
    new Set(rdProjects.map((p) => p.rd).filter((s) => s)),
  ).sort((a, b) => a.localeCompare(b, "zh-Hant"));

  rdProjects = rdProjects.filter((p) => {
    if (sp.pm && p.pm !== sp.pm) return false;
    if (sp.rd && p.rd !== sp.rd) return false;
    if (sp.devStage && (p.devStage ?? "") !== sp.devStage) return false;
    if (sp.q) {
      const q = sp.q.toLowerCase();
      const hay = `${p.name} ${p.customer} ${p.description} ${p.sales}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const sortKey = sp.sort && SORTABLE.has(sp.sort) ? sp.sort : "";
  const dirMul = sp.dir === "desc" ? -1 : 1;
  const defaultCmp = (a: Project, b: Project) =>
    (a.customer || "").localeCompare(b.customer || "", "zh-Hant") ||
    a.name.localeCompare(b.name, "zh-Hant");
  const strCmp = (a: Project, b: Project, key: keyof Project) =>
    (String(a[key] ?? "").localeCompare(String(b[key] ?? ""), "zh-Hant") || defaultCmp(a, b)) *
    dirMul;
  rdProjects.sort((a, b) => {
    if (sortKey === "customer") return strCmp(a, b, "customer");
    if (sortKey === "sales") return strCmp(a, b, "sales");
    if (sortKey === "pm") return strCmp(a, b, "pm");
    if (sortKey === "status") {
      const oa = STATUS_ORDER[a.status] ?? 999;
      const ob = STATUS_ORDER[b.status] ?? 999;
      return ((oa - ob) || defaultCmp(a, b)) * dirMul;
    }
    if (sortKey === "devStage") {
      const oa = DEV_STAGE_ORDER[a.devStage ?? ""] ?? 999;
      const ob = DEV_STAGE_ORDER[b.devStage ?? ""] ?? 999;
      return ((oa - ob) || defaultCmp(a, b)) * dirMul;
    }
    if (sortKey === "milestone") {
      const la = latestMilestoneByProject.get(a.id) ?? "";
      const lb = latestMilestoneByProject.get(b.id) ?? "";
      return ((la > lb ? 1 : la < lb ? -1 : 0) || defaultCmp(a, b)) * dirMul;
    }
    if (sortKey === "tracking") {
      const la = latestTrackingByProject.get(a.id) ?? "";
      const lb = latestTrackingByProject.get(b.id) ?? "";
      return ((la > lb ? 1 : la < lb ? -1 : 0) || defaultCmp(a, b)) * dirMul;
    }
    return defaultCmp(a, b);
  });

  const modals: Record<
    string,
    {
      project: {
        id: string;
        kind: string;
        customer: string;
        name: string;
        description: string;
        sales: string;
        pm: string;
        rd: string;
        status: string;
        devStage: string;
      };
      milestones: { id: string; date: string; content: string }[];
      tracking: { id: string; date: string; content: string }[];
    }
  > = {};
  for (const p of rdProjects) {
    modals[p.id] = {
      project: {
        id: p.id,
        kind: p.kind ?? "project",
        customer: p.customer ?? "",
        name: p.name,
        description: p.description,
        sales: p.sales,
        pm: p.pm,
        rd: p.rd,
        status: p.status,
        devStage: p.devStage ?? "",
        updatedAt: p.updatedAt ?? "",
      },
      milestones: (milestonesByProject.get(p.id) ?? []).map((m) => ({
        id: m.id,
        date: m.date,
        content: m.content,
      })),
      tracking: (trackingByProject.get(p.id) ?? []).map((t) => ({
        id: t.id,
        date: t.date,
        content: t.content,
        person: t.person,
      })),
    };
  }

  return (
    <div>
      <PageHeader title="產品/專案開發列表">
        <AddDevProjectModal
          statuses={PROJECT_STATUSES}
          pms={pmList}
          salesList={salesList}
          createAction={createProject}
        />
      </PageHeader>

      <Card className="mb-4">
        <form className="flex flex-wrap items-end gap-3" action="/dev-list" method="get">
          <Field label="搜尋">
            <input
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="客戶 / 專案 / 說明"
              className={inputClass}
            />
          </Field>
          <Field label="PM">
            <select name="pm" defaultValue={sp.pm ?? ""} className={inputClass}>
              <option value="">全部</option>
              {distinctPms.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="RD">
            <select name="rd" defaultValue={sp.rd ?? ""} className={inputClass}>
              <option value="">全部</option>
              {distinctRds.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="開發進度">
            <select name="devStage" defaultValue={sp.devStage ?? ""} className={inputClass}>
              <option value="">全部</option>
              {DEV_STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          {sp.sort ? <input type="hidden" name="sort" value={sp.sort} /> : null}
          {sp.dir ? <input type="hidden" name="dir" value={sp.dir} /> : null}
          <button className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white">
            篩選
          </button>
          <a href="/dev-list" className="text-xs text-zinc-500 underline">
            清除
          </a>
        </form>
      </Card>

      <DevModalManager
        modals={modals}
        pms={pmList}
        rds={rdList}
        progressPeople={progressPeople}
        updateProjectAction={updateDevProject}
        updateDevStageAction={updateDevStage}
        removeAction={removeFromDevList}
        addMilestoneAction={addMilestone}
        updateMilestoneAction={updateMilestone}
        deleteMilestoneAction={deleteMilestone}
        addDevTrackingAction={addDevTracking}
        updateDevTrackingAction={updateDevTracking}
        deleteDevTrackingAction={deleteDevTracking}
      >
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <div
            className={`${GRID} border-b border-zinc-200 bg-zinc-50 py-2 text-xs font-medium text-zinc-500`}
          >
            <SortHead id="customer" label="客戶" sp={sp} />
            <SortHead id="sales" label="業務" sp={sp} />
            <div>專案名稱</div>
            <div>說明</div>
            <SortHead id="pm" label="PM" sp={sp} />
            <div>RD</div>
            <SortHead id="status" label="狀態" sp={sp} />
            <SortHead id="devStage" label="開發進度" sp={sp} />
            <SortHead id="milestone" label="Milestone" sp={sp} />
            <SortHead id="tracking" label="進度" sp={sp} />
          </div>

          {rdProjects.length === 0 ? (
            <div className="px-3 py-6 text-sm text-zinc-500">
              沒有符合條件的專案。請到 專案 / AI Pipeline 修改某個專案，勾選「投入 RD」；或從上方「＋ 新增」加入產品 / 內部專案。
            </div>
          ) : (
            rdProjects.map((p) => {
              const isDev = (p.kind ?? "project") === "dev";
              const tracks = (trackingByProject.get(p.id) ?? [])
                .slice()
                .sort((a, b) => b.date.localeCompare(a.date));
              return (
                <div
                  key={p.id}
                  className={`${GRID} border-b border-zinc-100 py-2 text-sm last:border-b-0 hover:bg-zinc-50/60`}
                >
                  <div className="self-center truncate font-medium text-zinc-800" title={p.customer}>
                    {p.customer || "—"}
                  </div>
                  <div className="self-center truncate text-zinc-700" title={p.sales}>
                    {isDev ? "" : p.sales || "—"}
                  </div>
                  <div className="self-center min-w-0">
                    <DevNameTrigger
                      id={p.id}
                      label={p.name}
                      title={`點擊：${p.name}`}
                    />
                  </div>
                  <div
                    className="self-center line-clamp-2 text-xs text-zinc-600"
                    title={p.description}
                  >
                    {p.description || "—"}
                  </div>
                  <div className="self-center truncate text-zinc-700">{p.pm || "—"}</div>
                  <div className="self-center truncate text-zinc-700">{p.rd || "—"}</div>
                  <div className="self-center">{isDev ? "" : <Badge>{p.status}</Badge>}</div>
                  <div className="self-center">
                    {p.devStage ? (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${DEV_STAGE_COLOR[p.devStage] ?? "bg-zinc-100 text-zinc-700"}`}
                      >
                        {p.devStage}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </div>
                  <div className="self-stretch">
                    <ScrollList
                      items={(milestonesByProject.get(p.id) ?? [])
                        .slice()
                        .sort((a, b) => a.date.localeCompare(b.date))
                        .map((m) => ({ id: m.id, date: m.date, content: m.content }))}
                      emptyText="尚無 milestone"
                      borderClass="border-violet-200 bg-violet-50/30"
                      divideClass="divide-violet-100"
                      dotClass="bg-violet-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 self-stretch">
                    <ScrollList
                      items={tracks.map((t) => ({
                        id: t.id,
                        date: t.date,
                        content: t.content,
                        person: t.person,
                      }))}
                      emptyText="尚無進度"
                      borderClass="border-sky-200 bg-sky-50/30"
                      divideClass="divide-sky-100"
                      dotClass="bg-sky-500"
                    />
                    <AddProgressInline
                      projectId={p.id}
                      people={progressPeople}
                      action={addDevTracking}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DevModalManager>
    </div>
  );
}

function SortHead({
  id,
  label,
  sp,
}: {
  id: string;
  label: string;
  sp: { sort?: string; dir?: string; q?: string; pm?: string; rd?: string; devStage?: string };
}) {
  const active = sp.sort === id;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (v && k !== "sort" && k !== "dir") params.set(k, String(v));
  }
  let nextSort: string | null = id;
  let nextDir: string | null = "asc";
  if (active) {
    if (sp.dir === "asc") nextDir = "desc";
    else if (sp.dir === "desc") {
      nextSort = null;
      nextDir = null;
    }
  }
  if (nextSort) params.set("sort", nextSort);
  if (nextDir) params.set("dir", nextDir);
  const qs = params.toString();
  const indicator = active ? (sp.dir === "desc" ? "▼" : "▲") : "↕";
  return (
    <Link
      href={qs ? `/dev-list?${qs}` : "/dev-list"}
      className={`inline-flex items-center gap-0.5 hover:text-zinc-900 ${active ? "text-zinc-900" : ""}`}
    >
      {label}
      <span className="text-[10px] opacity-60">{indicator}</span>
    </Link>
  );
}

function pickNames(people: Person[], kind: "pm" | "rd" | "sales"): string[] {
  return people
    .filter((p) => p.kind === kind)
    .map((p) => p.name)
    .sort((a, b) => a.localeCompare(b, "zh-Hant"));
}

const ROW_HEIGHT = 26;

function ScrollList({
  items,
  emptyText,
  borderClass,
  divideClass,
  dotClass,
}: {
  items: { id: string; date: string; content: string; person?: string }[];
  emptyText: string;
  borderClass: string;
  divideClass: string;
  dotClass: string;
}) {
  if (items.length === 0) {
    return (
      <div
        className={`flex items-center justify-center rounded border border-dashed border-zinc-200 text-xs text-zinc-400`}
        style={{ height: ROW_HEIGHT * 3 + 4 }}
      >
        {emptyText}
      </div>
    );
  }
  return (
    <div
      className={`overflow-y-auto rounded border ${borderClass}`}
      style={{ maxHeight: ROW_HEIGHT * 3 + 4 }}
    >
      <ul className={`divide-y ${divideClass}`}>
        {items.map((m) => (
          <li
            key={m.id}
            className="flex items-center gap-2 px-2 text-xs"
            style={{ height: ROW_HEIGHT }}
            title={`${m.date}${m.person ? ` [${m.person}]` : ""} ${m.content}`}
          >
            <span className="shrink-0 font-mono text-[11px] text-zinc-500">
              {m.date.slice(5)}
            </span>
            <span className={`shrink-0 h-1.5 w-1.5 rounded-full ${dotClass}`} />
            {m.person ? (
              <span className="shrink-0 rounded bg-zinc-100 px-1 text-[10px] text-zinc-600">
                {m.person}
              </span>
            ) : null}
            <span className="truncate text-zinc-700">{m.content}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
