"use server";

import { revalidatePath } from "next/cache";
import { create, remove, update } from "@/lib/db";
import type { Product } from "@/lib/types";

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function num(formData: FormData, key: string): number {
  const n = Number(formData.get(key));
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
}

export async function createProduct(formData: FormData) {
  const data: Omit<Product, "id"> = {
    name: str(formData, "name"),
    targetMarket: str(formData, "targetMarket"),
    owner: str(formData, "owner"),
    stage: (str(formData, "stage") || "Discovery") as Product["stage"],
    milestone: str(formData, "milestone"),
    progressPct: num(formData, "progressPct"),
    nextAction: str(formData, "nextAction"),
    note: str(formData, "note"),
    updatedAt: new Date().toISOString().slice(0, 10),
  };
  await create("products", data);
  revalidatePath("/products");
  revalidatePath("/");
}

export async function updateProductProgress(formData: FormData) {
  const id = str(formData, "id");
  if (!id) return;
  await update("products", id, {
    progressPct: num(formData, "progressPct"),
    stage: str(formData, "stage") as Product["stage"],
    milestone: str(formData, "milestone"),
    nextAction: str(formData, "nextAction"),
    updatedAt: new Date().toISOString().slice(0, 10),
  });
  revalidatePath("/products");
  revalidatePath("/");
}

export async function deleteProduct(id: string) {
  await remove("products", id);
  revalidatePath("/products");
  revalidatePath("/");
}
