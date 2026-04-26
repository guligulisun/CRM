"use client";

import { useEffect, useRef, useState, useTransition } from "react";

const DEV_STAGES = ["需求", "開發", "測試", "完成", "停止", "擱置"];
const DEV_CUSTOMERS = ["內部專案", "產品"];

type ProjectInfo = {
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
  updatedAt: string;
};

type Entry = {
  id: string;
  date: string;
  content: string;
  person?: string;
};

export function DevDetailModal({
  project,
  milestones,
  tracking,
  pms,
  rds,
  progressPeople,
  controlledOpen,
  onClose,
  updateProjectAction,
  updateDevStageAction,
  removeAction,
  addMilestoneAction,
  updateMilestoneAction,
  deleteMilestoneAction,
  addDevTrackingAction,
  updateDevTrackingAction,
  deleteDevTrackingAction,
}: {
  project: ProjectInfo;
  milestones: Entry[];
  tracking: Entry[];
  pms: string[];
  rds: string[];
  progressPeople: string[];
  controlledOpen?: boolean;
  onClose?: () => void;
  updateProjectAction: (formData: FormData) => Promise<void>;
  updateDevStageAction: (formData: FormData) => Promise<void>;
  removeAction: (id: string) => Promise<void>;
  addMilestoneAction: (formData: FormData) => Promise<void>;
  updateMilestoneAction: (formData: FormData) => Promise<void>;
  deleteMilestoneAction: (id: string) => Promise<void>;
  addDevTrackingAction: (formData: FormData) => Promise<void>;
  updateDevTrackingAction: (formData: FormData) => Promise<void>;
  deleteDevTrackingAction: (id: string) => Promise<void>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; offX: number; offY: number } | null>(null);

  useEffect(() => {
    if (controlledOpen === undefined) return;
    const dialog = ref.current;
    if (!dialog) return;
    if (controlledOpen) {
      setOffset({ x: 0, y: 0 });
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) dialog.close();
  }, [controlledOpen]);

  useEffect(() => {
    if (!onClose) return;
    const dialog = ref.current;
    if (!dialog) return;
    const handler = () => onClose();
    dialog.addEventListener("close", handler);
    return () => dialog.removeEventListener("close", handler);
  }, [onClose]);

  const onMove = (e: MouseEvent) => {
    if (!dragRef.current) return;
    setOffset({
      x: dragRef.current.offX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.offY + (e.clientY - dragRef.current.startY),
    });
  };
  const onUp = () => {
    dragRef.current = null;
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
  };
  const onHeaderMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, offX: offset.x, offY: offset.y };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    e.preventDefault();
  };
  useEffect(() => () => {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
  }, []);

  const close = () => ref.current?.close();
  const sortedMilestones = milestones.slice().sort((a, b) => a.date.localeCompare(b.date));
  const sortedTracking = tracking.slice().sort((a, b) => b.date.localeCompare(a.date));
  const isDev = project.kind === "dev";
  const editKey = `${project.customer}|${project.name}|${project.description}|${project.pm}|${project.rd}|${project.devStage}`;

  return (
    <dialog
      ref={ref}
      className="fixed w-full max-w-2xl rounded-lg border border-zinc-200 p-0 shadow-2xl backdrop:bg-zinc-900/40"
      style={{
        top: "50%",
        left: "50%",
        margin: 0,
        transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
      }}
    >
      <div
        onMouseDown={onHeaderMouseDown}
        className="flex cursor-move select-none items-center justify-between border-b border-zinc-200 bg-zinc-100 px-5 py-3"
      >
        <h2 className="text-sm font-semibold text-zinc-800">
          {isDev ? "編輯產品/內部專案" : "專案開發詳情"}
          <span className="ml-2 text-xs font-normal text-zinc-500">{project.name}</span>
        </h2>
        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={close}
          className="rounded text-zinc-500 hover:text-zinc-800"
          aria-label="關閉"
        >
          ✕
        </button>
      </div>

      <div className="max-h-[75vh] overflow-y-auto px-5 py-4">
        {isDev ? (
          <form
            key={editKey}
            action={(formData) => {
              startTransition(async () => {
                await updateProjectAction(formData);
              });
            }}
            className="grid grid-cols-2 gap-3 text-sm"
          >
            <input type="hidden" name="id" value={project.id} />
            <Field label="客戶">
              <select name="customer" defaultValue={project.customer} required className={inputCls}>
                {DEV_CUSTOMERS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                {!DEV_CUSTOMERS.includes(project.customer) && project.customer && (
                  <option value={project.customer}>{project.customer}</option>
                )}
              </select>
            </Field>
            <Field label="PM">
              <select name="pm" defaultValue={project.pm} className={inputCls}>
                <option value="">—</option>
                {pms.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
                {!pms.includes(project.pm) && project.pm && (
                  <option value={project.pm}>{project.pm}（未在設定）</option>
                )}
              </select>
            </Field>
            <Field label="RD" full>
              <select name="rd" defaultValue={project.rd} className={inputCls}>
                <option value="">—</option>
                {rds.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
                {!rds.includes(project.rd) && project.rd && (
                  <option value={project.rd}>{project.rd}（未在設定）</option>
                )}
              </select>
            </Field>
            <Field label="專案名稱" full>
              <input name="name" defaultValue={project.name} required className={inputCls} />
            </Field>
            <Field label="說明" full>
              <textarea name="description" defaultValue={project.description} rows={3} className={inputCls} />
            </Field>
            <Field label="開發進度" full>
              <select name="devStage" defaultValue={project.devStage ?? ""} className={inputCls}>
                <option value="">—</option>
                {DEV_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <div className="col-span-2 flex items-center justify-between border-t border-zinc-100 pt-3">
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (!confirm(`確定刪除「${project.name}」？\n（連 milestones、追蹤一併刪除）`)) return;
                  startTransition(async () => {
                    await removeAction(project.id);
                  });
                }}
                className="text-xs text-rose-600 hover:underline disabled:opacity-50"
              >
                刪除專案
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {pending ? "儲存中…" : "儲存"}
              </button>
            </div>
          </form>
        ) : (
          <>
            <section className="grid grid-cols-2 gap-3 text-sm">
              <ReadOnly label="客戶" value={project.customer} />
              <ReadOnly label="業務" value={project.sales} />
              <ReadOnly label="專案名稱" value={project.name} full />
              <ReadOnly label="說明" value={project.description} full />
              <ReadOnly label="PM" value={project.pm} />
              <ReadOnly label="RD" value={project.rd} />
              <ReadOnly label="狀態" value={project.status} />
            </section>
            <form
              key={`stage-${project.devStage}`}
              action={(formData) => {
                startTransition(async () => {
                  await updateDevStageAction(formData);
                });
              }}
              className="mt-3 flex items-end gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2"
            >
              <input type="hidden" name="id" value={project.id} />
              <Field label="開發進度">
                <select
                  name="devStage"
                  defaultValue={project.devStage ?? ""}
                  className={inputCls}
                >
                  <option value="">—</option>
                  {DEV_STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <button
                type="submit"
                disabled={pending}
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                儲存
              </button>
            </form>
            <div className="mt-3 flex justify-start">
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (!confirm(`從清單移除「${project.name}」？\n（pipeline 中的專案不受影響）`)) return;
                  startTransition(async () => {
                    await removeAction(project.id);
                  });
                }}
                className="text-xs text-rose-600 hover:underline disabled:opacity-50"
              >
                從清單移除
              </button>
            </div>
          </>
        )}

        <section className="mt-6 border-t border-zinc-200 pt-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Milestones（{sortedMilestones.length}）
          </h3>
          <AddMilestoneForm projectId={project.id} action={addMilestoneAction} />
          {sortedMilestones.length === 0 ? (
            <p className="mt-3 text-xs text-zinc-500">尚無 milestone。</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {sortedMilestones.map((m) => (
                <EditableEntry
                  key={m.id}
                  entry={m}
                  badgeLabel="🎯"
                  badgeClass="bg-violet-100 text-violet-700"
                  updateAction={updateMilestoneAction}
                  deleteAction={deleteMilestoneAction}
                />
              ))}
            </ul>
          )}
        </section>

        <section className="mt-6 border-t border-zinc-200 pt-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            進度紀錄（{sortedTracking.length}）
          </h3>
          <AddProgressForm
            projectId={project.id}
            people={progressPeople}
            action={addDevTrackingAction}
          />
          {sortedTracking.length === 0 ? (
            <p className="mt-3 text-xs text-zinc-500">尚無進度。</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {sortedTracking.map((t) => (
                <EditableProgressEntry
                  key={t.id}
                  entry={t}
                  people={progressPeople}
                  updateAction={updateDevTrackingAction}
                  deleteAction={deleteDevTrackingAction}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </dialog>
  );
}

function ReadOnly({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={`flex flex-col gap-1 ${full ? "col-span-2" : ""}`}>
      <span className="text-xs font-medium text-zinc-500">{label}</span>
      <div className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-sm text-zinc-700 min-h-[34px]">
        {value || "—"}
      </div>
    </div>
  );
}

function AddMilestoneForm({
  projectId,
  action,
}: {
  projectId: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await action(formData);
        });
      }}
      className="flex flex-wrap items-end gap-2 rounded-md border border-violet-200 bg-violet-50/40 p-2"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-zinc-600">日期</span>
        <input
          type="date"
          name="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          className={inputCls}
          required
        />
      </label>
      <label className="flex flex-1 flex-col gap-1 text-xs">
        <span className="text-zinc-600">項目</span>
        <input
          name="content"
          required
          placeholder="例：v1 上線、第一階段交付…"
          className={inputCls}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50"
      >
        ＋ Milestone
      </button>
    </form>
  );
}

function AddProgressForm({
  projectId,
  people,
  action,
}: {
  projectId: string;
  people: string[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await action(formData);
        });
      }}
      className="flex flex-col gap-2 rounded-md border border-sky-200 bg-sky-50/40 p-2"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <div className="flex items-end gap-2">
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-zinc-600">日期</span>
          <input
            type="date"
            name="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            className={inputCls}
            required
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-xs">
          <span className="text-zinc-600">人</span>
          <select name="person" defaultValue="" className={inputCls}>
            <option value="">—</option>
            {people.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
      </div>
      <textarea
        name="content"
        required
        rows={2}
        placeholder="進度內容…"
        className={`${inputCls} resize-y`}
      />
      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-sky-600 px-3 py-1 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-50"
        >
          ＋ 進度
        </button>
      </div>
    </form>
  );
}

