"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  findUserByUsername,
  firstAllowedPath,
  makeSessionToken,
  SESSION_COOKIE,
  verifyPassword,
} from "@/lib/auth";

export async function loginAction(_prev: { error?: string } | undefined, formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) {
    return { error: "請填寫帳號和密碼" };
  }
  const user = await findUserByUsername(username);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "帳號或密碼錯誤" };
  }
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE.name, makeSessionToken(user.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE.maxAge,
  });
  redirect(firstAllowedPath(user));
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE.name);
  redirect("/login");
}
