import Link from "next/link";
import { readAll } from "@/lib/db";
import { Card, Field, PageHeader, inputClass } from "@/components/ui";
import { requirePage } from "@/lib/auth";
import { createCustomer, deleteCustomer, updateCustomer } from "./actions";
import type { Customer } from "@/lib/types";

const REGIONS = ["TW", "US", "JP", "HK", "CN", "SG", "OTHER"];

export default async function CustomersPage() {
  await requirePage("/customers");
  const [customers, projects] = await Promise.all([
    readAll("customers"),
    readAll("projects"),
  ]);

  const projectCount: Record<string, number> = {};
  for (const p of projects) {
    projectCount[p.customerId] = (projectCount[p.customerId] ?? 0) + 1;
  }

  return (
    <div>
      <PageHeader title="客戶" subtitle={`共 ${customers.length} 個客戶`} />

      <Card className="mb-6">
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-zinc-700">
            ＋ 新增客戶
          </summary>
          <form action={createCustomer} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="客戶名稱">
              <input name="name" required className={inputClass} />
            </Field>
            <Field label="區域">
              <select name="region" defaultValue="TW" className={inputClass}>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="主要聯絡人">
              <input name="contact" className={inputClass} />
            </Field>
            <Field label="備註" full>
              <textarea name="note" rows={2} className={inputClass} />
            </Field>
            <div className="sm:col-span-2">
              <button className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                新增
              </button>
            </div>
          </form>
        </details>
      </Card>

      <div className="space-y-3">
        {customers.length === 0 && (
          <Card>
            <p className="text-sm text-zinc-500">還沒有客戶。</p>
          </Card>
        )}
        {customers
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"))
          .map((c) => (
            <CustomerRow key={c.id} customer={c} projectCount={projectCount[c.id] ?? 0} />
          ))}
      </div>
    </div>
  );
}

function CustomerRow({ customer, projectCount }: { customer: Customer; projectCount: number }) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold">{customer.name}</h3>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
              {customer.region}
            </span>
            <Link
              href={`/projects?customerId=${customer.id}`}
              className="text-xs text-zinc-500 hover:underline"
            >
              {projectCount} 個專案 →
            </Link>
          </div>
          <div className="mt-1 text-xs text-zinc-600">
            <span className="text-zinc-400">聯絡人：</span>
            {customer.contact || "—"}
            <span className="ml-3 text-zinc-400">建立：</span>
            {customer.createdAt}
          </div>
          {customer.note && (
            <p className="mt-2 text-xs text-zinc-500">{customer.note}</p>
          )}
        </div>
        <form
          action={async () => {
            "use server";
            await deleteCustomer(customer.id);
          }}
        >
          <button className="text-xs text-rose-600 hover:underline">刪除</button>
        </form>
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-zinc-500">編輯</summary>
        <form action={updateCustomer} className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input type="hidden" name="id" value={customer.id} />
          <Field label="客戶名稱">
            <input name="name" defaultValue={customer.name} required className={inputClass} />
          </Field>
          <Field label="區域">
            <select name="region" defaultValue={customer.region} className={inputClass}>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          <Field label="主要聯絡人">
            <input name="contact" defaultValue={customer.contact} className={inputClass} />
          </Field>
          <Field label="備註" full>
            <textarea name="note" defaultValue={customer.note} rows={2} className={inputClass} />
          </Field>
          <div className="sm:col-span-2">
            <button className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white">
              儲存
            </button>
          </div>
        </form>
      </details>
    </Card>
  );
}
