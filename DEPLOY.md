# 部署 SOP（給 RD）

## 環境需求

- Node.js ≥ 20
- 對應寫入權限的目錄（要能讀寫 `data/`）

## 1. 取得程式

```bash
git clone https://github.com/guligulisun/CRM.git
cd CRM
```

## 2. 安裝套件

```bash
npm install
```

## 3. 還原資料

從 jimmy 收到 `crm-data.tar.gz`，解壓到專案根目錄：

```bash
tar -xzf crm-data.tar.gz
```

完成後應該會有 `data/` 目錄，內含：

```
data/
├── customers.json
├── projects.json
├── tracking.json
├── dev-tracking.json
├── milestones.json
├── people.json
├── products.json
├── users.json
└── import/    (CSV 原始檔，可不部署)
```

## 4. 設定環境變數

建立 `.env.local`（與 `package.json` 同層）：

```bash
AUTH_SECRET=<隨機長字串，至少 32 字元>
```

產生隨機字串：

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

> 不設的話 cookie 會用程式碼裡的 dev secret 簽，可能被偽造。

## 5. Build + 啟動

```bash
npm run build
npm start
```

預設 port 3000。要改 port：

```bash
PORT=8080 npm start
```

## 6. 反向代理（建議）

正式環境用 Nginx / Apache 反代 + HTTPS。Nginx 範例：

```nginx
location / {
  proxy_pass http://localhost:3000;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 7. 設定備份（重要）

`data/` 是 JSON 檔，沒有 transaction 保護，壞了沒救。請排程每日備份：

cron 範例（每天凌晨 3 點）：

```cron
0 3 * * * cd /path/to/CRM && tar -czf /backup/crm/data-$(date +\%Y\%m\%d).tar.gz data/
```

保留近 30 天即可，每天約 0.5 MB。

## 8. 系統服務（建議）

用 systemd 管理：

`/etc/systemd/system/crm.service`：

```ini
[Unit]
Description=CRM
After=network.target

[Service]
Type=simple
User=app
WorkingDirectory=/path/to/CRM
EnvironmentFile=/path/to/CRM/.env.local
ExecStart=/usr/bin/node /path/to/CRM/node_modules/next/dist/bin/next start
Restart=always

[Install]
WantedBy=multi-user.target
```

啟用：

```bash
systemctl enable crm
systemctl start crm
systemctl status crm
```

---

## 後續更新流程

```bash
cd /path/to/CRM
git pull
npm install
npm run build
sudo systemctl restart crm
```

`data/` 不會被 git 動到，安全。

## 預設帳號

`jimmy` / `MySight360`（在 data/users.json 裡）。上線後請 jimmy 自己登入到 `/account` 改密碼。
