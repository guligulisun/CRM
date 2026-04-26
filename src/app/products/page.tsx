import { readAll } from "@/lib/db";
import { Badge, Card, Field, PageHeader, inputClass } from "@/components/ui";
import { requirePage } from "@/lib/auth";
import { createProduct, deleteProduct, updateProductProgress } from "./actions";
import type { Product } from "@/lib/types";

const STAGES: Product["stage"][] = [
  "Discovery",
  "Validation",
  "Build",
  "Launch",
  "Scale",
  "Sunset",
];

export default async function ProductsPage() {
  await requirePage("/products");
  const all = await readAll("products");

  const grouped: Record<Product["stage"], Product[]> = {
    Discovery: [],
    Validation: [],
    Build: [],
    Launch: [],
    Scale: [],
    Sunset: [],
  };
  for (const p of all) grouped[p.stage].push(p);

  return (
    <div>
      <PageHeader title="產品拓展" subtitle={`共 ${all.length} 個產品 / 市場機會`} />

      <Card className="mb-6">
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-zinc-700">
            ＋ 新增產品/市場
          </summary>
          <form action={createProduct} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="名稱">
              <input name="name" required className={inputClass} />
            </Field>
            <Field label="目標市場">
              <input name="targetMarket" className={inputClass} />
            </Field>
            <Field label="負責人">
              <input name="owner" className={inputClass} />
            </Field>
            <Field label="階段">
              <select name="stage" className={inputClass} defaultValue="Discovery">
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="當前里程碑" full>
              <input name="milestone" className={inputClass} />
            </Field>
            <Field label="進度 %">
              <input
                type="number"
                name="progressPct"
                min={0}
                max={100}
                defaultValue={0}
                className={inputClass}
              />
            </Field>
            <Field label="下一步">
              <input name="nextAction" className={inputClass} />
            </Field>
            <Field label="Note" full>
              <textarea name="note" rows={2} className={inputClass} />
            </Field>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                新增
              </button>
            </div>
          </form>
        </details>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {STAGES.map((stage) => (
          <div key={stage} className="rounded-lg border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2">
              <span className="text-sm font-semibold">{stage}</span>
              <span className="text-xs text-zinc-500">{grouped[stage].length} 個</span>
            </div>
            <div className="space-y-3 p-3">
              {grouped[stage].length === 0 ? (
                <p className="px-1 text-xs text-zinc-400">—</p>
              ) : (
                grouped[stage].map((p) => <ProductCard key={p.id} row={p} />)
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductCard({ row }: { row: Product }) {
  return (
    <div className="rounded-md border border-zinc-200 p-3">
      <div className="mb-1 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">{row.name}</h3>
          <p className="text-xs text-zinc-500">
            {row.targetMarket || "—"} · {row.owner || "—"}
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await deleteProduct(row.id);
          }}
        >
          <button className="text-xs text-rose-600 hover:underline">刪除</button>
        </form>
      </div>

      <div className="mt-2">
        <div className="mb-1 flex items-center justify-between text-xs text-zinc-600">
          <span>{row.milestone || "—"}</span>
          <span className="font-medium">{row.progressPct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ width: `${row.progressPct}%` }}
          />
        </div>
      </div>

      {row.nextAction && (
        <p className="mt-2 text-xs">
          <span className="text-zinc-400">下一步：</span>
          <span className="text-zinc-700">{row.nextAction}</span>
        </p>
      )}
      {row.note && <p className="mt-2 text-xs text-zinc-500">{row.note}</p>}

      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-zinc-500">編輯進度</summary>
        <form action={updateProductProgress} className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <input type="hidden" name="id" value={row.id} />
          <Field label="階段">
            <select name="stage" defaultValue={row.stage} className={inputClass}>
              {(
                ["Discovery", "Validation", "Build", "Launch", "Scale", "Sunset"] as const
              ).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="進度 %">
            <input
              type="number"
              name="progressPct"
              min={0}
              max={100}
              defaultValue={row.progressPct}
              className={inputClass}
            />
          </Field>
          <Field label="里程碑" full>
            <input name="milestone" defaultValue={row.milestone} className={inputClass} />
          </Field>
          <Field label="下一步" full>
            <input name="nextAction" defaultValue={row.nextAction} className={inputClass} />
          </Field>
          <div className="col-span-2 flex items-center justify-between">
            <span className="text-zinc-400">最後更新：{row.updatedAt}</span>
            <button className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white">
              儲存
            </button>
          </div>
        </form>
      </details>
    </div>
  );
}
