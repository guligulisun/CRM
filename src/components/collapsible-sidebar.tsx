"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { logoutAction } from "@/app/login/actions";
import { CHANGELOG, CURRENT_VERSION } from "@/lib/changelog";
import { VersionInfo } from "./version-info";

const NAV: Array<{ href: string; label: string; short: string }> = [
  { href: "/", label: "Dashboard", short: "🏠" },
  { href: "/projects", label: "專案Pipeline", short: "專" },
  { href: "/ai-projects", label: "解鎖AI Pipeline", short: "AI" },
  { href: "/channel", label: "通路 Pipeline", short: "通" },
  { href: "/dev-list", label: "產品/專案開發列表", short: "RD" },
  { href: "/customers", label: "客戶", short: "客" },
  { href: "/products", label: "產品推廣", short: "產" },
  { href: "/settings", label: "設定", short: "⚙" },
];

const ADMIN_NAV: Array<{ href: string; label: string; short: string }> = [
  { href: "/account", label: "帳號管理", short: "👤" },
];

const COOKIE = "sidebar-collapsed";

export function CollapsibleSidebar({
  initialCollapsed,
  userName,
  isAdmin,
  allowedPages,
}: {
  initialCollapsed: boolean;
  userName: string;
  isAdmin: boolean;
  allowedPages: string[];
}) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${COOKIE}=${next ? "1" : ""}; path=/; max-age=31536000; SameSite=Lax`;
  };

  const visibleNav = NAV.filter((item) => isAdmin || allowedPages.includes(item.href));
  const visibleAdminNav = isAdmin ? ADMIN_NAV : [];

  return (
    <aside
      className={`${collapsed ? "w-14" : "w-56"} sticky top-0 flex h-screen shrink-0 flex-col border-r border-zinc-200 bg-white transition-[width] duration-150`}
    >
      <div
        className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} gap-2 px-3 py-4`}
      >
        {!collapsed && (
          <Link href="/" className="text-lg font-semibold tracking-tight">
            CRM 看板
          </Link>
        )}
        <button
          type="button"
          onClick={toggle}
          title={collapsed ? "展開選單" : "收合選單"}
          className="rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 text-xs text-zinc-600 hover:bg-zinc-50"
        >
          {collapsed ? "▶" : "◀"}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 pb-2">
        {visibleNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={`flex items-center ${collapsed ? "justify-center" : ""} gap-2 rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100`}
          >
            <span className="shrink-0 text-base leading-none">{item.short}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        ))}
        {visibleAdminNav.length > 0 && (
          <>
            <div className={`my-2 border-t border-zinc-200 ${collapsed ? "mx-2" : "mx-3"}`} />
            {visibleAdminNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex items-center ${collapsed ? "justify-center" : ""} gap-2 rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100`}
              >
                <span className="shrink-0 text-base leading-none">{item.short}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            ))}
          </>
        )}
      </nav>
      <div className="shrink-0 border-t border-zinc-200 px-2 pb-3 pt-2">
        <VersionInfo
          version={CURRENT_VERSION}
          changelog={CHANGELOG}
          collapsed={collapsed}
        />
      </div>
      <div className="shrink-0 border-t border-zinc-200 px-2 py-3">
        {collapsed ? (
          <form action={logoutAction}>
            <button
              type="submit"
              disabled={pending}
              title={`${userName} · 登出`}
              className="flex w-full items-center justify-center rounded-md py-2 text-base text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
            >
              ⎋
            </button>
          </form>
        ) : (
          <>
            <div className="px-2 pb-1 text-xs text-zinc-500">
              {userName}
              {isAdmin && (
                <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">
                  admin
                </span>
              )}
            </div>
            <form
              action={(formData) => {
                startTransition(async () => {
                  await logoutAction();
                });
              }}
            >
              <button
                type="submit"
                disabled={pending}
                className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
              >
                <span>⎋</span>
                <span>{pending ? "登出中…" : "登出"}</span>
              </button>
            </form>
          </>
        )}
      </div>
    </aside>
  );
}
