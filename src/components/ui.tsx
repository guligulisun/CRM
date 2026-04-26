import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-zinc-500">{subtitle}</p> : null}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-zinc-200 bg-white p-5 ${className}`}>{children}</div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card>
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {hint ? <div className="mt-1 text-xs text-zinc-500">{hint}</div> : null}
    </Card>
  );
}

const STATUS_COLOR: Record<string, string> = {
  提案: "bg-zinc-100 text-zinc-700",
  POC: "bg-sky-100 text-sky-700",
  報價: "bg-amber-100 text-amber-700",
  簽約: "bg-indigo-100 text-indigo-700",
  開案: "bg-violet-100 text-violet-700",
  驗收: "bg-orange-100 text-orange-700",
  維護: "bg-teal-100 text-teal-700",
  修改: "bg-rose-100 text-rose-700",
  擱置: "bg-zinc-200 text-zinc-600",
  中止: "bg-red-100 text-red-700",
  結案: "bg-emerald-100 text-emerald-700",
  auto: "bg-zinc-100 text-zinc-600",
  manual: "bg-sky-100 text-sky-700",
};

export function Badge({ children }: { children: string }) {
  const cls = STATUS_COLOR[children] ?? "bg-zinc-100 text-zinc-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {children}
    </span>
  );
}

export function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "rounded-md border border-zinc-300 px-3 py-1.5 text-sm shadow-sm focus:border-zinc-500 focus:outline-none";
