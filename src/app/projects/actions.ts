"use server";

import { revalidatePath } from "next/cache";
import { create, getById, readAll, remove, removeWhere, update } from "@/lib/db";
import type { Project, ProjectKind, ProjectStatus, RdStatus, TrackingEntry } from "@/lib/types";
import { PROJECT_KINDS, PROJECT_STATUSES, RD_STATUSES } from "@/lib/types";

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function num(formData: FormData, key: string): number {
  const v = formData.get(key);
  if (typeof v !== "string" || v.trim() === "") return 0;
  const n = Number(v.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function bool(formData: FormData, key: string): boolean {
  const v = formData.get(key);
  return typeof v === "string" && v !== "" && v !== "false" && v !== "0";
}

function isRdStatus(s: string): s is RdStatus {
  return (RD_STATUSES as readonly string[]).includes(s);
}

function isStatus(s: string): s is ProjectStatus {
  return (PROJECT_STATUSES as readonly string[]).includes(s);
}

function isKind(s: string): s is ProjectKind {
  return (PROJECT_KINDS as readonly string[]).includes(s);
}

const TRACKED_FIELDS: Array<{ key: keyof Project; label: string }> = [
  { key: "customer", label: "客戶" },
  { key: "name", label: "專案名稱" },
  { key: "description", label: "說明" },
  { key: "source", label: "來源" },
  { key: "siPartner", label: "SI Partner" },
  { key: "sales", label: "業務" },
  { key: "pm", label: "PM" },
  { key: "rd", label: "RD" },
  { key: "status", label: "狀態" },
  { key: "amount", label: "金額" },
  { key: "rdStatus", label: "投入 RD" },
  { key: "devStage", label: "開發進度" },
];

async function logAuto(projectId: string, content: string, field: string) {
  await create("tracking", {
    projectId,
    date: new Date().toISOString().slice(0, 10),
    content,
    kind: "auto",
    changedField: field,
  } satisfies Omit<TrackingEntry, "id">);
}

export async function createProject(formData: FormData) {
  const customer = str(formData, "customer");
  const name = str(formData, "name");
  if (!customer || !name) return;
  const today = new Date().toISOString().slice(0, 10);
  const status = str(formData, "status");
  const kind = str(formData, "kind");
  const data: Omit<Project, "id"> = {
    kind: (isKind(kind) ? kind : "project") as ProjectKind,
    customer,
    name,
    description: str(formData, "description"),
    source: str(formData, "source"),
    siPartner: str(formData, "siPartner"),
    sales: str(formData, "sales"),
    pm: str(formData, "pm"),
    rd: str(formData, "rd"),
    status: (isStatus(status) ? status : "提案") as ProjectStatus,
    amount: num(formData, "amount"),
    nextReviewDate: str(formData, "nextReviewDate"),
    rdStatus: (isRdStatus(str(formData, "rdStatus")) ? str(formData, "rdStatus") : "") as RdStatus,
    devStage:
      isRdStatus(str(formData, "rdStatus")) && str(formData, "rdStatus") === "啟動"
        ? "需求"
        : str(formData, "devStage"),
    createdAt: today,
    updatedAt: today,
  };
  const created = await create("projects", data);
  await logAuto(created.id, `建立專案：${created.name}（狀態 ${created.status}）`, "created");
  revalidatePath("/projects");
  revalidatePath("/ai-projects");
  revalidatePath("/channel");
  revalidatePath("/dev-list");
  revalidatePath("/");
}

export async function updateProject(formData: FormData) {
  const id = str(formData, "id");
  if (!id) return;
  const before = await getById("projects", id);
  if (!before) return;

  const incomingName = str(formData, "name");
  if (!incomingName) {
    throw new Error("專案名稱不可為空");
  }

  const incomingStatus = str(formData, "status");
  const incomingRdStatusStr = str(formData, "rdStatus");
  const oldRdStatus = (before.rdStatus ?? "") as RdStatus;
  let newRdStatus: RdStatus = isRdStatus(incomingRdStatusStr)
    ? (incomingRdStatusStr as RdStatus)
    : oldRdStatus;
  const kind = before.kind ?? "project";
  let newDevStage = str(formData, "devStage");
  const oldDevStage = before.devStage ?? "";
  if (kind !== "dev") {
    const rdChanged = newRdStatus !== oldRdStatus;
    if (rdChanged) {
      // rdStatus 變動 → 帶入對應的開發進度
      if (newRdStatus === "啟動") newDevStage = "需求";
      else if (newRdStatus === "結束") newDevStage = "停止";
    } else if (newDevStage !== oldDevStage) {
      // 開發進度變動 → 帶入對應的 rdStatus
      if (newDevStage === "完成" || newDevStage === "停止") {
        newRdStatus = "結束";
      } else if (
        newDevStage === "需求" ||
        newDevStage === "開發" ||
        newDevStage === "測試" ||
        newDevStage === "擱置"
      ) {
        newRdStatus = "啟動";
      }
    }
  }
  const patch: Partial<Project> = {
    customer: str(formData, "customer"),
    name: incomingName,
    description: str(formData, "description"),
    source: str(formData, "source"),
    siPartner: str(formData, "siPartner"),
    sales: str(formData, "sales"),
    pm: str(formData, "pm"),
    rd: str(formData, "rd"),
    status: (isStatus(incomingStatus) ? incomingStatus : before.status) as ProjectStatus,
    amount: num(formData, "amount"),
    rdStatus: newRdStatus,
    devStage: newDevStage,
    updatedAt: new Date().toISOString().slice(0, 10),
  };

  for (const { key, label } of TRACKED_FIELDS) {
    const oldVal = String(before[key] ?? "");
    const newVal = String(patch[key] ?? "");
    if (oldVal !== newVal) {
      await logAuto(id, `${label}：${oldVal || "—"} → ${newVal || "—"}`, String(key));
    }
  }

  await update("projects", id, patch);
  revalidatePath("/projects");
  revalidatePath("/ai-projects");
  revalidatePath("/channel");
  revalidatePath("/dev-list");
  revalidatePath("/");
}

export async function quickUpdateStatus(formData: FormData) {
  const id = str(formData, "id");
  const status = str(formData, "status");
  if (!id || !isStatus(status)) return;
  const before = await getById("projects", id);
  if (!before || before.status === status) return;
  await update("projects", id, {
    status,
    updatedAt: new Date().toISOString().slice(0, 10),
  });
  await logAuto(id, `狀態：${before.status} → ${status}`, "status");
  revalidatePath("/projects");
  revalidatePath("/ai-projects");
  revalidatePath("/channel");
  revalidatePath("/dev-list");
  revalidatePath("/");
}

export async function quickUpdateNextReview(formData: FormData) {
  const id = str(formData, "id");
  const nextReviewDate = str(formData, "nextReviewDate");
  if (!id) return;
  const before = await getById("projects", id);
  if (!before || before.nextReviewDate === nextReviewDate) return;
  await update("projects", id, {
    nextReviewDate,
    updatedAt: new Date().toISOString().slice(0, 10),
  });
  await logAuto(
    id,
    `下次檢討日：${before.nextReviewDate || "—"} → ${nextReviewDate || "—"}`,
    "nextReviewDate",
  );
  revalidatePath("/projects");
  revalidatePath("/ai-projects");
  revalidatePath("/channel");
  revalidatePath("/dev-list");
  revalidatePath("/");
}

export async function deleteProject(id: string) {
  await remove("projects", id);
  await removeWhere("tracking", (t) => t.projectId === id);
  revalidatePath("/projects");
  revalidatePath("/ai-projects");
  revalidatePath("/channel");
  revalidatePath("/dev-list");
  revalidatePath("/");
}

export async function addTracking(formData: FormData) {
  const projectId = str(formData, "projectId");
  const content = str(formData, "content");
  if (!projectId || !content) return;
  const date = str(formData, "date") || new Date().toISOString().slice(0, 10);

  await create("tracking", {
    projectId,
    date,
    content,
    kind: "manual",
  } satisfies Omit<TrackingEntry, "id">);

  revalidatePath("/projects");
  revalidatePath("/ai-projects");
  revalidatePath("/channel");
  revalidatePath("/dev-list");
  revalidatePath("/");
}

export async function deleteTracking(id: string, projectId: string) {
  await remove("tracking", id);
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
}

export async function updateTracking(formData: FormData) {
  const id = str(formData, "id");
  if (!id) return;
  const before = await getById("tracking", id);
  if (!before) return;
  const date = str(formData, "date") || before.date;
  const content = str(formData, "content") || before.content;
  await update("tracking", id, { date, content });
  revalidatePath("/projects");
}

export async function listCustomersForSelect() {
  const customers = await readAll("customers");
  return customers
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"))
    .map((c) => ({ id: c.id, name: c.name }));
}
