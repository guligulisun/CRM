"use client";

import { useRef } from "react";
import type { Release } from "@/lib/changelog";

export function VersionInfo({
  version,
  changelog,
  collapsed,
}: {
  version: string;
  changelog: Release[];
  collapsed: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const open = () => ref.current?.showModal();
  const close = () => ref.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={open}
        title={`版本 ${version} — 點擊查看更新紀錄`}
        className={`w-full rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 ${
          collapsed ? "px-1 py-1 text-[10px]" : "px-3 py-1.5 text-xs"
        }`}
      >
        v{version}
      </button>
      <dialog
        ref={ref}
        className="fixed w-full max-w-lg rounded-lg border border-zinc-200 p-0 shadow-2xl backdrop:bg-zinc-900/40"
        style={{
          top: "50%",
          left: "50%",
          margin: 0,
          transform: "translate(-50%, -50%)",
        }}
        onClick={(e) => {
          if (e.target === ref.current) close();
        }}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-zinc-800">更新紀錄</h2>
          <button
            type="button"
            onClick={close}
            className="rounded text-zinc-500 hover:text-zinc-800"
            aria-label="關閉"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          {changelog.length === 0 ? (
            <p className="text-sm text-zinc-500">尚無更新紀錄。</p>
          ) : (
            <ul className="space-y-5">
              {changelog.map((r) => (
                <li key={r.version} className="border-l-2 border-zinc-300 pl-3">
                  <div className="mb-1 flex items-baseline gap-2">
                    <span className="text-base font-semibold text-zinc-900">
                      v{r.version}
                    </span>
                    <span className="text-xs text-zinc-500">{r.date}</span>
                  </div>
                  <ul className="ml-4 list-disc space-y-1 text-sm text-zinc-700">
                    {r.notes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      </dialog>
    </>
  );
}
