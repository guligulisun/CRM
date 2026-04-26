import Link from "next/link";
import { readAll } from "@/lib/db";
import { Card, PageHeader, Stat, Badge } from "@/components/ui";
import { requirePage } from "@/lib/auth";

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function groupCount<T>(rows: T[], key: (r: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const k = key(r);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

export default async function DashboardPage() {
  await requirePage("/");
  const [projects, customers, tracking, products] = await Promise.all([
    readAll("projects"),
    readAll("customers"),
    readAll("tracking"),
    readAll("products"),
  ]);

  const activeProjects = projects.filter((p) => p.status !== "結案").length;
  const inMaintenance = projects.filter((p) => p.status === "維護").length;
  const productsActive = products.filter((p) => p.stage !== "Sunset").length;

  const upcoming = projects
    .map((p) => ({ ...p, days: daysUntil(p.nextReviewDate) }))
    .filter((p) => p.days !== null && p.days <= 30 && p.days >= -14)
    .sort((a, b) => (a.days ?? 0) - (b.days ?? 0))
    .slice(0, 12);

  const customerById = new Map(customers.map((c) => [c.id, c]));
  const projectsByStatus = groupCount(projects, (p) => p.status);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const trackingThisMonth = tracking.filter((t) => t.date.startsWith(thisMonth));

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="專案、客戶、產品總覽" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="進行中專案" value={activeProjects} hint={`共 ${projects.length} 件`} />
        <Stat label="客戶數" value={customers.length} />
        <Stat label="維護中" value={inMaintenance} />
        <Stat
          label={`本月追蹤 (${thisMonth})`}
          value={trackingThisMonth.length}
          hint={`產品活躍 ${productsActive}`}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-zinc-700">即將到期 / 逾期</h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-zinc-500">沒有 30 天內到期的專案。</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {upcoming.map((p) => (
                <li key={p.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge>{p.status}</Badge>
                        <span className="text-xs text-zinc-500">
                          {customerById.get(p.customerId)?.name ?? "—"}
                        </span>
                      </div>
                      <Link
                        href="/projects"
                        className="mt-1 block truncate text-sm font-medium hover:underline"
                      >
                        {p.name}
                      </Link>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium">{p.nextReviewDate}</div>
                      <div
                        className={`text-xs ${
                          (p.days ?? 0) < 0
                            ? "text-rose-600"
                            : (p.days ?? 0) <= 7
                              ? "text-amber-600"
                              : "text-zinc-500"
                        }`}
                      >
                        {(p.days ?? 0) < 0 ? `逾期 ${-(p.days ?? 0)} 天` : `${p.days} 天後`}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold text-zinc-700">專案狀態分布</h2>
          <ul className="space-y-2">
            {Object.entries(projectsByStatus)
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => (
                <li key={status} className="flex items-center justify-between text-sm">
                  <Badge>{status}</Badge>
                  <span className="font-medium">{count}</span>
                </li>
              ))}
            {Object.keys(projectsByStatus).length === 0 && (
              <p className="text-sm text-zinc-500">尚無資料</p>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
