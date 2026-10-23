# Cosmic Atelier v2.2–v2.5 本機升級紀錄

日期：2026-10-23（Asia/Taipei）。

本文件記錄第一輪升級；審查修正、最新測試結果、完整檔案清單與發布說明請以 [發布前審查報告](PRE-RELEASE-REVIEW-v2.5.md) 為準。只修改本機，沒有使用 Git、發布或建立 PR。

## 原始備份及內容保護

備份：`C:\Users\vax92\.codex\visualizations\2026\10\23\01a1682b-fd09-7e03-a5aa-3b2668b4c35d\cosmic-atelier-original-20261023.zip`

備份在任何修改前建立。以 ZIP 內原始檔 SHA-256 比對確認：沒有刪除原始檔，`.pages.yml`、所有文章 Markdown、Gallery Markdown、原始媒體、首頁 `index.html`、指南與既有資料均未更動。

Gallery 的 `example-draft.md` 雖然標題寫不公開，實際為 `draft: false`。保留原設定，網站仍按欄位公開。文章全部為草稿，因此最新文章顯示準備中；不產生假文章。

## 原架構檢查

- Astro 5 靜態建置，`site=https://vax9210.github.io`、`base=/cosmic-atelier`。
- `scripts/sync-assets.mjs` 複製根目錄靜態首頁、媒體、指南、資料及 Google 驗證檔至 `public`。
- 根目錄 `index.html` 包含 canvas 星空、行星、加速、減少動態效果設定、Pages CMS 文案載入、來源目錄搜尋。
- 文章及 Gallery 以 Markdown frontmatter 提供資料；現有網址由檔名產生，升級不改 slug 或重新命名。
- Pages CMS 使用 `{fields.id}.md`，隱藏 UUID、不可編輯；原設定完整保留。
- 舊 Sitemap 列舉有限路由，已改為掃描實際建置的 HTML。
- GitHub Actions 原為 main push／手動執行後建置部署；新增每日更新與測試，但未觸發。

## 階段與驗證

1. v2.2：建置後把最新三篇文章與三件作品寫入首頁 HTML，保留原動畫及內容；加入新專區導覽。以獨立測試資料驗證首頁產生、文字跳脫及原動畫保留。
2. v2.3：APOD 書目入口、arXiv astro-ph 最新 12 筆書目、更新日期、空資料提示、逾時及快取回退。測試圖片／影片、版權欄位、Atom 解析、HTTP 429、離線、壞 JSON、成功寫入。
3. v2.4：Astro Image 處理本機照片，產生 WebP、srcset、尺寸資訊，清單延遲載入，主圖優先載入；手機網格與觀測資料可縮排。首頁使用 640px 縮圖。這部分需完整 Astro 建置與手機瀏覽器驗證。
4. v2.5：文章／作品／研究搜尋，包含文章正文、設備、天體及作者；類型篩選、Unicode 正規化、多關鍵字、結果數、失敗提示。CollectionPage、Article、ImageObject 結構化資料及社群欄位改善；Sitemap 自動收錄實際輸出頁面。輸出測試驗證新路由與 GitHub Pages base。

本機 `node --test tests/*.test.mjs`：5 項通過。更新與建置後處理 JavaScript 語法檢查通過。實際 API 連線失敗，更新腳本正常結束並保留原快取。

**驗證限制：本機有 Node.js，但無 npm，且無專案 node_modules／Astro。未安裝大型開發環境，無法執行完整 Astro build、圖片轉檔及瀏覽器／手機實測。因此本版程式實作仍待完整建置驗收，不能宣稱可直接發布。**

## 外部資料及授權

執行 `npm run update:feeds` 才連線；`npm run build` 不要求外部 API 可用。更新每來源最多 15 秒、沒有重試風暴；失敗不覆蓋既有快取。APOD 及 arXiv 分開更新，一方失敗不影響另一方。

APOD 僅儲存標題、日期、媒體類型、版權欄位與當日原始頁面連結；不儲存圖片網址、圖片、影片、英文解說或中文全文翻譯。NASA 的版權欄位不等同授權。arXiv 僅保留原始標題、作者、日期、分類、abs 連結，不轉載全文或製造中文翻譯。

官方依據：
- https://api.nasa.gov/
- https://science.nasa.gov/apod/apod-about/
- https://github.com/arXiv/arxiv-docs/blob/develop/source/help/api/user-manual.md

初始快取為空，API 尚未成功取得，專區仍提供官方入口。GitHub Actions 使用 `actions/cache` 恢復上次資料，更新結果保留在建置及 Actions cache，不會自動 commit 回來源。GitHub cache 有容量／保存期限，失效且 API 失敗時回到已提交快取或空資料提示。

## 完整變更檔案

修改：
- `.github/workflows/deploy.yml`
- `package.json`
- `scripts/make-sitemap.mjs`
- `src/layouts/ArticleLayout.astro`
- `src/pages/articles/index.astro`
- `src/pages/gallery/index.astro`
- `src/pages/gallery/[slug].astro`

新增：
- `data/apod.json`
- `data/research.json`
- `scripts/update-feeds.mjs`
- `scripts/enhance-home.mjs`
- `src/lib/site.js`
- `src/components/Photo.astro`
- `src/components/CollectionSEO.astro`
- `src/layouts/SectionLayout.astro`
- `src/pages/apod/index.astro`
- `src/pages/research/index.astro`
- `src/pages/search/index.astro`
- `src/pages/search-index.json.js`
- `tests/feeds.test.mjs`
- `tests/output.test.mjs`
- `UPGRADE-v2.5.md`

## 本機驗收方法（具備 npm 後）

使用 Node.js 22 與 npm，在專案目錄執行：

```powershell
npm install --no-audit --no-fund
npm test
npm run update:feeds
npm run build
npm run preview -- --host 127.0.0.1
```

開啟終端機列出的預覽網址，路徑加 `/cosmic-atelier/`。檢查首頁動畫、最新作品、APOD、research、search、所有既有指南及 UUID 作品網址、320px 手機寬度、鍵盤搜尋與 JSON-LD。API 失敗時頁面應有空資料／舊快取提示。確認 `dist/search-index.json` 無草稿文章、`dist/sitemap.xml` 路由完整、圖片含 srcset 並實際輸出 WebP。

首頁最新內容在 build 的後處理產生，`astro dev` 不會執行這段；請用 build + preview 驗收整合首頁。`public`、`dist`、`.astro` 是執行後產生的檔案，不作為原始內容編輯位置。

## 未來發布方法（此次未執行）

1. 完成上述本機驗收；保留原備份。
2. 由網站擁有者將上述新增／修改的來源檔上傳至原 GitHub repository，保留 `.pages.yml`、全部內容及原網址。不要上傳 node_modules、dist 或 public 複製品。
3. GitHub Settings → Pages 選 GitHub Actions；需要時在 Actions secrets 設 `NASA_API_KEY`，未設定則使用受限 DEMO_KEY。
4. main 分支上傳會觸發既有 deploy workflow；也可於 Actions 手動執行。這一步會發布，應在驗收後由擁有者操作。
5. 工作流程每天 UTC 08:23／台北 16:23 更新快取並建置部署；排程由 GitHub 執行，可能延遲，且須工作流程位於預設分支。回退時以原始 ZIP 還原來源，再由擁有者重新部署。

目前沒有 lockfile，workflow 沿用 npm install；第一次成功安裝後可保留產生的 package-lock.json，再另行改成 npm ci 以固定相依版本。
