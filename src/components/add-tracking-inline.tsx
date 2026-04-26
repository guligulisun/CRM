"use client";

import { useState, useTransition } from "react";

export function AddTrackingInline({
  projectId,
  action,
}: {
  projectId: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-md border border-dashed border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-600 hover:border-emerald-400 hover:text-emerald-700"
      >
        ＋ 新增追蹤
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
      className="flex flex-col gap-1.5 rounded-md border border-emerald-300 bg-emerald-50/40 p-2"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <textarea
        name="content"
        required
        rows={3}
        placeholder="新增追蹤內容…"
        className="w-full resize-y rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs"
        autoFocus
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-zinc-500">
          日期：{new Date().toISOString().slice(0, 10)}（今天）
        </span>
        <div className="flex items-center gap-1.5">
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
            className="rounded bg-emerald-600 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending ? "儲存中…" : "儲存"}
          </button>
        </div>
      </div>
    </form>
  );
}
