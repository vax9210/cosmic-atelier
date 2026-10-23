# Cosmic Atelier v2.2–v2.5 發布前靜態審查

審查日期：2026-10-23。已直接修正發現的問題。未安裝軟體、未執行 Git、未部署、未呼叫 GitHub Actions。

## 結論及驗證界線

靜態檢查與現有 Node.js 測試通過；目前未發現未宣告的套件匯入或不存在的相對匯入。**這不是完整 Astro 建置成功的證明。** 本機僅有 Node.js，缺少 npm 與專案 node_modules，不能執行 Astro 編譯、WebP 處理或瀏覽器驗收。發布前仍須在既有且完整的 Node.js 22/npm 環境完成 build + preview。

本次驗證命令：

```powershell
node --test tests/*.test.mjs tests/preservation.audit.mjs
node --check scripts/update-feeds.mjs
node --check scripts/enhance-home.mjs
node --check scripts/make-sitemap.mjs
node --check scripts/verify-build.mjs
node --check src/pages/search-index.json.js
node --check src/lib/feed-data.js
```

結果：**12 項測試通過，0 項失敗**。包括 11 項一般測試及 1 項原始內容雜湊稽核。語法檢查通過。測試中的首頁／Sitemap／輸出驗證使用隔離暫存資料，不是完整 Astro 產物。

## 七項審查結果

| 項目 | 結果與修正 |
| --- | --- |
| Astro 5 語法與路由 | 原生 `.astro`、Markdown 模組、Vite `import.meta.glob`、靜態 GET endpoint、`astro:assets` 均屬 Astro 5 支援方式；移除舊 `Astro.glob` 使用。搜尋 JSON 明確設為 prerender。未引入伺服器 adapter。完整編譯待驗證。 |
| `/cosmic-atelier/` 基底路徑 | 保留原 Astro config；媒體、搜尋請求、內容連結沿用該前綴。Gallery 圖片的實際 URL 與 OG／JSON-LD 現在共用正規化函式。Sitemap 改用同一份站址常數。新增建置後檢查，對缺少前綴／不存在的站內檔案報錯。 |
| APOD／arXiv 回退 | 更新具有 15 秒逾時、HTTP／解析／資料驗證；成功後暫存寫入再 rename，失敗保留原檔並清理暫存。新增快取讀取防護，缺檔、壞 JSON、不合格連結／欄位不會讓頁面建置失敗。未連線也可建置。 |
| CMS、內容、動畫、網址 | 原始 ZIP 共 30 個檔案：22 個未變更，8 個網站程式／工作流程檔案有意修改，沒有刪除原始檔。22 個檔案包含 `.pages.yml`、全部 7 筆文章／攝影 Markdown、2 張圖片、原始首頁、指南及原始設定資料；SHA-256 全部相同。UUID、檔名與 slug 不改。 |
| Secrets | 沒有必填自訂 Secret。`NASA_API_KEY` 未設定或空字串時使用 `DEMO_KEY`，受限或失敗時仍回退。arXiv、搜尋、圖片及 SEO 不需要 Secret。GitHub Pages 使用 Actions 內建身分與既有 pages/id-token 權限，不需個人 PAT。 |
| Sitemap、草稿與 SEO | 清單、詳細路由與搜尋共用既有發布規則：文章 `!draft`；Gallery `draft === false` 且有照片。統一日期格式避免 Date 物件破壞排序／顯示及 JSON-LD。搜尋頁標為 `noindex,follow`，Sitemap 排除 noindex 頁；文章、作品、專區與既有指南仍可收錄。JSON-LD 跳脫 `<` 並在產物中驗證 JSON。 |
| 套件與匯入／建置 | 所有相對匯入目標存在；唯一直接套件需求為原有 Astro 5，圖片服務使用 Astro 相依的 Sharp。Node.js 22 提供 fetch、AbortSignal.timeout、node:test 等 API，不需另加套件。新增 build 產物檢查；實際 Astro 建置仍未執行。 |

## 已修正的具體問題

1. Gallery 清單的 `.item img` 是 scoped CSS，不能保證套用到 Photo 子元件；改成 `.item :global(img)`。
2. YAML 日期可能被解析為 Date；現在統一 `dateISO`，防止星期字串排序及截斷顯示錯誤，無效日期不再令 Article JSON-LD 拋出例外。
3. 各頁與搜尋各自實作草稿規則，易於分歧；已共用 helper，維持原有公開狀態。
4. 外部快取原本由 JSON import 直接讀取，損壞會讓 Vite／頁面失敗；改為建置時以檔案讀取、捕捉錯誤、驗證資料並回退空清單及官方入口。以專案工作目錄解析資料位置，避免打包後 import.meta.url 指向 chunk 的位置差異。
5. APOD 接受空標題、不存在的日期；arXiv 未解碼數字 XML entity／CDATA；已補上驗證與解析，拒絕空更新，失敗保留資料。
6. Gallery 詳細頁的 SEO 圖片與畫面圖片原先可能使用不同基底路徑；改為共用 imageURL。
7. Sitemap 原本無條件收錄每個 index.html；現在排除 noindex，搜尋頁不產生空搜尋頁的索引衝突。
8. 新增 `verify-build`，檢查 HTML 及搜尋索引內的站內連結／圖片、基底路徑與 JSON-LD。一般 build 自動執行。

