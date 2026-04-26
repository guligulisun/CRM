"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

export function ColumnSelector({
  cookieName,
  columns,
  visible,
}: {
  cookieName: string;
  columns: { id: string; label: string }[];
  visible: string[];
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(visible);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const toggle = (id: string) => {
    const next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    setSelected(next);
    document.cookie = `${cookieName}=${encodeURIComponent(next.join(","))}; path=/; max-age=31536000; SameSite=Lax`;
    startTransition(() => router.refresh());
  };

  const reset = () => {
    setSelected(columns.map((c) => c.id));
    document.cookie = `${cookieName}=; path=/; max-age=0; SameSite=Lax`;
    startTransition(() => router.refresh());
  };

  return (
    <div className="relative" ref={popRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
      >
        欄位 ({selected.length}/{columns.length})
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-52 rounded-md border border-zinc-200 bg-white py-2 shadow-lg">
          <div className="max-h-80 overflow-y-auto">
            {columns.map((c) => (
              <label
                key={c.id}
                className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-zinc-50"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(c.id)}
                  onChange={() => toggle(c.id)}
                  className="rounded border-zinc-300"
                />
                <span className="text-zinc-700">{c.label}</span>
              </label>
            ))}
          </div>
          <div className="mt-1 flex items-center justify-end gap-2 border-t border-zinc-100 px-3 pt-2">
            <button
              type="button"
              onClick={reset}
              className="text-xs text-zinc-600 hover:underline"
            >
              還原預設
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
