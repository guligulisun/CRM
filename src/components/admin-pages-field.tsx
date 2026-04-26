"use client";

import { useState } from "react";

export function AdminPagesField({
  pages,
  initialAdmin,
  initialAllowed,
  adminDisabled,
  showAdminCheckbox = true,
}: {
  pages: { href: string; label: string }[];
  initialAdmin: boolean;
  initialAllowed: string[];
  adminDisabled?: boolean;
  showAdminCheckbox?: boolean;
}) {
  const [isAdmin, setIsAdmin] = useState(initialAdmin);
  const [picked, setPicked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(pages.map((p) => [p.href, initialAllowed.includes(p.href)])),
  );

  const toggle = (href: string, checked: boolean) => {
    setPicked((s) => ({ ...s, [href]: checked }));
  };

  return (
    <>
      {showAdminCheckbox && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isAdmin"
            value="true"
            checked={isAdmin}
            disabled={adminDisabled}
            onChange={(e) => setIsAdmin(e.target.checked)}
          />
          <span>管理員（自動可看所有頁面 + 帳號管理）</span>
        </label>
      )}
      <fieldset>
        <legend className="mb-1 text-xs font-medium text-zinc-600">
          可見頁面 {isAdmin ? <span className="text-zinc-400">（管理員自動全選）</span> : null}
        </legend>
        <div className="flex flex-wrap gap-3">
          {pages.map((p) => (
            <label key={p.href} className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                name={`page:${p.href}`}
                checked={isAdmin || !!picked[p.href]}
                disabled={isAdmin}
                onChange={(e) => toggle(p.href, e.target.checked)}
              />
              <span className={isAdmin ? "text-zinc-400" : ""}>{p.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}
