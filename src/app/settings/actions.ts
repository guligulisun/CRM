"use server";

import { revalidatePath } from "next/cache";
import { create, remove } from "@/lib/db";
import type { PersonKind } from "@/lib/types";
import { PERSON_KINDS } from "@/lib/types";

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function isKind(s: string): s is PersonKind {
  return (PERSON_KINDS as readonly string[]).includes(s);
}

export async function addPerson(formData: FormData) {
  const kind = str(formData, "kind");
  const name = str(formData, "name");
  if (!isKind(kind) || !name) return;
  await create("people", { kind, name });
  revalidatePath("/settings");
  revalidatePath("/projects");
}

export async function deletePerson(id: string) {
  await remove("people", id);
  revalidatePath("/settings");
  revalidatePath("/projects");
}
