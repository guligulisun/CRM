import { readAll } from "@/lib/db";
import { Card, Field, PageHeader, inputClass } from "@/components/ui";
import { requirePage } from "@/lib/auth";
import { addPerson, deletePerson } from "./actions";
import { PERSON_KIND_LABEL, PERSON_KINDS } from "@/lib/types";
import type { Person, PersonKind } from "@/lib/types";

export default async function SettingsPage() {
  await requirePage("/settings");
  const people = await readAll("people");
  const grouped = Object.fromEntries(
    PERSON_KINDS.map((k) => [k, [] as Person[]]),
  ) as Record<PersonKind, Person[]>;
  for (const p of people) grouped[p.kind]?.push(p);

  return (
    <div>
      <PageHeader title="設定" subtitle="管理 PM、RD、業務、SI Partner 名單" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {PERSON_KINDS.map((kind) => (
          <Card key={kind}>
            <h2 className="mb-3 text-sm font-semibold text-zinc-700">
              {PERSON_KIND_LABEL[kind]}
              <span className="ml-2 text-xs font-normal text-zinc-500">
                {grouped[kind].length} 人
              </span>
            </h2>

            <form action={addPerson} className="mb-4 flex items-end gap-2">
              <input type="hidden" name="kind" value={kind} />
              <Field label="新增">
                <input
                  name="name"
                  required
                  placeholder={`新增 ${PERSON_KIND_LABEL[kind]} 名稱`}
                  className={inputClass}
                />
              </Field>
              <button className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">
                ＋
              </button>
            </form>

            {grouped[kind].length === 0 ? (
              <p className="text-xs text-zinc-500">尚未新增。</p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {grouped[kind]
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"))
                  .map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between py-1.5 text-sm"
                    >
                      <span className="text-zinc-700">{p.name}</span>
                      <form
                        action={async () => {
                          "use server";
                          await deletePerson(p.id);
                        }}
                      >
                        <button className="text-xs text-rose-600 hover:underline">
                          刪除
                        </button>
                      </form>
                    </li>
                  ))}
              </ul>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
