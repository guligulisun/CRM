import { readAll } from "@/lib/db";
import { Card, Field, PageHeader, inputClass } from "@/components/ui";
import { AdminPagesField } from "@/components/admin-pages-field";
import { requireAdmin } from "@/lib/auth";
import { APP_PAGES } from "@/lib/types";
import {
  createUser,
  deleteUser,
  resetUserPassword,
  updateUserPages,
} from "./actions";

const SUPER_ADMIN = "jimmy";

export default async function AccountPage() {
  const me = await requireAdmin();
  const users = await readAll("users");

  return (
    <div>
      <PageHeader title="帳號管理" subtitle="管理帳號、權限與可見頁面" />

      <Card className="mb-4">
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-zinc-700">
            ＋ 新增帳號
          </summary>
          <form action={createUser} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="帳號">
              <input name="username" required className={inputClass} />
            </Field>
            <Field label="密碼">
              <input type="password" name="password" required className={inputClass} />
            </Field>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <AdminPagesField
                pages={APP_PAGES}
                initialAdmin={false}
                initialAllowed={APP_PAGES.map((p) => p.href)}
              />
            </div>
            <div className="sm:col-span-2">
              <button className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                新增
              </button>
            </div>
          </form>
        </details>
      </Card>

      <div className="space-y-3">
        {users
          .slice()
          .sort((a, b) => a.username.localeCompare(b.username))
          .map((u) => {
            const isSuper = u.username === SUPER_ADMIN;
            const canEdit = !isSuper || me.id === u.id;
            const canDelete = !isSuper && me.id !== u.id;
            return (
              <Card key={u.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">
                      {u.username}
                      {isSuper && (
                        <span className="ml-2 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] text-rose-700">
                          super admin
                        </span>
                      )}
                      {!isSuper && u.isAdmin && (
                        <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">
                          admin
                        </span>
                      )}
                      {u.id === me.id && (
                        <span className="ml-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600">
                          你
                        </span>
                      )}
                    </h3>
                    {isSuper && (
                      <p className="mt-1 text-xs text-zinc-500">
                        主帳號：永遠保有全部權限與全頁面，無法被其他人修改或刪除
                      </p>
                    )}
                  </div>
                  {canDelete && (
                    <form
                      action={async () => {
                        "use server";
                        await deleteUser(u.id);
                      }}
                    >
                      <button className="text-xs text-rose-600 hover:underline">
                        刪除
                      </button>
                    </form>
                  )}
                </div>

                {canEdit && !isSuper && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-zinc-500">
                      編輯權限
                    </summary>
                    <form action={updateUserPages} className="mt-2 flex flex-col gap-2">
                      <input type="hidden" name="id" value={u.id} />
                      <AdminPagesField
                        pages={APP_PAGES}
                        initialAdmin={u.isAdmin}
                        initialAllowed={u.allowedPages}
                        adminDisabled={u.id === me.id}
                      />
                      <button className="mt-1 self-start rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white">
                        儲存權限
                      </button>
                    </form>
                  </details>
                )}

                {canEdit && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-zinc-500">
                      重設密碼
                    </summary>
                    <form action={resetUserPassword} className="mt-2 flex items-end gap-2">
                      <input type="hidden" name="id" value={u.id} />
                      <Field label="新密碼">
                        <input
                          type="password"
                          name="password"
                          required
                          className={inputClass}
                        />
                      </Field>
                      <button className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white">
                        重設
                      </button>
                    </form>
                  </details>
                )}
              </Card>
            );
          })}
      </div>
    </div>
  );
}
