-- ============================================================
-- CourseCore 全局图片/表格资源库 (方案3)
-- 在 Supabase Dashboard → SQL Editor → New query 中粘贴并运行
--
-- 用途: 图片资源全局统一管理, 不再死绑小节。后台编辑器导入/选择资源,
--       正文里写 [图:asset_id] / [表:asset_id] 引用, 前端渲染时按 asset_id
--       查本表替换展示。旧 content_figures 表保留作兼容, 不删除。
-- ============================================================

-- 1. content_assets 表 (全局资源库, 无 item_id, 可跨小节复用)
CREATE TABLE IF NOT EXISTS public.content_assets (
  id TEXT PRIMARY KEY,                -- 资源 ID, 如 "p1b-m1-fig-position-vector"
  name TEXT NOT NULL,                 -- 资源名, 如 "位置矢量"
  kind TEXT NOT NULL DEFAULT 'figure' CHECK (kind IN ('figure', 'table')), -- figure=图 svg, table=表 html
  alt TEXT,                           -- 描述/说明
  content TEXT NOT NULL,              -- SVG 文本(figure) 或 HTML 表格(table)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 公开可读 (学生端渲染时按 asset_id 取资源)
ALTER TABLE public.content_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "content_assets public read" ON public.content_assets;
CREATE POLICY "content_assets public read"
  ON public.content_assets FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "content_assets admin all" ON public.content_assets;
CREATE POLICY "content_assets admin all"
  ON public.content_assets FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));