"use client";

import { useState, useTransition } from "react";

export function AddProgressInline({
  projectId,
  people,
  action,
}: {
  projectId: string;
  people: string[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-md border border-dashed border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-600 hover:border-sky-400 hover:text-sky-700"
      >
        ＋ 新增進度
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await action(formData);
          setOpen(false);
        });
      }}
      className="flex flex-col gap-1.5 rounded-md border border-sky-300 bg-sky-50/40 p-2"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          name="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="flex-1 rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-[11px]"
          required
        />
        <select
          name="person"
          defaultValue=""
          className="flex-1 rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-[11px]"
        >
          <option value="">— 人 —</option>
          {people.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <textarea
        name="content"
        required
        rows={2}
        placeholder="進度內容…"
        className="w-full resize-y rounded border border-zinc-300 bg-white px-2 py-1 text-xs"
        autoFocus
      />
      <div className="flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded px-2 py-0.5 text-[11px] text-zinc-600 hover:bg-zinc-200"
          disabled={pending}
        >
          取消
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-sky-600 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-sky-700 disabled:opacity-50"
        >
          {pending ? "儲存中…" : "儲存"}
        </button>
      </div>
    </form>
  );
}
