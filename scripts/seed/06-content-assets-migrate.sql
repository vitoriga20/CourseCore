-- ============================================================
-- Seed: 方案3 迁移 — 旧 content_figures → 全局资源库 content_assets
-- 在 scripts/migrations/004-content-assets.sql 之后运行
--
-- 1) 把 content_figures 的记录迁入 content_assets（旧表保留兼容）
-- 2) 把 items.content 正文里的 [图N:名称] 占位符改写为 [图:asset_id] 引用
--
-- 说明: 本迁移针对已知的 p1b-m1-01 五张图/表做显式映射，asset_id 语义稳定可读。
--       后续新增资源请直接在后台「插入图/表 → 新建资源」流程录入，不再走本文件。
-- ============================================================

-- 1. 迁入 content_assets（显式 asset_id，中文 alt 免被 regex 剥离）
INSERT INTO public.content_assets (id, name, kind, alt, content)
SELECT 'p1b-m1-fig-position-vector', '位置矢量', 'figure', '位置矢量', content
FROM public.content_figures WHERE item_id = 'p1b-m1-01' AND placeholder = '图1'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.content_assets (id, name, kind, alt, content)
SELECT 'p1b-m1-fig-displacement', '位移', 'figure', '位移', content
FROM public.content_figures WHERE item_id = 'p1b-m1-01' AND placeholder = '图2'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.content_assets (id, name, kind, alt, content)
SELECT 'p1b-m1-fig-derivative-integral', '微分积分转化关系', 'figure', '速度、加速度之间的微分和积分转化关系', content
FROM public.content_figures WHERE item_id = 'p1b-m1-01' AND placeholder = '图3'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.content_assets (id, name, kind, alt, content)
SELECT 'p1b-m1-tbl-velocity', '三种速度的关系', 'table', '三种速度的关系', content
FROM public.content_figures WHERE item_id = 'p1b-m1-01' AND placeholder = '表1'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.content_assets (id, name, kind, alt, content)
SELECT 'p1b-m1-tbl-acceleration', '二种加速度的关系', 'table', '二种加速度的关系', content
FROM public.content_figures WHERE item_id = 'p1b-m1-01' AND placeholder = '表2'
ON CONFLICT (id) DO NOTHING;

-- 2. 把正文里的 [图N:名称] / [表N:名称] 改写为 [图:asset_id] / [表:asset_id]
UPDATE public.items
SET content = replace(content,
  '[图1:位置矢量]',
  '[图:p1b-m1-fig-position-vector]'),
  updated_at = NOW()
WHERE id = 'p1b-m1-01';

UPDATE public.items
SET content = replace(content,
  '[图2:位移]',
  '[图:p1b-m1-fig-displacement]'),
  updated_at = NOW()
WHERE id = 'p1b-m1-01';

UPDATE public.items
SET content = replace(content,
  '[图3:速度、加速度之间的微分和积分转化关系]',
  '[图:p1b-m1-fig-derivative-integral]'),
  updated_at = NOW()
WHERE id = 'p1b-m1-01';

UPDATE public.items
SET content = replace(content,
  '[表1:三种速度的关系]',
  '[表:p1b-m1-tbl-velocity]'),
  updated_at = NOW()
WHERE id = 'p1b-m1-01';

UPDATE public.items
SET content = replace(content,
  '[表2:二种加速度的关系]',
  '[表:p1b-m1-tbl-acceleration]'),
  updated_at = NOW()
WHERE id = 'p1b-m1-01';