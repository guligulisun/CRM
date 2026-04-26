#!/usr/bin/env node
// 打包 data/ 為 tar.gz 檔
// 用法：cd 到 app 目錄，跑 node scripts/pack-data.mjs

import { execSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.join(ROOT, "data");
const OUT = "crm-data.tar.gz";

if (!existsSync(DATA_DIR)) {
  console.error("找不到 data/ 目錄");
  process.exit(1);
}

execSync(`tar -czf ${OUT} data/`, { stdio: "inherit", cwd: ROOT });

const stats = statSync(path.join(ROOT, OUT));
console.log(`✓ ${path.join(ROOT, OUT)}`);
console.log(`  大小：${(stats.size / 1024).toFixed(1)} KB`);
console.log(`  → 把這個檔案傳給 RD，照 DEPLOY.md 步驟還原`);
