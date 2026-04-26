#!/usr/bin/env node
// 預覽 AI Pipeline CSV 轉換結果（產出 export 格式，不寫進 data/）
// 用法：node scripts/preview-ai-pipeline.mjs [csv-path]
// 預設讀 data/import/ 底下第一個 .csv
// 輸出：data/import/ai-pipeline-preview.csv

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IMPORT_DIR = path.join(ROOT, "data", "import");
const OUTPUT = path.join(IMPORT_DIR, "ai-pipeline-preview.csv");

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

const EXPORT_HEADERS = [
  "客戶",
  "業務",
  "專案名稱",
  "說明",
  "PM",
  "RD",
  "來源",
  "SI Partner",
  "狀態",
  "金額",
  "下次檢討日",
  "最後追蹤日",
  "最後追蹤內容",
  "建立日期",
  "更新日期",
];

function parseCsv(text) {
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

function normalize(s) {
  return String(s || "").replace(/[\s\r\n]+/g, "").trim();
}

function findHeaderRow(rows) {
  for (let i = 0; i < Math.min(rows.length, 8); i++) {
    if (rows[i].some((c) => normalize(c).includes("終端客戶"))) return i;
  }
  return 0;
}

function parseDate(v) {
  if (!v) return "";
  const s = String(v).trim();
  if (!s) return "";
  const m = s.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m2 = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (m2) return `${m2[1]}-${m2[2].padStart(2, "0")}-${m2[3].padStart(2, "0")}`;
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

function csvEscape(v) {
  const s = v == null ? "" : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function pickInputFile(arg) {
  if (arg) return path.resolve(arg);
  const files = await fs.readdir(IMPORT_DIR);
  const csvs = files.filter(
    (f) => f.toLowerCase().endsWith(".csv") && f !== "ai-pipeline-preview.csv",
  );
  if (csvs.length === 0) {
    throw new Error(`${IMPORT_DIR} 找不到 .csv`);
  }
  return path.join(IMPORT_DIR, csvs[0]);
}

async function main() {
  const csvPath = await pickInputFile(process.argv[2]);
  const today = new Date().toISOString().slice(0, 10);
  console.log(`讀取：${csvPath}`);

  const csv = (await fs.readFile(csvPath, "utf8")).replace(/^\uFEFF/, "");
  const rows = parseCsv(csv);
  const headerIdx = findHeaderRow(rows);
  const headersNorm = rows[headerIdx].map((h) => normalize(h));
  const colIdx = (key) => headersNorm.indexOf(normalize(key));
  const get = (row, key) => {
    const idx = colIdx(key);
    return idx >= 0 ? (row[idx] || "").trim() : "";
  };

  // 檢查欄位有無對到
  const missing = Object.entries(COL).filter(([, v]) => colIdx(v) < 0);
  if (missing.length) {
    console.warn("⚠ 找不到欄位：", missing.map(([k, v]) => `${k}(${v})`).join(", "));
  }

  const outRows = [];
  let skipped = 0;

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.every((c) => !c || !c.trim())) continue;

    const customer = get(r, COL.customer);
    const name = get(r, COL.name);
    if (!customer && !name) {
      skipped++;
      continue;
    }

    const planned = parseDate(get(r, COL.planned));
    const checkPt = parseDate(get(r, COL.checkPt));
    const nextReviewDate = planned || checkPt || "";

    // tracking 內容（會被寫成 manual tracking）— 預覽顯示「最後一筆」
    const noteFields = [
      ["專案狀態說明", get(r, COL.statusNote)],
      ["補充說明", get(r, COL.extraNote)],
      ["重要時程規劃說明", get(r, COL.scheduleNote)],
    ].filter(([, v]) => v);
    const lastTrackingContent = noteFields.length
      ? `[${noteFields[noteFields.length - 1][0]}] ${noteFields[noteFields.length - 1][1]}`
      : "";
    const lastTrackingDate = noteFields.length ? today : "";

    outRows.push([
      customer,
      get(r, COL.sales),
      name,
      get(r, COL.description),
      get(r, COL.pm),
      get(r, COL.rd),
      get(r, COL.source),
      "", // SI Partner
      mapStatus(get(r, COL.status)),
      0, // 金額
      nextReviewDate,
      lastTrackingDate,
      lastTrackingContent,
      today, // 建立日期
      today, // 更新日期
    ]);
  }

  const csvOut =
    "\uFEFF" +
    [EXPORT_HEADERS, ...outRows].map((r) => r.map(csvEscape).join(",")).join("\r\n");

  await fs.writeFile(OUTPUT, csvOut);

  console.log(`✓ 預覽寫到：${OUTPUT}`);
  console.log(`  共 ${outRows.length} 筆，跳過 ${skipped} 筆空列`);
  if (outRows.length > 0) {
    console.log("\n前 3 筆：");
    outRows.slice(0, 3).forEach((r, i) => {
      console.log(`  ${i + 1}. 客戶=${r[0]} | 名稱=${r[2]} | 狀態=${r[8]} | 下次=${r[10]} | 追蹤=${r[12].slice(0, 40)}`);
    });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