function EditableProgressEntry({
  entry,
  people,
  updateAction,
  deleteAction,
}: {
  entry: Entry;
  people: string[];
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <li className="flex items-start gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs">
        <span className="shrink-0 rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] text-sky-700">
          📝
        </span>
        <span className="shrink-0 font-mono text-zinc-500">{entry.date}</span>
        {entry.person ? (
          <span className="shrink-0 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-700">
            {entry.person}
          </span>
        ) : null}
        <span className="flex-1 text-zinc-700 whitespace-pre-wrap">{entry.content}</span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="shrink-0 text-[11px] text-zinc-600 hover:underline"
        >
          編輯
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!confirm("刪除這筆？")) return;
            startTransition(async () => {
              await deleteAction(entry.id);
            });
          }}
          className="shrink-0 text-[11px] text-rose-600 hover:underline disabled:opacity-50"
        >
          刪除
        </button>
      </li>
    );
  }

  return (
    <li className="rounded-md border border-amber-200 bg-amber-50/50 px-3 py-2">
      <form
        action={(formData) => {
          startTransition(async () => {
            await updateAction(formData);
            setEditing(false);
          });
        }}
        className="flex flex-col gap-2 text-xs"
      >
        <input type="hidden" name="id" value={entry.id} />
        <div className="flex items-end gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-zinc-600">日期</span>
            <input
              type="date"
              name="date"
              defaultValue={entry.date}
              className={inputCls}
              required
            />
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-zinc-600">人</span>
            <select name="person" defaultValue={entry.person ?? ""} className={inputCls}>
              <option value="">—</option>
              {people.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
              {entry.person && !people.includes(entry.person) && (
                <option value={entry.person}>{entry.person}</option>
              )}
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-zinc-600">內容</span>
          <textarea
            name="content"
            defaultValue={entry.content}
            rows={2}
            required
            className={inputCls}
          />
        </label>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={pending}
            className="rounded px-2 py-0.5 text-[11px] text-zinc-600 hover:bg-zinc-200"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-zinc-900 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {pending ? "儲存中…" : "儲存"}
          </button>
        </div>
      </form>
    </li>
  );
}

