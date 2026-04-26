"use client";

import { useTransition } from "react";

export function AutoSelect({
  name,
  value,
  options,
  action,
}: {
  name: string;
  value: string;
  options: readonly string[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <form action={action}>
      <select
        name={name}
        defaultValue={value}
        disabled={pending}
        onChange={(e) => {
          const formData = new FormData();
          formData.set(name, e.target.value);
          startTransition(() => action(formData));
        }}
        className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-xs"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </form>
  );
}
