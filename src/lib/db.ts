import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Customer, Project, TrackingEntry, Product, Person, Milestone, User } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

type Schema = {
  customers: Customer;
  projects: Project;
  tracking: TrackingEntry;
  products: Product;
  people: Person;
  milestones: Milestone;
  devTracking: TrackingEntry;
  users: User;
};

type Collection = keyof Schema;

const FILES: Record<Collection, string> = {
  customers: "customers.json",
  projects: "projects.json",
  tracking: "tracking.json",
  products: "products.json",
  people: "people.json",
  milestones: "milestones.json",
  devTracking: "dev-tracking.json",
  users: "users.json",
};

async function ensureFile(collection: Collection): Promise<string> {
  const file = path.join(DATA_DIR, FILES[collection]);
  try {
    await fs.access(file);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(file, "[]", "utf8");
  }
  return file;
}

export async function readAll<C extends Collection>(collection: C): Promise<Schema[C][]> {
  const file = await ensureFile(collection);
  const raw = await fs.readFile(file, "utf8");
  return JSON.parse(raw || "[]");
}

async function writeAll<C extends Collection>(collection: C, rows: Schema[C][]): Promise<void> {
  const file = await ensureFile(collection);
  await fs.writeFile(file, JSON.stringify(rows, null, 2), "utf8");
}

export async function create<C extends Collection>(
  collection: C,
  data: Omit<Schema[C], "id">,
): Promise<Schema[C]> {
  const rows = await readAll(collection);
  const row = { ...(data as object), id: randomUUID() } as Schema[C];
  rows.push(row);
  await writeAll(collection, rows);
  return row;
}

export async function update<C extends Collection>(
  collection: C,
  id: string,
  patch: Partial<Schema[C]>,
): Promise<Schema[C] | null> {
  const rows = await readAll(collection);
  const idx = rows.findIndex((r) => (r as { id: string }).id === id);
  if (idx === -1) return null;
  rows[idx] = { ...rows[idx], ...patch };
  await writeAll(collection, rows);
  return rows[idx];
}

export async function remove<C extends Collection>(collection: C, id: string): Promise<boolean> {
  const rows = await readAll(collection);
  const next = rows.filter((r) => (r as { id: string }).id !== id);
  if (next.length === rows.length) return false;
  await writeAll(collection, next);
  return true;
}

export async function getById<C extends Collection>(
  collection: C,
  id: string,
): Promise<Schema[C] | null> {
  const rows = await readAll(collection);
  return rows.find((r) => (r as { id: string }).id === id) ?? null;
}

export async function removeWhere<C extends Collection>(
  collection: C,
  predicate: (row: Schema[C]) => boolean,
): Promise<number> {
  const rows = await readAll(collection);
  const next = rows.filter((r) => !predicate(r));
  const removed = rows.length - next.length;
  if (removed > 0) await writeAll(collection, next);
  return removed;
}
