import type { Metadata } from "next";
import { cookies } from "next/headers";
import { CollapsibleSidebar } from "@/components/collapsible-sidebar";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM 案件追蹤",
  description: "業務開發、執行中專案、產品拓展",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const collapsed = cookieStore.get("sidebar-collapsed")?.value === "1";
  const user = await getCurrentUser();

  return (
    <html lang="zh-Hant" className="h-full antialiased">
      <body className="min-h-full bg-zinc-50 text-zinc-900">
        {user ? (
          <div className="flex min-h-screen">
            <CollapsibleSidebar
              initialCollapsed={collapsed}
              userName={user.username}
              isAdmin={user.isAdmin}
              allowedPages={user.allowedPages}
            />
            <main className="flex-1 px-8 py-8">{children}</main>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
