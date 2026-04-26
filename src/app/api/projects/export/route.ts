import type { NextRequest } from "next/server";
import { readAll } from "@/lib/db";
import type { Project } from "@/lib/types";

const HEADERS = [
  "客戶",
  "業務",
  "專案名稱",
  "說明",
  "PM",
  "RD",
  "來源",
  "SI Partner",
  "狀態",
  "金額",
  "下次檢討日",
  "最後追蹤日",
  "最後追蹤內容",
  "建立日期",
  "更新日期",
];

function csvEscape(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const customer = sp.get("customer") ?? "";
  const kindFilter = sp.get("kind") ?? "";
  const view = sp.get("view") ?? "";
  const statusSet = new Set(
    (sp.get("status") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  const sales = sp.get("sales") ?? "";
  const pm = sp.get("pm") ?? "";
  const source = sp.get("source") ?? "";
  const q = (sp.get("q") ?? "").toLowerCase();
  const sortKey = sp.get("sort") ?? "";
  const dirMul = sp.get("dir") === "desc" ? -1 : 1;

  const [projects, tracking] = await Promise.all([
    readAll("projects"),
    readAll("tracking"),
  ]);

  const latestByProject = new Map<string, { date: string; content: string; seq: number }>();
  tracking.forEach((t, i) => {
    const cur = latestByProject.get(t.projectId);
    if (!cur || t.date > cur.date || (t.date === cur.date && i > cur.seq)) {
      latestByProject.set(t.projectId, { date: t.date, content: t.content, seq: i });
    }
  });

  const filtered = projects.filter((p) => {
    if (kindFilter && (p.kind ?? "project") !== kindFilter) return false;
    if (view === "rd") {
      const k = p.kind ?? "project";
      if (!p.rdCommitted) return false;
      if (k !== "project" && k !== "ai") return false;
    }
    if (customer && p.customer !== customer) return false;
    if (statusSet.size > 0 && !statusSet.has(p.status)) return false;
    if (sales && p.sales !== sales) return false;
    if (pm && p.pm !== pm) return false;
    if (source && p.source !== source) return false;
    if (q) {
      const hay = `${p.name} ${p.customer} ${p.source}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const defaultCmp = (a: Project, b: Project) =>
    (a.customer || "").localeCompare(b.customer || "", "zh-Hant") ||
    a.name.localeCompare(b.name, "zh-Hant");

  const strSort = (a: Project, b: Project, key: keyof Project) =>
    ((String(a[key] ?? "")).localeCompare(String(b[key] ?? ""), "zh-Hant") || defaultCmp(a, b)) * dirMul;
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
    if (sortKey === "status") return strSort(a, b, "status");
    if (sortKey === "amount") {
      return (((a.amount ?? 0) - (b.amount ?? 0)) || defaultCmp(a, b)) * dirMul;
    }
    if (sortKey === "nextReviewDate") {
      const ra = a.nextReviewDate || "";
      const rb = b.nextReviewDate || "";
      return ((ra > rb ? 1 : ra < rb ? -1 : 0) || defaultCmp(a, b)) * dirMul;
    }
    if (sortKey === "tracking") {
      const la = latestByProject.get(a.id)?.date ?? "";
      const lb = latestByProject.get(b.id)?.date ?? "";
      return ((la > lb ? 1 : la < lb ? -1 : 0) || defaultCmp(a, b)) * dirMul;
    }
    return defaultCmp(a, b);
  });

  const rows = filtered.map((p) => {
    const latest = latestByProject.get(p.id);
    return [
      p.customer,
      p.sales,
      p.name,
      p.description,
      p.pm,
      p.rd,
      p.source,
      p.siPartner,
      p.status,
      p.amount || 0,
      p.nextReviewDate,
      latest?.date ?? "",
      latest?.content ?? "",
      p.createdAt,
      p.updatedAt,
    ];
  });

  const csv =
    "\uFEFF" +
    [HEADERS, ...rows].map((r) => r.map(csvEscape).join(",")).join("\r\n");

  const today = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="projects-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
