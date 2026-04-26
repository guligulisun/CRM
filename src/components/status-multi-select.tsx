"use client";

import { useEffect, useRef, useState } from "react";

export function StatusMultiSelect({
  name,
  label,
  options,
  selected,
}: {
  name: string;
  label: string;
  options: readonly string[];
  selected: string[];
}) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(selected);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const toggle = (o: string) => {
    setPicked((p) => (p.includes(o) ? p.filter((x) => x !== o) : [...p, o]));
  };

  const summary =
    picked.length === 0
      ? "全部"
      : picked.length <= 2
        ? picked.join("、")
        : `${picked.length} 種`;

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      <div className="relative" ref={ref}>
        <input type="hidden" name={name} value={picked.join(",")} />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm shadow-sm hover:border-zinc-500 focus:outline-none"
        >
          <span className="truncate">{summary}</span>
          <span className="text-xs text-zinc-400">▾</span>
        </button>
        {open && (
          <div className="absolute z-20 mt-1 min-w-[140px] rounded-md border border-zinc-200 bg-white py-1 shadow-lg">
            {options.map((o) => (
              <label
                key={o}
                className="flex cursor-pointer items-center gap-2 px-3 py-1 text-sm hover:bg-zinc-50"
              >
                <input
                  type="checkbox"
                  checked={picked.includes(o)}
                  onChange={() => toggle(o)}
                  className="rounded border-zinc-300"
                />
                <span className="text-zinc-700">{o}</span>
              </label>
            ))}
            {picked.length > 0 && (
              <div className="mt-1 border-t border-zinc-100 px-3 py-1 text-right">
                <button
                  type="button"
                  onClick={() => setPicked([])}
                  className="text-xs text-zinc-600 hover:underline"
                >
                  清除
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </label>
  );
}