原始內容雜湊稽核刻意獨立為 `npm run review:preservation`，**不納入每日 CI 一般測試**，避免使用者未來在 Pages CMS 正常編輯文章或首頁文字後，網站反而無法建置。雜湊基準代表本次升級前原始內容；未來有意編輯後，該獨立稽核會顯示差異，這不代表一般建置失敗。

## 發布前已知事項

- 所有文章原本都是草稿，故最新文章區目前顯示準備中。`example-draft.md` 標題雖稱不公開，實際原始欄位是 `draft: false`；完整保留，沒有替使用者改公開狀態。
- APOD／arXiv 快取目前仍為空。先前實際 API 呼叫因本機網路失敗；本次用 mock 驗證失敗、壞資料、成功寫入與舊快取保留，未宣稱外網 API 端到端成功。
- APOD 不嵌入或下載影像，不轉載解說全文／中文翻譯，只提供 metadata 與 NASA 原文入口；arXiv 僅書目，未轉載全文。
- Actions cache 不是永久資料庫。若 cache 過期且 API 無法使用，使用來源內快取；目前來源快取為空，因此顯示官方入口。需要長期保留時，可在有網路的環境成功執行更新後，由擁有者保存 `data/apod.json`、`data/research.json`。
- 原始根目錄 `sitemap.xml` 保留不動；正式產物以建置後產生的 `dist/sitemap.xml` 為準。不要用根目錄檔案覆蓋產物。
- 沒有 package-lock.json，Astro 目前仍是 `^5.16.0`。此次沒有安裝來產生假 lockfile；未來在既有環境完成驗收時可保存實際 lockfile，再另行採用 npm ci。

## 發布說明（此次未執行）

先在已具備 Node.js 22、npm 及專案相依套件的環境執行：

```powershell
npm test
npm run review:preservation
npm run update:feeds
npm run build
npm run preview -- --host 127.0.0.1
```

`npm run update:feeds` 是選擇性更新；外網失敗不應中止建置。`npm run build` 依序複製原始靜態檔、Astro 編譯、首頁增強、Sitemap 生成、產物驗證。完成後以終端機提供的網址加上 `/cosmic-atelier/` 預覽；檢查首頁動畫、Gallery 手機圖片、搜尋、原始 UUID 作品網址、指南與 SEO。`astro dev` 不執行首頁建置後增強，首頁驗收應使用 build + preview。

確認本機 build 成功且顯示正常後，由擁有者自行將以下來源變更上傳至原 repository。**上傳 main 會觸發既有部署工作流程，只有準備正式發布時才操作。** GitHub Pages 選 GitHub Actions。NASA key 選填，可完全不設定；不要上傳任何私人金鑰。

流程仍支援 main push、手動 dispatch，以及每日 UTC 08:23（台北 16:23）的排程。排程須存在於預設分支，可能延遲。它會還原 Actions cache、更新 metadata、測試並建置部署，不會自動 commit。不要把 `node_modules`、`.astro`、`public` 或 `dist` 當原始碼上傳。若需回退，使用原始 ZIP 還原來源後，由擁有者重新部署。

## 官方相容性依據

- [Astro 5 Markdown 匯入及模組匯出](https://v5.docs.astro.build/en/guides/markdown-content/)
- [Astro 5 圖片與 Sharp 相依說明](https://v5.docs.astro.build/en/guides/images/)
- [Astro 5 astro:assets API](https://v5.docs.astro.build/en/reference/modules/astro-assets/)

## 完整修改檔案清單

以下由原始 ZIP 比對產生；「新增」包含 v2.2–v2.5 第一輪實作及本次審查新增檔案。

修改原始檔案（8）：

- `.github/workflows/deploy.yml`
- `package.json`
- `scripts/make-sitemap.mjs`
- `src/layouts/ArticleLayout.astro`
- `src/pages/articles/[slug].astro`
- `src/pages/articles/index.astro`
- `src/pages/gallery/[slug].astro`
- `src/pages/gallery/index.astro`

新增檔案（21）：

- `PRE-RELEASE-REVIEW-v2.5.md`
- `UPGRADE-v2.5.md`
- `data/apod.json`
- `data/research.json`
- `scripts/enhance-home.mjs`
- `scripts/update-feeds.mjs`
- `scripts/verify-build.mjs`
- `src/components/CollectionSEO.astro`
- `src/components/Photo.astro`
- `src/layouts/SectionLayout.astro`
- `src/lib/feed-data.js`
- `src/lib/site.js`
- `src/pages/apod/index.astro`
- `src/pages/research/index.astro`
- `src/pages/search-index.json.js`
- `src/pages/search/index.astro`
- `tests/feeds.test.mjs`
- `tests/fixtures/original-files.sha256.json`
- `tests/output.test.mjs`
- `tests/preservation.audit.mjs`
- `tests/preservation.test.mjs`