function EditableEntry({
  entry,
  badgeLabel,
  badgeClass,
  updateAction,
  deleteAction,
}: {
  entry: Entry;
  badgeLabel: string;
  badgeClass: string;
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <li className="flex items-start gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs">
        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] ${badgeClass}`}>
          {badgeLabel}
        </span>
        <span className="shrink-0 font-mono text-zinc-500">{entry.date}</span>
        <span className="flex-1 text-zinc-700 whitespace-pre-wrap">{entry.content}</span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="shrink-0 text-[11px] text-zinc-600 hover:underline"
        >
          編輯
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!confirm("刪除這筆？")) return;
            startTransition(async () => {
              await deleteAction(entry.id);
            });
          }}
          className="shrink-0 text-[11px] text-rose-600 hover:underline disabled:opacity-50"
        >
          刪除
        </button>
      </li>
    );
  }

  return (
    <li className="rounded-md border border-amber-200 bg-amber-50/50 px-3 py-2">
      <form
        action={(formData) => {
          startTransition(async () => {
            await updateAction(formData);
            setEditing(false);
          });
        }}
        className="flex flex-col gap-2 text-xs"
      >
        <input type="hidden" name="id" value={entry.id} />
        <label className="flex flex-col gap-1">
          <span className="text-zinc-600">日期</span>
          <input type="date" name="date" defaultValue={entry.date} className={inputCls} required />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-zinc-600">內容</span>
          <textarea
            name="content"
            defaultValue={entry.content}
            rows={2}
            required
            className={inputCls}
          />
        </label>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={pending}
            className="rounded px-2 py-0.5 text-[11px] text-zinc-600 hover:bg-zinc-200"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-zinc-900 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {pending ? "儲存中…" : "儲存"}
          </button>
        </div>
      </form>
    </li>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${full ? "col-span-2" : ""}`}>
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm shadow-sm focus:border-zinc-500 focus:outline-none";
