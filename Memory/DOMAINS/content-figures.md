# 理论正文图/表占位符机制（content_assets 方案3）

## 约定（方案3 主路径，2026-08）
- **全局资源库 `public.content_assets`**，无 `item_id`，可跨小节复用。后台理论编辑器「插入图/表」弹层列出资源，点「插入」把 `[图:asset_id]` / `[表:asset_id]` 引用写入正文。
- 图/表内容存 `content_assets.content`（figure=SVG, table=HTML），前端按 `asset_id` 取代资源。未入库的引用保留原文，不报错。
- 旧语法 `[图N:名称]` / `[表N:名称]`（`content_figures` 表）仍兼容，前端同时支持两种。

## 表结构（content_assets）
```sql
public.content_assets (
  id TEXT PRIMARY KEY,    -- 资源 id，如 p1b-m1-fig-position-vector
  name TEXT NOT NULL,     -- 资源名，如 "位置矢量"
  kind TEXT DEFAULT 'figure' CHECK (kind IN ('figure','table')),
  alt TEXT,               -- 描述/说明
  content TEXT NOT NULL,  -- SVG 文本(figure) 或 HTML 表格(table)
  created_at/updated_at TIMESTAMPTZ
)
```
- 建表：`scripts/migrations/004-content-assets.sql`（RLS 公开读 + admin 全权）
- 迁移：`scripts/seed/06-content-assets-migrate.sql`（旧 content_figures → content_assets，并改正文引用为 `[图:id]`）
- 迁移/种子需在 Supabase SQL Editor 手动执行后才生效。

## 数据链路（方案3）
- `src/services/content.js` `loadTheoryContent(itemId)`：返回 `{ content, examples, figures, assets }`，assets 来自 content_assets 联查。
- `src/services/admin.js` `getItemContent(itemId)`：同样返回 `assets`；新增 `listAssets/createAsset/updateAsset/deleteAsset`。
- `src/router.js`：内容相同但 `runtime.figures` 或 `runtime.assets` 非空时也注入 `runtimeTheoryContent`。
- 前端渲染 `src/views/practiceList.js` `renderTheoryContent(content, figures, assets)`：先解析 `[图:asset_id]`（assetMap）→ 再解析旧 `[图N:名称]`（figureMap）→ 临时 token → marked → 还原 HTML。
- 后台 `src/views/admin/adminPage.js`：资源弹层 `renderAssetOverlay` + `insertAssetRef` + `assetNew`；预览 `renderTheoryPreviewBody` 同逻辑。

## 样式
- `.cc-figure`（SVG 居中自适应）、`.cc-figure.cc-table`（表格边框）在 `src/style.css` 末尾；`.cc-figure svg` max-width 75%。

## 常见坑
- `content_assets` 表无 `updated_at` 更新需求时，`UPDATE items SET updated_at=...` 会报错（items 表无 updated_at 列），不要写。
- 引用 id 必须与 `content_assets.id` 完全一致，否则保留原文。
- SVG/HTML 内容入库用 dollar-quoting 避免 `'` 转义。

## 旧表 content_figures（兼容，不再新增）
- 表 `public.content_figures`（item_id/placeholder/kind/alt/content，`UNIQUE(item_id,placeholder)`），建表 `scripts/migrations/003-content-figures.sql`，种子 `scripts/seed/05-content-figures-position-vector.sql`。
- 前端仍兼容其旧语法 `[图N:名称]`，但新内容一律走 content_assets。方案3 已把旧 5 条迁入 content_assets。