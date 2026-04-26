"use server";

import { revalidatePath } from "next/cache";
import { create, getById, readAll, remove, update } from "@/lib/db";
import { hashPassword, requireAdmin } from "@/lib/auth";
import type { User } from "@/lib/types";
import { APP_PAGES } from "@/lib/types";

const SUPER_ADMIN = "jimmy";

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function isSuper(u: User | null | undefined): boolean {
  return !!u && u.username === SUPER_ADMIN;
}

export async function createUser(formData: FormData) {
  await requireAdmin();
  const username = str(formData, "username");
  const password = str(formData, "password");
  const isAdmin = str(formData, "isAdmin") === "true";
  if (!username || !password) return;
  if (username === SUPER_ADMIN) throw new Error("此帳號名稱保留給主帳號");
  const existing = (await readAll("users")).find((u) => u.username === username);
  if (existing) throw new Error("帳號已存在");
  const allowedPages = isAdmin
    ? APP_PAGES.map((p) => p.href)
    : APP_PAGES.map((p) => p.href).filter((href) => formData.get(`page:${href}`) === "on");
  await create("users", {
    username,
    isAdmin,
    passwordHash: hashPassword(password),
    allowedPages,
  } satisfies Omit<User, "id">);
  revalidatePath("/account");
}

export async function updateUserPages(formData: FormData) {
  const me = await requireAdmin();
  const id = str(formData, "id");
  if (!id) return;
  const target = await getById("users", id);
  if (!target) return;
  // 主帳號只有自己能改
  if (isSuper(target) && me.id !== target.id) {
    throw new Error("主帳號權限只有本人能修改");
  }
  const isAdmin = isSuper(target) ? true : str(formData, "isAdmin") === "true";
  const finalPages =
    isSuper(target) || isAdmin
      ? APP_PAGES.map((p) => p.href)
      : APP_PAGES.map((p) => p.href).filter((href) => formData.get(`page:${href}`) === "on");
  await update("users", id, { allowedPages: finalPages, isAdmin });
  revalidatePath("/account");
}

export async function resetUserPassword(formData: FormData) {
  const me = await requireAdmin();
  const id = str(formData, "id");
  const password = str(formData, "password");
  if (!id || !password) return;
  const target = await getById("users", id);
  if (!target) return;
  if (isSuper(target) && me.id !== target.id) {
    throw new Error("主帳號密碼只有本人能重設");
  }
  await update("users", id, { passwordHash: hashPassword(password) });
  revalidatePath("/account");
}

export async function deleteUser(id: string) {
  const me = await requireAdmin();
  if (me.id === id) throw new Error("不能刪除自己");
  const target = await getById("users", id);
  if (!target) return;
  if (isSuper(target)) throw new Error("不能刪除主帳號");
  await remove("users", id);
  revalidatePath("/account");
}
