-- ============================================================
-- CourseCore 内容图表入库 (图/表占位符解析数据底座)
-- 在 Supabase Dashboard → SQL Editor → New query 中粘贴并运行
--
-- 用途: 后台理论正文里用 [图N:名称] / [表N:名称] 标注需绘图/表格的位置,
--       对应 SVG/HTML 内容存本表, 前端渲染时按 item_id + 占位符名替换展示。
-- ============================================================

-- 1. content_figures 表
CREATE TABLE IF NOT EXISTS public.content_figures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id TEXT NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  placeholder TEXT NOT NULL,          -- 占位符名, 如 "图1" / "表2"
  kind TEXT NOT NULL DEFAULT 'figure' CHECK (kind IN ('figure', 'table')), -- figure=图 svg, table=表 html
  alt TEXT,                           -- 占位符里的名称, 如 "位置矢量"
  content TEXT NOT NULL,              -- SVG 文本(figure) 或 HTML 表格(table)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (item_id, placeholder)
);

-- 2. 公开可读 (学生端渲染时按 item 取图)
ALTER TABLE public.content_figures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "content_figures public read" ON public.content_figures;
CREATE POLICY "content_figures public read"
  ON public.content_figures FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "content_figures admin all" ON public.content_figures;
CREATE POLICY "content_figures admin all"
  ON public.content_figures FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));