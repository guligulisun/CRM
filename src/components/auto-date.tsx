"use client";

import { useTransition } from "react";

export function AutoDate({
  name,
  value,
  hiddenFields,
  action,
}: {
  name: string;
  value: string;
  hiddenFields?: Record<string, string>;
  action: (formData: FormData) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <form action={action}>
      {hiddenFields
        ? Object.entries(hiddenFields).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))
        : null}
      <input
        type="date"
        name={name}
        defaultValue={value}
        disabled={pending}
        onChange={(e) => {
          const formData = new FormData();
          if (hiddenFields) {
            for (const [k, v] of Object.entries(hiddenFields)) formData.set(k, v);
          }
          formData.set(name, e.target.value);
          startTransition(() => action(formData));
        }}
        className="w-full rounded border border-zinc-300 bg-white px-1.5 py-1 text-xs hover:border-zinc-500 focus:border-zinc-500 focus:outline-none disabled:opacity-50"
      />
    </form>
  );
}
