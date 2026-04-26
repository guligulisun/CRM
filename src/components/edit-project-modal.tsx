"use client";

import { useEffect, useRef, useState, useTransition } from "react";

type ProjectInput = {
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
  rdStatus: string;
};

type TrackingInput = {
  id: string;
  date: string;
  content: string;
  kind: "auto" | "manual";
  changedField?: string;
};

type People = {
  pms: string[];
  rds: string[];
  sales: string[];
  siPartners: string[];
};

export function EditProjectModal({
  project,
  statuses,
  people,
  tracking,
  triggerLabel,
  triggerClassName,
  triggerTitle,
  controlledOpen,
  lockedSales,
  onClose,
  updateAction,
  deleteAction,
  updateTrackingAction,
  deleteTrackingAction,
}: {
  project: ProjectInput;
  statuses: readonly string[];
  people: People;
  tracking: TrackingInput[];
  triggerLabel?: string;
  triggerClassName?: string;
  triggerTitle?: string;
  controlledOpen?: boolean;
  lockedSales?: string;
  onClose?: () => void;
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (id: string) => Promise<void>;
  updateTrackingAction: (formData: FormData) => Promise<void>;
  deleteTrackingAction: (id: string, projectId: string) => Promise<void>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{
    startX: number;
    startY: number;
    offX: number;
    offY: number;
  } | null>(null);

  const open = () => {
    setOffset({ x: 0, y: 0 });
    ref.current?.showModal();
  };
  const close = () => ref.current?.close();

  const onHeaderMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      offX: offset.x,
      offY: offset.y,
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    e.preventDefault();
  };
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
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, []);

  // Controlled mode: open via prop, listen for close
  useEffect(() => {
    if (controlledOpen === undefined) return;
    const dialog = ref.current;
    if (!dialog) return;
    if (controlledOpen) {
      setOffset({ x: 0, y: 0 });
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [controlledOpen]);

  useEffect(() => {
    if (!onClose) return;
    const dialog = ref.current;
    if (!dialog) return;
    const handler = () => onClose();
    dialog.addEventListener("close", handler);
    return () => dialog.removeEventListener("close", handler);
  }, [onClose]);

  const sortedTracking = tracking;
  const isControlled = controlledOpen !== undefined;

  return (
    <>
      {!isControlled && (
        <button
          type="button"
          onClick={open}
          title={triggerTitle ?? "點擊修改"}
          className={
            triggerClassName ??
            "rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          }
        >
          {triggerLabel ?? "✎ 修改"}
        </button>
      )}
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
            修改專案
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

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          <form
            action={(formData) => {
              startTransition(async () => {
                await updateAction(formData);
                close();
              });
            }}
            className="grid grid-cols-2 gap-3 text-sm"
          >
            <input type="hidden" name="id" value={project.id} />

            <Field label="客戶">
              <input
                name="customer"
                defaultValue={project.customer}
                required
                className={inputCls}
              />
            </Field>
            <Field label="業務">
              {lockedSales !== undefined ? (
                <input
                  name="sales"
                  value={lockedSales}
                  readOnly
                  className={`${inputCls} bg-zinc-100 text-zinc-700`}
                />
              ) : (
                <PersonSelect name="sales" options={people.sales} value={project.sales} />
              )}
            </Field>
            <Field label="專案名稱" full>
              <input
                name="name"
                defaultValue={project.name}
                required
                className={inputCls}
              />
            </Field>
            <Field label="說明" full>
              <textarea
                name="description"
                defaultValue={project.description}
                rows={3}
                className={inputCls}
              />
            </Field>
            <Field label="PM">
              <PersonSelect name="pm" options={people.pms} value={project.pm} />
            </Field>
            <Field label="RD">
              <PersonSelect name="rd" options={people.rds} value={project.rd} />
            </Field>
            <Field label="狀態">
              <select name="status" defaultValue={project.status} className={inputCls}>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="來源">
              <input
                name="source"
                defaultValue={project.source}
                className={inputCls}
                placeholder="例：代理商引介 / 政府標案 / 舊客戶"
              />
            </Field>
            <Field label="SI Partner">
              <PersonSelect
                name="siPartner"
                options={people.siPartners}
                value={project.siPartner}
              />
            </Field>
            <Field label="金額">
              <input
                type="number"
                name="amount"
                defaultValue={project.amount || ""}
                min={0}
                step={1000}
                className={inputCls}
                placeholder="0"
              />
            </Field>
            <Field label="投入 RD" full>
              <select
                name="rdStatus"
                defaultValue={project.rdStatus}
                className={inputCls}
              >
                {project.rdStatus === "" ? (
                  <>
                    <option value="">-</option>
                    <option value="啟動">啟動</option>
                  </>
                ) : (
                  <>
                    <option value="啟動">啟動</option>
                    <option value="結束">結束</option>
                  </>
                )}
              </select>
            </Field>

            <div className="col-span-2 flex items-center justify-between border-t border-zinc-100 pt-3">
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (
                    !confirm(`確定刪除「${project.name}」？追蹤紀錄也會一併刪除。`)
                  )
                    return;
                  startTransition(async () => {
                    await deleteAction(project.id);
                    close();
                  });
                }}
                className="text-xs text-rose-600 hover:underline disabled:opacity-50"
              >
                刪除專案
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={close}
                  className="rounded-md px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100"
                  disabled={pending}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {pending ? "儲存中…" : "儲存專案"}
                </button>
              </div>
            </div>
          </form>

          <div className="mt-6 border-t border-zinc-200 pt-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              追蹤紀錄（{sortedTracking.length}）
            </h3>
            {sortedTracking.length === 0 ? (
              <p className="text-xs text-zinc-500">沒有追蹤紀錄。</p>
            ) : (
              <ul className="space-y-2">
                {sortedTracking.map((t) => (
                  <TrackingEditRow
                    key={t.id}
                    entry={t}
                    projectId={project.id}
                    updateAction={updateTrackingAction}
                    deleteAction={deleteTrackingAction}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}

function TrackingEditRow({
  entry,
  projectId,
  updateAction,
  deleteAction,
}: {
  entry: TrackingInput;
  projectId: string;
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (id: string, projectId: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <li className="flex items-start gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs">
        <span className="shrink-0 font-mono text-zinc-500">{entry.date}</span>
        <span
          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] ${
            entry.kind === "manual"
              ? "bg-sky-100 text-sky-700"
              : "bg-zinc-100 text-zinc-600"
          }`}
        >
          {entry.kind === "manual" ? "手動" : "自動"}
        </span>
        <span className="flex-1 text-zinc-700">{entry.content}</span>
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
            if (!confirm("刪除這筆追蹤？")) return;
            startTransition(async () => {
              await deleteAction(entry.id, projectId);
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
        <Field label="日期">
          <input
            type="date"
            name="date"
            defaultValue={entry.date}
            className={inputCls}
            required
          />
        </Field>
        <Field label="內容">
          <textarea
            name="content"
            defaultValue={entry.content}
            rows={2}
            required
            className={inputCls}
          />
        </Field>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded px-2 py-0.5 text-[11px] text-zinc-600 hover:bg-zinc-200"
            disabled={pending}
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

function PersonSelect({
  name,
  options,
  value,
}: {
  name: string;
  options: string[];
  value: string;
}) {
  const inList = options.includes(value);
  return (
    <select name={name} defaultValue={value} className={inputCls}>
      <option value="">—</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
      {!inList && value && (
        <option value={value}>{value}（未在設定）</option>
      )}
    </select>
  );
}

const inputCls =
  "rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm shadow-sm focus:border-zinc-500 focus:outline-none";

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`flex flex-col gap-1 ${full ? "col-span-2" : ""}`}>
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      {children}
    </label>
  );
}
