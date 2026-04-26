"use server";

import { revalidatePath } from "next/cache";
import { create, readAll, remove, update } from "@/lib/db";
import type { Customer, Region } from "@/lib/types";

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function createCustomer(formData: FormData) {
  const name = str(formData, "name");
  if (!name) return;
  const data: Omit<Customer, "id"> = {
    name,
    region: (str(formData, "region") || "TW") as Region,
    contact: str(formData, "contact"),
    note: str(formData, "note"),
    createdAt: new Date().toISOString().slice(0, 10),
  };
  await create("customers", data);
  revalidatePath("/customers");
  revalidatePath("/projects");
  revalidatePath("/");
}

export async function updateCustomer(formData: FormData) {
  const id = str(formData, "id");
  if (!id) return;
  await update("customers", id, {
    name: str(formData, "name"),
    region: str(formData, "region") as Region,
    contact: str(formData, "contact"),
    note: str(formData, "note"),
  });
  revalidatePath("/customers");
  revalidatePath("/projects");
  revalidatePath("/");
}

export async function deleteCustomer(id: string) {
  const projects = await readAll("projects");
  const has = projects.some((p) => p.customerId === id);
  if (has) {
    throw new Error("此客戶仍有專案，請先刪除或轉移該客戶的專案。");
  }
  await remove("customers", id);
  revalidatePath("/customers");
  revalidatePath("/projects");
  revalidatePath("/");
}
