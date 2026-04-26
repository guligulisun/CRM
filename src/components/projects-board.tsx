import Link from "next/link";
import { cookies } from "next/headers";
import { readAll } from "@/lib/db";
import { Badge, Card, Field, PageHeader, inputClass } from "@/components/ui";
import { AddTrackingInline } from "@/components/add-tracking-inline";
import { AutoDate } from "@/components/auto-date";
import { ColumnSelector } from "@/components/column-selector";
import { ExportButton } from "@/components/export-button";
import { NewProjectModal } from "@/components/new-project-modal";
import {
  ProjectModalManager,
  ProjectNameTrigger,
} from "@/components/project-modal-manager";
import { StatusMultiSelect } from "@/components/status-multi-select";
import {
  addTracking,
  createProject,
  deleteProject,
  deleteTracking,
  quickUpdateNextReview,
  updateProject,
  updateTracking,
} from "@/app/projects/actions";
import { PROJECT_STATUSES } from "@/lib/types";
import type {
  Person,
  PersonKind,
  Project,
  ProjectKind,
  TrackingEntry,
} from "@/lib/types";

type OrderedTracking = TrackingEntry & { _seq: number };

type SP = {
  customer?: string;
  status?: string;
  sales?: string;
  pm?: string;
  source?: string;
  q?: string;
  sort?: string;
  dir?: string;
  page?: string;
};

const PAGE_SIZE = 50;
const SORTABLE = new Set([
  "customer",
  "sales",
  "pm",
  "rd",
  "source",
  "siPartner",
  "status",
  "amount",
  "nextReviewDate",
  "tracking",
]);

const STATUS_ORDER: Record<string, number> = Object.fromEntries(
  PROJECT_STATUSES.map((s, i) => [s, i]),
);

const COLUMN_DEFS: Array<{
  id: string;
  label: string;
  size: string;
  defaultVisible: boolean;
}> = [
  { id: "customer", label: "客戶", size: "110px", defaultVisible: true },
  { id: "sales", label: "業務", size: "70px", defaultVisible: true },
  { id: "name", label: "專案名稱", size: "minmax(140px,1fr)", defaultVisible: true },
  { id: "description", label: "說明", size: "minmax(180px,1.2fr)", defaultVisible: true },
  { id: "pm", label: "PM", size: "60px", defaultVisible: true },
  { id: "rd", label: "RD", size: "60px", defaultVisible: false },
  { id: "source", label: "來源", size: "100px", defaultVisible: false },
  { id: "siPartner", label: "SI Partner", size: "110px", defaultVisible: false },
  { id: "status", label: "狀態", size: "70px", defaultVisible: true },
  { id: "amount", label: "金額", size: "100px", defaultVisible: true },
  { id: "nextReviewDate", label: "下次檢討日", size: "130px", defaultVisible: true },
  { id: "tracking", label: "追蹤", size: "minmax(220px,1.6fr)", defaultVisible: true },
  { id: "kind", label: "類別", size: "80px", defaultVisible: false },
];

const KIND_BADGE: Record<string, string> = {
  project: "專案",
  ai: "AI",
  channel: "通路",
};

const TODAY = new Date();
const FOURTEEN_DAYS_AGO = new Date(TODAY.getTime() - 14 * 24 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10);

