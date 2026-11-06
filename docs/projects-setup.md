# 專案機電空間檢討：Vercel 設定步驟

專案功能需在 Vercel 後台設定資料庫與兩個環境變數；設定值不進 repo。設定完成前，`/projects` 會顯示「專案功能尚未啟用」，其他頁面不受影響。

## 1. 安裝 Neon Postgres（免費方案）

1. 登入 Vercel，開啟 `allcom-website` 專案。
2. 上方選單 **Storage** → **Create Database**（或 Browse Marketplace）→ 選 **Neon**（Serverless Postgres）→ **Continue**。
3. 方案選 **Free**，區域建議 **Singapore（ap-southeast-1）**，資料庫名稱可用 `allcom-projects`。
4. 連結到 `allcom-website` 專案時，**Production、Preview、Development 三個環境都勾選**。
5. 完成後，Vercel 會自動新增 `DATABASE_URL` 等環境變數（可於 Settings → Environment Variables 看到）。

資料表會在第一次使用專案功能時自動建立，不需另外操作。

## 2. 新增環境變數

Settings → **Environment Variables** → Add New，三個環境都勾選：

| Key | Value |
|---|---|
| `ADMIN_PASSWORD` | 管理密碼（自訂，建議 12 字以上，只有負責人知道） |
| `SESSION_SECRET` | 隨機字串，至少 32 字；可用密碼管理器產生，或電腦終端機執行 `openssl rand -base64 48` |

- `SESSION_SECRET` 用於登入憑證簽章；更換後所有人需重新登入。
- 管理密碼更換：修改 `ADMIN_PASSWORD` 後重新部署即可。

## 3. 重新部署

Deployments → 最新一筆 → **Redeploy**，環境變數才會生效。完成後開啟 `/projects`，以管理密碼登入即可新增專案。
