# 理论正文图/表占位符机制（content_figures）

## 约定
- 后台可在理论正文中标注 `[图N:名称]` / `[表N:名称]` 占位符，`N` 从 1 起、同一小节内唯一。
- 图/表内容存 `public.content_figures` 表，前端运行时联查并替换占位符展示。未入库的占位符保留原文，不报错。

## 表结构
```sql
public.content_figures (
  id UUID PK DEFAULT gen_random_uuid(),
  item_id TEXT REFERENCES public.items(id) ON DELETE CASCADE,  -- 小节 id，如 p1b-m1-01
  placeholder TEXT NOT NULL,   -- 占位符名，如 "图1" / "表2"
  kind TEXT DEFAULT 'figure' CHECK (kind IN ('figure','table')), -- figure=svg, table=html
  alt TEXT,                    -- 占位符里的名称，如 "位置矢量"
  content TEXT NOT NULL,       -- SVG 文本(figure) 或 HTML 表格(table)
  created_at/updated_at TIMESTAMPTZ,
  UNIQUE (item_id, placeholder)
)
```
- 建表：`scripts/migrations/003-content-figures.sql`
- 种子：`scripts/seed/05-content-figures-position-vector.sql`（位置矢量 p1b-m1-01，dollar-quoting 包裹 SVG 防单引号转义）
- 迁移/种子需在 Supabase SQL Editor 手动执行后才生效。

## 数据链路
- `src/services/content.js` `loadTheoryContent(itemId)`：返回 `{ content, examples, figures }`，figures 来自 content_figures 联查。
- `src/services/admin.js` `getItemContent(itemId)`：同样返回 `figures`，供后台预览。
- `src/router.js`：内容相同但 `runtime.figures` 非空时也注入 `runtimeTheoryContent`，保证占位符可替换。
- 前端渲染 `src/views/practiceList.js` `renderTheoryContent(content, figures)`：先 `[图N]`→临时 token→marked 渲染→还原 HTML，避免 marked 干扰。
- 后台预览 `src/views/admin/adminPage.js` `renderTheoryPreviewBody(content, figures)`：与前端同逻辑。

## 样式
- `.cc-figure`（SVG 居中自适应）、`.cc-figure.cc-table`（表格边框样式）在 `src/style.css` 末尾。

## 常见坑
- 占位符必须与 content_figures.placeholder 完全一致（含"图/表"前缀和数字），否则无法匹配、保留原文。
- SVG 内容用 dollar-quoting 插入，避免 `'` 转义问题。