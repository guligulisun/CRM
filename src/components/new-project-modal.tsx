"use client";

import { useEffect, useRef, useState, useTransition } from "react";

type People = {
  pms: string[];
  rds: string[];
  sales: string[];
  siPartners: string[];
};

export function NewProjectModal({
  statuses,
  people,
  defaultCustomer,
  lockedSales,
  kind,
  createAction,
}: {
  statuses: readonly string[];
  people: People;
  defaultCustomer?: string;
  lockedSales?: string;
  kind?: string;
  createAction: (formData: FormData) => Promise<void>;
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

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
      >
        ＋ 新增專案
      </button>
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
          <h2 className="text-sm font-semibold text-zinc-800">新增專案</h2>
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
            {kind ? <input type="hidden" name="kind" value={kind} /> : null}
            <Field label="客戶">
              <input
                name="customer"
                defaultValue={defaultCustomer ?? ""}
                required
                className={inputCls}
                placeholder="客戶名稱"
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
                <PersonSelect name="sales" options={people.sales} value="" />
              )}
            </Field>
            <Field label="專案名稱" full>
              <input name="name" required className={inputCls} autoFocus />
            </Field>
            <Field label="說明" full>
              <textarea name="description" rows={3} className={inputCls} />
            </Field>
            <Field label="PM">
              <PersonSelect name="pm" options={people.pms} value="" />
            </Field>
            <Field label="RD">
              <PersonSelect name="rd" options={people.rds} value="" />
            </Field>
            <Field label="狀態">
              <select name="status" defaultValue="提案" className={inputCls}>
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
                className={inputCls}
                placeholder="例：代理商引介 / 政府標案 / 舊客戶"
              />
            </Field>
            <Field label="SI Partner">
              <PersonSelect name="siPartner" options={people.siPartners} value="" />
            </Field>
            <Field label="金額">
              <input
                type="number"
                name="amount"
                min={0}
                step={1000}
                defaultValue={0}
                className={inputCls}
              />
            </Field>
            <Field label="投入 RD" full>
              <select name="rdStatus" defaultValue="" className={inputCls}>
                <option value="">-</option>
                <option value="啟動">啟動</option>
              </select>
            </Field>
            <Field label="下次檢討日" full>
              <input type="date" name="nextReviewDate" className={inputCls} />
            </Field>

            <div className="col-span-2 flex items-center justify-end gap-2 border-t border-zinc-100 pt-3">
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
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {pending ? "新增中…" : "新增專案"}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </>
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
  return (
    <select name={name} defaultValue={value} className={inputCls}>
      <option value="">—</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
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
