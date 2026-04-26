#!/usr/bin/env node
// 匯入 AI Pipeline CSV 到 data/projects.json
// 使用：node scripts/import-ai-pipeline.mjs [csv-path]
// 預設讀取 data/import/ai-pipeline.csv

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_CSV = path.join(ROOT, "data", "import", "ai-pipeline.csv");
const PROJECTS_FILE = path.join(ROOT, "data", "projects.json");
const TRACKING_FILE = path.join(ROOT, "data", "tracking.json");

const STATUS_MAP = {
  Ongoing: "開案",
  Pending: "擱置",
  Dead: "中止",
  Closed: "結案",
  POC: "POC",
  Contracting: "簽約",
  Kickoff: "開案",
  UAT: "驗收",
  MA: "維護",
  Change: "修改",
};

// CSV 欄位名（用第二排 row header）
const COL = {
  customer: "終端客戶/經銷(需求單位)",
  name: "專案目的(需求目標)",
  description: "專案實施要點",
  source: "來源",
  status: "狀態",
  pm: "PM規格",
  sales: "Sales商務",
  rd: "RD開發",
  planned: "預計完成",
  checkPt: "Check PT(YYYYMMDD)",
  statusNote: "專案狀態說明",
  extraNote: "補充說明",
  scheduleNote: "重要時程規劃說明",
};

function parseCsv(text) {
  // 支援 quoted、escaped quote、跨行 quoted field
  const rows = [];
  let row = [];
  let cell = "";
  let inQuote = false;
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (inQuote) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 2;
        } else {
          inQuote = false;
          i++;
        }
      } else {
        cell += c;
        i++;
      }
    } else {
      if (c === '"') {
        inQuote = true;
        i++;
      } else if (c === ",") {
        row.push(cell);
        cell = "";
        i++;
      } else if (c === "\r") {
        i++;
      } else if (c === "\n") {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
        i++;
      } else {
        cell += c;
        i++;
      }
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function findHeaderRow(rows) {
  // 找包含 "終端客戶" 的那排當 header
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    if (rows[i].some((c) => c && c.includes("終端客戶"))) return i;
  }
  return 0;
}

function parseDate(v) {
  if (!v) return "";
  const s = String(v).trim();
  if (!s) return "";
  // YYYYMMDD
  const m = s.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // YYYY/MM/DD
  const m2 = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (m2) {
    return `${m2[1]}-${m2[2].padStart(2, "0")}-${m2[3].padStart(2, "0")}`;
  }
  return "";
}

function mapStatus(v) {
  if (!v) return "提案";
  const s = String(v).trim().toLowerCase();
  for (const k of Object.keys(STATUS_MAP)) {
    if (k.toLowerCase() === s) return STATUS_MAP[k];
  }
  return "提案";
}

async function main() {
  const csvPath = process.argv[2] || DEFAULT_CSV;
  const today = new Date().toISOString().slice(0, 10);

  const csv = await fs.readFile(csvPath, "utf8").catch(() => null);
  if (!csv) {
    console.error(`找不到 CSV：${csvPath}`);
    console.error(`請把 sheet 下載成 CSV 放到上述路徑，或傳 path 當參數。`);
    process.exit(1);
  }

  const rows = parseCsv(csv.replace(/^\uFEFF/, ""));
  const headerIdx = findHeaderRow(rows);
  const headers = rows[headerIdx].map((h) => h.trim());
  const get = (row, key) => {
    const idx = headers.indexOf(key);
    return idx >= 0 ? (row[idx] || "").trim() : "";
  };

  const projects = JSON.parse(await fs.readFile(PROJECTS_FILE, "utf8"));
  const tracking = JSON.parse(await fs.readFile(TRACKING_FILE, "utf8"));

  // 去重鍵：kind=ai 已經存在的 customer+name
  const existingKey = new Set(
    projects
      .filter((p) => (p.kind ?? "project") === "ai")
      .map((p) => `${p.customer}||${p.name}`),
  );

  let added = 0;
  let skipped = 0;
  let trackingAdded = 0;

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.every((c) => !c || !c.trim())) continue;

    const customer = get(r, COL.customer);
    const name = get(r, COL.name);
    if (!customer && !name) continue;

    const key = `${customer}||${name}`;
    if (existingKey.has(key)) {
      skipped++;
      continue;
    }
    existingKey.add(key);

    const planned = parseDate(get(r, COL.planned));
    const checkPt = parseDate(get(r, COL.checkPt));
    const nextReviewDate = planned || checkPt || "";

    const id = `j-ai-${String(added + 1).padStart(3, "0")}-${randomUUID().slice(0, 4)}`;

    const project = {
      id,
      kind: "ai",
      customer,
      name,
      description: get(r, COL.description),
      source: get(r, COL.source),
      siPartner: "",
      sales: get(r, COL.sales),
      pm: get(r, COL.pm),
      rd: get(r, COL.rd),
      status: mapStatus(get(r, COL.status)),
      amount: 0,
      nextReviewDate,
      createdAt: today,
      updatedAt: today,
    };
    projects.push(project);
    added++;

    // 追蹤紀錄
    const noteFields = [
      ["專案狀態說明", get(r, COL.statusNote)],
      ["補充說明", get(r, COL.extraNote)],
      ["重要時程規劃說明", get(r, COL.scheduleNote)],
    ];
    for (const [label, val] of noteFields) {
      if (val) {
        tracking.push({
          id: randomUUID(),
          projectId: id,
          date: today,
          content: `[${label}] ${val}`,
          kind: "manual",
        });
        trackingAdded++;
      }
    }
  }

  await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2) + "\n");
  await fs.writeFile(TRACKING_FILE, JSON.stringify(tracking, null, 2) + "\n");

  console.log(`✓ 新增 ${added} 筆 AI 專案`);
  console.log(`  跳過 ${skipped} 筆（重複 customer+name）`);
  console.log(`  寫入 ${trackingAdded} 筆追蹤`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
