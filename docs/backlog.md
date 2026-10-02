# 待辦與後續討論事項

## 待討論

### 網站來訪人數統計（2026-10-02 提出）
需求：統計來訪人數，管理者與同事登入後可查看。

可行方案：
| 做法 | 同事查看方式 | 費用 / 工作量 |
|---|---|---|
| Google Analytics 4（建議先採用） | 各自用 Google 帳號登入 GA，管理者分配檢視權限 | 免費，網站加追蹤碼即可 |
| Vercel Analytics | 需登入 Vercel；免費方案僅一個帳號，多人需付費方案 | 開啟即用，不適合多人 |
| 自建統計於網站後台 | 登入汎德網站管理頁查看 | 需資料庫與登入系統，等同提前做第二期後台 |

可一併追蹤「即時規劃」使用次數與 PDF 下載次數。
採用 GA4 時需提供：公司 Google 帳號建立的 GA4 評估 ID（G-XXXXXXX）。

## 待補資料

- 台電營業規章修正日期：即時規劃頁「引用法規」需補上版本日期。
- 消息中心的實際法規公告 PDF（放 `public/documents/`，於 `src/data/news.ts` 設定附件）。

## 待辦

- 正式網域 allcom.com.tw 的 DNS 指向 Vercel。
- 從 GitHub 網頁刪除已合併的 `feature/distribution-room-tool` 分支（雲端開發環境無法刪除遠端分支；本地分支已刪）。

## 後續規劃

- 即時規劃：電信室面積、給水水理計算、空調風管/水管計算。
- 第二期：CMS 後台（行政同事自行發布消息）。
- 第三期：建築師會員系統（分級權限、機電空間規劃建議）。

## 維護備忘

- 新增附公文的消息：原始 PDF 放 `public/documents/<slug>.pdf`，逐頁轉 JPG（150 dpi）放 `public/news/<slug>/p1.jpg…`，
  再於 `src/data/news.ts` 新增一筆（`slug`、`points` 重點整理、`pages`、`attachment`），即自動產生內頁 `/news/<slug>`。

- 修改 `src/lib/distributionRoom.ts`、`src/components/DistributionRoomPdf.tsx`、`src/data/contact.ts` 的文字後，
  需執行 `npm run pdf-font:subset -- <原始字型資料夾>` 重新產生 PDF 子集字型；建置前會自動檢查缺字。
  原始字型可由 npm 套件 `@expo-google-fonts/noto-sans-tc` 取得（`400Regular`、`700Bold`）。
