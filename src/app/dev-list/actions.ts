"use server";

import { revalidatePath } from "next/cache";
import { create, getById, remove, removeWhere, update } from "@/lib/db";
import type { Milestone, Project, TrackingEntry } from "@/lib/types";

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

const today = () => new Date().toISOString().slice(0, 10);

export async function addMilestone(formData: FormData) {
  const projectId = str(formData, "projectId");
  const content = str(formData, "content");
  if (!projectId || !content) return;
  const date = str(formData, "date") || today();
  await create("milestones", { projectId, date, content } satisfies Omit<Milestone, "id">);
  revalidatePath("/dev-list");
}

export async function updateMilestone(formData: FormData) {
  const id = str(formData, "id");
  if (!id) return;
  const before = await getById("milestones", id);
  if (!before) return;
  const date = str(formData, "date") || before.date;
  const content = str(formData, "content") || before.content;
  await update("milestones", id, { date, content });
  revalidatePath("/dev-list");
}

export async function deleteMilestone(id: string) {
  await remove("milestones", id);
  revalidatePath("/dev-list");
}

export async function addDevTracking(formData: FormData) {
  const projectId = str(formData, "projectId");
  const content = str(formData, "content");
  if (!projectId || !content) return;
  const date = str(formData, "date") || today();
  const person = str(formData, "person");
  await create("devTracking", {
    projectId,
    date,
    content,
    kind: "manual",
    person,
  } satisfies Omit<TrackingEntry, "id">);
  revalidatePath("/dev-list");
}

export async function updateDevTracking(formData: FormData) {
  const id = str(formData, "id");
  if (!id) return;
  const before = await getById("devTracking", id);
  if (!before) return;
  const date = str(formData, "date") || before.date;
  const content = str(formData, "content") || before.content;
  const person = str(formData, "person");
  await update("devTracking", id, { date, content, person });
  revalidatePath("/dev-list");
}

export async function deleteDevTracking(id: string) {
  await remove("devTracking", id);
  revalidatePath("/dev-list");
}

export async function updateDevProject(formData: FormData) {
  const id = str(formData, "id");
  if (!id) return;
  const before = await getById("projects", id);
  if (!before) return;
  const patch: Partial<Project> = {
    customer: str(formData, "customer"),
    name: str(formData, "name") || before.name,
    description: str(formData, "description"),
    pm: str(formData, "pm"),
    rd: str(formData, "rd"),
    devStage: str(formData, "devStage"),
    updatedAt: today(),
  };
  await update("projects", id, patch);
  revalidatePath("/dev-list");
}

export async function updateDevStage(formData: FormData) {
  const id = str(formData, "id");
  const devStage = str(formData, "devStage");
  if (!id) return;
  const before = await getById("projects", id);
  if (!before) return;
  const patch: Partial<Project> = { devStage, updatedAt: today() };
  if ((before.kind ?? "project") !== "dev") {
    if (devStage === "完成" || devStage === "停止") {
      patch.rdStatus = "結束";
    } else if (
      devStage === "需求" ||
      devStage === "開發" ||
      devStage === "測試" ||
      devStage === "擱置"
    ) {
      patch.rdStatus = "啟動";
    }
  }
  await update("projects", id, patch);
  revalidatePath("/dev-list");
  revalidatePath("/projects");
  revalidatePath("/ai-projects");
}

export async function removeFromDevList(id: string) {
  const p = await getById("projects", id);
  if (!p) return;
  const k = p.kind ?? "project";
  if (k === "dev") {
    await remove("projects", id);
    await removeWhere("milestones", (m) => m.projectId === id);
    await removeWhere("devTracking", (t) => t.projectId === id);
    await removeWhere("tracking", (t) => t.projectId === id);
  } else {
    await update("projects", id, { rdStatus: "", updatedAt: today() });
  }
  revalidatePath("/dev-list");
  revalidatePath("/projects");
  revalidatePath("/ai-projects");
}