export async function ProjectsBoard({
  kind,
  title,
  basePath,
  cookieCols,
  searchParams,
  extraFilter,
  hideNewButton,
  forceShowKind,
}: {
  kind?: ProjectKind;
  title: string;
  basePath: string;
  cookieCols: string;
  searchParams: Promise<SP>;
  extraFilter?: (p: Project) => boolean;
  hideNewButton?: boolean;
  forceShowKind?: boolean;
}) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(cookieCols)?.value;
  const visibleSet = parseVisible(cookieValue);
  if (forceShowKind) visibleSet.add("kind");
  const visibleCols = COLUMN_DEFS.filter((c) => visibleSet.has(c.id));
  const gridTemplateColumns = visibleCols.map((c) => c.size).join(" ");

  const [allProjectsAll, tracking, people] = await Promise.all([
    readAll("projects"),
    readAll("tracking"),
    readAll("people"),
  ]);
  const allProjects = allProjectsAll.filter((p) => {
    if (kind && (p.kind ?? "project") !== kind) return false;
    if (extraFilter && !extraFilter(p)) return false;
    return true;
  });

  const peopleLists = {
    pms: pickNames(people, "pm"),
    rds: pickNames(people, "rd"),
    sales: pickNames(people, "sales"),
    siPartners: pickNames(people, "siPartner"),
  };

  const distinctSales = Array.from(
    new Set(allProjects.map((p) => p.sales).filter((s) => s)),
  ).sort((a, b) => a.localeCompare(b, "zh-Hant"));
  const distinctPms = Array.from(
    new Set(allProjects.map((p) => p.pm).filter((s) => s)),
  ).sort((a, b) => a.localeCompare(b, "zh-Hant"));
  const distinctSources = Array.from(
    new Set(allProjects.map((p) => p.source).filter((s) => s)),
  ).sort((a, b) => a.localeCompare(b, "zh-Hant"));

  const trackingByProject = new Map<string, OrderedTracking[]>();
  const latestTrackingByProject = new Map<string, string>();
  tracking.forEach((t, i) => {
    const arr = trackingByProject.get(t.projectId) ?? [];
    arr.push({ ...t, _seq: i });
    trackingByProject.set(t.projectId, arr);
    const cur = latestTrackingByProject.get(t.projectId);
    if (!cur || t.date > cur) latestTrackingByProject.set(t.projectId, t.date);
  });

  const statusSet = new Set(
    (sp.status ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );

  const filtered = allProjects.filter((p) => {
    if (sp.customer && p.customer !== sp.customer) return false;
    if (statusSet.size > 0 && !statusSet.has(p.status)) return false;
    if (sp.sales && p.sales !== sp.sales) return false;
    if (sp.pm && p.pm !== sp.pm) return false;
    if (sp.source && p.source !== sp.source) return false;
    if (sp.q) {
      const q = sp.q.toLowerCase();
      const hay = `${p.name} ${p.customer} ${p.source}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const sortKey = sp.sort && SORTABLE.has(sp.sort) ? sp.sort : "";
  const dirMul = sp.dir === "desc" ? -1 : 1;
  const defaultCmp = (a: Project, b: Project) => {
    if (a.customer !== b.customer)
      return (a.customer || "").localeCompare(b.customer || "", "zh-Hant");
    return a.name.localeCompare(b.name, "zh-Hant");
  };
  const strSort = (a: Project, b: Project, key: keyof Project) => {
    const va = String(a[key] ?? "");
    const vb = String(b[key] ?? "");
    return (va.localeCompare(vb, "zh-Hant") || defaultCmp(a, b)) * dirMul;
  };
  filtered.sort((a, b) => {
    if (sortKey === "customer") {
      return (
        ((a.customer || "").localeCompare(b.customer || "", "zh-Hant") ||
          a.name.localeCompare(b.name, "zh-Hant")) * dirMul
      );
    }
    if (sortKey === "sales") return strSort(a, b, "sales");
    if (sortKey === "pm") return strSort(a, b, "pm");
    if (sortKey === "rd") return strSort(a, b, "rd");
    if (sortKey === "source") return strSort(a, b, "source");
    if (sortKey === "siPartner") return strSort(a, b, "siPartner");
    if (sortKey === "status") {
      const oa = STATUS_ORDER[a.status] ?? 999;
      const ob = STATUS_ORDER[b.status] ?? 999;
      return ((oa - ob) || defaultCmp(a, b)) * dirMul;
    }
    if (sortKey === "amount") {
      return (((a.amount ?? 0) - (b.amount ?? 0)) || defaultCmp(a, b)) * dirMul;
    }
    if (sortKey === "nextReviewDate") {
      const ra = a.nextReviewDate || "";
      const rb = b.nextReviewDate || "";
      return ((ra > rb ? 1 : ra < rb ? -1 : 0) || defaultCmp(a, b)) * dirMul;
    }
    if (sortKey === "tracking") {
      const la = latestTrackingByProject.get(a.id) ?? "";
      const lb = latestTrackingByProject.get(b.id) ?? "";
      return ((la > lb ? 1 : la < lb ? -1 : 0) || defaultCmp(a, b)) * dirMul;
    }
    return defaultCmp(a, b);
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRaw = Number(sp.page) || 1;
  const page = Math.min(Math.max(1, pageRaw), totalPages);
  const pageStart = (page - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  // Build modal data only for current page items
  const modals: Record<
    string,
    {
      project: {
        id: string;
        customer: string;
        name: string;
        description: string;
        source: string;
        siPartner: string;
        sales: string;
        pm: string;
        rd: string;
        status: string;
        amount: number;
      };
      tracking: {
        id: string;
        date: string;
        content: string;
        kind: "auto" | "manual";
        changedField?: string;
      }[];
    }
  > = {};
  for (const p of pageItems) {
    const t = trackingByProject.get(p.id) ?? [];
    modals[p.id] = {
      project: {
        id: p.id,
        customer: p.customer ?? "",
        name: p.name,
        description: p.description,
        source: p.source ?? "",
        siPartner: p.siPartner ?? "",
        sales: p.sales,
        pm: p.pm,
        rd: p.rd,
        status: p.status,
        amount: p.amount ?? 0,
        rdStatus: p.rdStatus ?? "",
      },
      tracking: t
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date) || b._seq - a._seq)
        .map((x) => ({
          id: x.id,
          date: x.date,
          content: x.content,
          kind: x.kind,
          changedField: x.changedField,
        })),
    };
  }

  const IN_PROGRESS = new Set(["提案", "POC", "報價", "簽約"]);
  const IN_DEV = new Set(["開案", "驗收", "修改"]);
  const inProgressCount = allProjects.filter((p) => IN_PROGRESS.has(p.status)).length;
  const inDevCount = allProjects.filter((p) => IN_DEV.has(p.status)).length;
  const maintainCount = allProjects.filter((p) => p.status === "維護").length;

  const lockedSales = kind === "ai" ? "JJ" : undefined;
  const showNewButton = !hideNewButton && kind !== undefined;

  return (
    <div>
      <PageHeader title={title}>
        {showNewButton && kind ? (
          <NewProjectModal
            statuses={PROJECT_STATUSES}
            people={peopleLists}
            defaultCustomer={sp.customer}
            lockedSales={lockedSales}
            kind={kind}
            createAction={createProject}
          />
        ) : null}
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-zinc-600">
        <StatLink
          basePath={basePath}
          sp={sp}
          statuses={["提案", "POC", "報價", "簽約"]}
          label="進行中（提案、POC、報價、簽約）"
          count={inProgressCount}
        />
        <StatLink
          basePath={basePath}
          sp={sp}
          statuses={["開案", "驗收", "修改"]}
          label="開發中（開案、驗收、修改）"
          count={inDevCount}
        />
        <StatLink
          basePath={basePath}
          sp={sp}
          statuses={["維護"]}
          label="維護中"
          count={maintainCount}
        />
      </div>

      <Card className="mb-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <form className="flex flex-wrap items-end gap-3" action={basePath} method="get">
            <Field label="搜尋">
              <input
                name="q"
                defaultValue={sp.q ?? ""}
                placeholder="專案名稱 / 客戶 / 來源"
                className={inputClass}
              />
            </Field>
            <Field label="業務">
              <select name="sales" defaultValue={sp.sales ?? ""} className={inputClass}>
                <option value="">全部</option>
                {distinctSales.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
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
            <Field label="來源">
              <select name="source" defaultValue={sp.source ?? ""} className={inputClass}>
                <option value="">全部</option>
                {distinctSources.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <StatusMultiSelect
              name="status"
              label="狀態"
              options={PROJECT_STATUSES}
              selected={Array.from(statusSet)}
            />
            {sp.customer ? <input type="hidden" name="customer" value={sp.customer} /> : null}
            {sp.sort ? <input type="hidden" name="sort" value={sp.sort} /> : null}
            {sp.dir ? <input type="hidden" name="dir" value={sp.dir} /> : null}
            <button className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white">
              篩選
            </button>
            <a href={basePath} className="text-xs text-zinc-500 underline">
              清除
            </a>
          </form>

          <div className="flex items-end gap-2">
            <ColumnSelector
              cookieName={cookieCols}
              columns={COLUMN_DEFS.map((c) => ({ id: c.id, label: c.label }))}
              visible={Array.from(visibleSet)}
            />
            <ExportButton href={buildExportHref(sp, kind, extraFilter ? "rd" : undefined)} label="匯出 Excel" />
          </div>
        </div>
      </Card>

      <ProjectModalManager
        modals={modals}
        statuses={PROJECT_STATUSES}
        people={peopleLists}
        lockedSales={lockedSales}
        updateAction={updateProject}
        deleteAction={deleteProject}
        updateTrackingAction={updateTracking}
        deleteTrackingAction={deleteTracking}
      >
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <div
            className="grid items-stretch gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-500"
            style={{ gridTemplateColumns }}
          >
            {visibleCols.map((c) => (
              <div key={c.id} className={c.id === "amount" ? "text-right" : ""}>
                {SORTABLE.has(c.id) ? (
                  <SortHeader id={c.id} label={c.label} sp={sp} basePath={basePath} />
                ) : (
                  c.label
                )}
              </div>
            ))}
          </div>

          {pageItems.length === 0 ? (
            <div className="px-3 py-6 text-sm text-zinc-500">沒有符合條件的專案。</div>
          ) : (
            pageItems.map((p) => (
              <Row
                key={p.id}
                project={p}
                tracking={trackingByProject.get(p.id) ?? []}
                visibleSet={visibleSet}
                gridTemplateColumns={gridTemplateColumns}
              />
            ))
          )}
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          total={filtered.length}
          basePath={basePath}
          sp={sp}
        />
      </ProjectModalManager>
    </div>
  );
}

function StatLink({
  basePath,
  sp,
  statuses,
  label,
  count,
}: {
  basePath: string;
  sp: SP;
  statuses: string[];
  label: string;
  count: number;
}) {
  const want = statuses.join(",");
  const active = (sp.status ?? "") === want;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (v && k !== "status" && k !== "page") params.set(k, String(v));
  }
  if (!active) params.set("status", want);
  const qs = params.toString();
  const href = qs ? `${basePath}?${qs}` : basePath;
  return (
    <Link
      href={href}
      className={`rounded-md px-2 py-0.5 hover:bg-zinc-100 ${active ? "bg-zinc-200 text-zinc-900" : ""}`}
    >
      {label}
      <strong className="ml-1 text-zinc-900">{count}</strong>
    </Link>
  );
}

function buildExportHref(sp: SP, kind?: ProjectKind, view?: string): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (v && k !== "page") params.set(k, String(v));
  }
  if (kind) params.set("kind", kind);
  if (view) params.set("view", view);
  return `/api/projects/export?${params.toString()}`;
}

function SortHeader({
  id,
  label,
  sp,
  basePath,
}: {
  id: string;
  label: string;
  sp: SP;
  basePath: string;
}) {
  const active = sp.sort === id;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (v && k !== "sort" && k !== "dir" && k !== "page") params.set(k, String(v));
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
      href={qs ? `${basePath}?${qs}` : basePath}
      className={`inline-flex items-center gap-0.5 hover:text-zinc-900 ${active ? "text-zinc-900" : ""}`}
    >
      {label}
      <span className="text-[10px] opacity-60">{indicator}</span>
    </Link>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  basePath,
  sp,
}: {
  page: number;
  totalPages: number;
  total: number;
  basePath: string;
  sp: SP;
}) {
  const linkFor = (n: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      if (v && k !== "page") params.set(k, String(v));
    }
    if (n > 1) params.set("page", String(n));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const window: number[] = [];
  for (let n = Math.max(1, page - 2); n <= Math.min(totalPages, page + 2); n++) {
    window.push(n);
  }

  return (
    <div className="mt-3 flex items-center justify-between text-sm">
      <div className="text-xs text-zinc-500">
        共 {total} 筆 · 第 {page} / {totalPages} 頁
      </div>
      <div className="flex items-center gap-1">
        <PageLink href={linkFor(1)} disabled={page === 1}>
          « 第一頁
        </PageLink>
        <PageLink href={linkFor(page - 1)} disabled={page === 1}>
          ‹ 上一頁
        </PageLink>
        {window[0] > 1 && <span className="px-1 text-zinc-400">…</span>}
        {window.map((n) => (
          <PageLink key={n} href={linkFor(n)} active={n === page}>
            {String(n)}
          </PageLink>
        ))}
        {window[window.length - 1] < totalPages && (
          <span className="px-1 text-zinc-400">…</span>
        )}
        <PageLink href={linkFor(page + 1)} disabled={page === totalPages}>
          下一頁 ›
        </PageLink>
        <PageLink href={linkFor(totalPages)} disabled={page === totalPages}>
          末頁 »
        </PageLink>
      </div>
    </div>
  );
}

function PageLink({
  href,
  children,
  active,
  disabled,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span className="rounded border border-zinc-200 px-2 py-0.5 text-xs text-zinc-300">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className={`rounded border px-2 py-0.5 text-xs ${
        active
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
      }`}
    >
      {children}
    </Link>
  );
}

function parseVisible(cookieValue: string | undefined): Set<string> {
  if (cookieValue === undefined || cookieValue === "") {
    return new Set(COLUMN_DEFS.filter((c) => c.defaultVisible).map((c) => c.id));
  }
  const ids = decodeURIComponent(cookieValue)
    .split(",")
    .map((s) => s.trim())
    .filter((id) => COLUMN_DEFS.some((c) => c.id === id));
  return new Set(ids);
}

function pickNames(people: Person[], kind: PersonKind): string[] {
  return people
    .filter((p) => p.kind === kind)
    .map((p) => p.name)
    .sort((a, b) => a.localeCompare(b, "zh-Hant"));
}

function Row({
  project,
  tracking,
  visibleSet,
  gridTemplateColumns,
}: {
  project: Project;
  tracking: OrderedTracking[];
  visibleSet: Set<string>;
  gridTemplateColumns: string;
}) {
  const recent = tracking
    .filter((t) => t.date >= FOURTEEN_DAYS_AGO)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b._seq - a._seq);

  return (
    <div
      className="grid items-stretch gap-2 border-b border-zinc-100 px-3 py-2 text-sm last:border-b-0 hover:bg-zinc-50/60"
      style={{ gridTemplateColumns }}
    >
      {visibleSet.has("customer") && (
        <div
          className="self-center truncate font-medium text-zinc-800"
          title={project.customer || "—"}
        >
          {project.customer || "—"}
        </div>
      )}
      {visibleSet.has("sales") && (
        <div className="self-center truncate text-zinc-700" title={project.sales}>
          {project.sales || "—"}
        </div>
      )}
      {visibleSet.has("name") && (
        <div className="self-center min-w-0">
          <ProjectNameTrigger
            id={project.id}
            label={project.name}
            title={`點擊修改：${project.name}`}
          />
        </div>
      )}
      {visibleSet.has("description") && (
        <div
          className="self-center line-clamp-2 text-xs text-zinc-600"
          title={project.description}
        >
          {project.description || "—"}
        </div>
      )}
      {visibleSet.has("pm") && (
        <div className="self-center truncate text-zinc-700" title={project.pm}>
          {project.pm || "—"}
        </div>
      )}
      {visibleSet.has("rd") && (
        <div className="self-center truncate text-zinc-700" title={project.rd}>
          {project.rd || "—"}
        </div>
      )}
      {visibleSet.has("source") && (
        <div className="self-center truncate text-zinc-700" title={project.source}>
          {project.source || "—"}
        </div>
      )}
      {visibleSet.has("siPartner") && (
        <div className="self-center truncate text-zinc-700" title={project.siPartner}>
          {project.siPartner || "—"}
        </div>
      )}
      {visibleSet.has("status") && (
        <div className="self-center">
          <Badge>{project.status}</Badge>
        </div>
      )}
      {visibleSet.has("kind") && (
        <div className="self-center">
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700">
            {KIND_BADGE[project.kind ?? "project"] ?? project.kind}
          </span>
        </div>
      )}
      {visibleSet.has("amount") && (
        <div
          className="self-center truncate text-right font-mono text-xs text-zinc-700"
          title={String(project.amount)}
        >
          {project.amount ? project.amount.toLocaleString() : "—"}
        </div>
      )}
      {visibleSet.has("nextReviewDate") && (
        <div className="self-center">
          <AutoDate
            name="nextReviewDate"
            value={project.nextReviewDate}
            hiddenFields={{ id: project.id }}
            action={quickUpdateNextReview}
          />
        </div>
      )}
      {visibleSet.has("tracking") && (
        <div className="flex flex-col gap-1.5 self-stretch">
          <TrackingScroll entries={recent} />
          <AddTrackingInline projectId={project.id} action={addTracking} />
        </div>
      )}
    </div>
  );
}

const TRACK_ROW_HEIGHT = 26;

function TrackingScroll({ entries }: { entries: OrderedTracking[] }) {
  if (entries.length === 0) {
    return (
      <div className="flex h-full items-center text-xs text-zinc-400">
        過去 14 天沒有追蹤
      </div>
    );
  }
  return (
    <div
      className="overflow-y-auto rounded border border-zinc-200 bg-zinc-50/40"
      style={{ maxHeight: TRACK_ROW_HEIGHT * 3 + 4 }}
    >
      <ul className="divide-y divide-zinc-100">
        {entries.map((t) => (
          <li
            key={t.id}
            className="flex items-center gap-2 px-2 text-xs"
            style={{ height: TRACK_ROW_HEIGHT }}
            title={`${t.date} ${t.kind === "manual" ? "手動" : "自動"} ${t.changedField ? `[${t.changedField}] ` : ""}${t.content}`}
          >
            <span className="shrink-0 font-mono text-[11px] text-zinc-500">
              {t.date.slice(5)}
            </span>
            <span
              className={`shrink-0 h-1.5 w-1.5 rounded-full ${
                t.kind === "manual" ? "bg-sky-500" : "bg-zinc-400"
              }`}
            />
            <span className="truncate text-zinc-700">{t.content}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
