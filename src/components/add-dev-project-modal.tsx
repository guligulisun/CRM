"use client";

import { useEffect, useRef, useState, useTransition } from "react";

const CUSTOMER_OPTIONS = ["內部專案", "產品"];

export function AddDevProjectModal({
  statuses,
  pms,
  salesList,
  createAction,
}: {
  statuses: readonly string[];
  pms: string[];
  salesList: string[];
  createAction: (formData: FormData) => Promise<void>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; offX: number; offY: number } | null>(null);

  const open = () => {
    setOffset({ x: 0, y: 0 });
    ref.current?.showModal();
  };
  const close = () => ref.current?.close();

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

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
      >
        ＋ 新增
      </button>
      <dialog
        ref={ref}
        className="fixed w-full max-w-xl rounded-lg border border-zinc-200 p-0 shadow-2xl backdrop:bg-zinc-900/40"
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
          <h2 className="text-sm font-semibold text-zinc-800">新增 產品 / 內部專案</h2>
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
                await createAction(formData);
                close();
              });
            }}
            className="grid grid-cols-2 gap-3 text-sm"
          >
            <input type="hidden" name="kind" value="dev" />

            <Field label="客戶">
              <select name="customer" defaultValue="內部專案" required className={inputCls}>
                {CUSTOMER_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="PM">
              <SelectFromList name="pm" options={pms} />
            </Field>
            <Field label="專案名稱" full>
              <input name="name" required className={inputCls} autoFocus />
            </Field>
            <Field label="說明" full>
              <textarea name="description" rows={3} className={inputCls} />
            </Field>

            <div className="col-span-2 flex items-center justify-end gap-2 border-t border-zinc-100 pt-3">
              <button
                type="button"
                onClick={close}
                disabled={pending}
                className="rounded-md px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {pending ? "新增中…" : "新增"}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}

function SelectFromList({ name, options }: { name: string; options: string[] }) {
  return (
    <select name={name} defaultValue="" className={inputCls}>
      <option value="">—</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
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
