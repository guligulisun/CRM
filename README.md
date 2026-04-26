# CRM 看板

內部用的 CRM / Pipeline 管理工具，Next.js 16 + TypeScript + Tailwind 4，資料以本機 JSON 檔案儲存。

## 快速啟動

```bash
npm install
npm run dev
```

開啟 http://localhost:3000

第一次跑會看到 `/login`，但 `data/users.json` 不會在 repo 裡（敏感）。請先建立帳號：

```bash
node -e "
const { scryptSync, randomBytes, randomUUID } = require('node:crypto');
const fs = require('node:fs');
function hash(p) {
  const s = randomBytes(16).toString('hex');
  return s + ':' + scryptSync(p, s, 64).toString('hex');
}
const APP_PAGES = ['/','/projects','/ai-projects','/channel','/dev-list','/customers','/products','/settings'];
fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/users.json', JSON.stringify([{
  id: randomUUID(),
  username: 'jimmy',
  passwordHash: hash('MySight360'),
  isAdmin: true,
  allowedPages: APP_PAGES,
}], null, 2));
console.log('done');
"
```

接著用 `jimmy` / `MySight360` 登入。

## 環境變數（建議 production）

`.env.local`：

```
AUTH_SECRET=長一點的隨機字串
```

不設的話 cookie 會用程式裡的 dev secret 簽，可能被偽造。

## 資料

所有資料存在 `data/` 下的 JSON 檔。`.gitignore` 已排除這些檔案，每個環境各自管理。
