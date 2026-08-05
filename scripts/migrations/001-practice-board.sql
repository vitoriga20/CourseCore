-- CourseCore 刷题板块 DB 迁移
-- 版本: 001 | 日期: 2026-08-03
-- 在 Supabase Dashboard → SQL Editor → New query 中粘贴并运行
-- 依赖: scripts/supabase-schema.sql 已执行（profiles/exam_papers/exam_sections/exam_questions 已存在）

-- ============================================================
-- 1. exam_questions 扩展字段：答案显示时机
-- ============================================================
ALTER TABLE public.exam_questions
  ADD COLUMN IF NOT EXISTS answer_reveal TEXT DEFAULT 'after_submit'
    CHECK (answer_reveal IN ('instant', 'after_submit'));

COMMENT ON COLUMN public.exam_questions.answer_reveal IS
  '答案显示时机: instant=每做一题即时评判(练习模式), after_submit=提交后才出成绩(考试模式)';

-- ============================================================
-- 2. 收藏表（理论/题目/试卷/文章 通用）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  ref_type TEXT NOT NULL CHECK (ref_type IN ('theory', 'question', 'exam', 'article')),
  ref_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, ref_type, ref_id)
);

COMMENT ON TABLE public.favorites IS '通用收藏: theory→items.id, question→exam_questions.id, exam→exam_papers.id或my_papers.id, article→posts.id';

-- ============================================================
-- 3. 错题库（艾宾浩斯 + Shiroha 精细模型）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wrong_book (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,                         -- 知识库按学科独立，值与 exam_papers.subject 对齐
  curve_type TEXT NOT NULL DEFAULT 'classic' CHECK (curve_type IN ('compact', 'classic')),
  stage INT NOT NULL DEFAULT 0,                      -- 复习阶段 = reviewLevel (0=刚答错)
  wrong_count INT NOT NULL DEFAULT 0,
  right_count INT NOT NULL DEFAULT 0,
  streak_correct_count INT NOT NULL DEFAULT 0,       -- 连续答对次数（关键: >=2 毕业）
  status TEXT NOT NULL DEFAULT '未掌握' CHECK (status IN ('未掌握', '复习中', '已掌握')),
  reason TEXT CHECK (reason IN ('概念不清', '计算失误', '审题错误', '方法不熟', '时间不够')),
  last_wrong_at TIMESTAMPTZ,
  last_correct_at TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  last_answer JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, question_id)
);

COMMENT ON TABLE public.wrong_book IS '错题库: 融合艾宾浩斯曲线 + Shiroha streak 模型';
COMMENT ON COLUMN public.wrong_book.stage IS '复习阶段: 经典曲线[1,2,4,7,15]天 5阶段 / 紧凑[1,2,4]天 3阶段';
COMMENT ON COLUMN public.wrong_book.curve_type IS 'classic=经典5阶段, compact=紧凑3阶段 (全局配置, 切换时重合算法)';

-- ============================================================
-- 4. 刷题技巧文章（社区）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,                                      -- Markdown
  category TEXT,                                     -- 高数/线代/大物/方法
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.posts IS '社区文章: pending=待审(普通用户), published=已发布(管理员直接发布)';

-- ============================================================
-- 5. 文章收藏
-- ============================================================
CREATE TABLE IF NOT EXISTS public.post_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, post_id)
);

-- ============================================================
-- 6. 我的试卷（自组卷）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.my_papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  question_ids JSONB NOT NULL DEFAULT '[]'::jsonb,   -- 有序题目 id 数组
  answer_reveal TEXT DEFAULT 'after_submit' CHECK (answer_reveal IN ('instant', 'after_submit')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN public.my_papers.question_ids IS '有序 exam_questions.id 数组, 顺序即答题顺序';

-- ============================================================
-- 7. 刷题总结记录（每次提交保存一条）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.practice_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('exam', 'type_group', 'wrong_review', 'my_paper', 'favorite')),
  source_id TEXT,                                    -- exam_papers.id / 题型组卷key / my_papers.id
  source_name TEXT,                                  -- 显示名: "高数A2·2019" / "高数·单选题组" / 自定义试卷名
  subject_id TEXT,                                   -- 学科
  total INT NOT NULL DEFAULT 0,
  answered INT NOT NULL DEFAULT 0,
  correct INT NOT NULL DEFAULT 0,
  wrong INT NOT NULL DEFAULT 0,
  accuracy NUMERIC DEFAULT 0,
  duration_seconds INT DEFAULT 0,
  details JSONB DEFAULT '[]'::jsonb,                 -- 每题明细: [{question_id, user_answer, correct, ...}]
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.practice_records IS '刷题总结记录: 每次提交保存一条, 不保存答题过程(重刷全新清空)';

-- ============================================================
-- 8. 启用 RLS
-- ============================================================
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wrong_book ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.my_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_records ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 9. RLS 策略
-- ============================================================

-- favorites: 用户只能 CRUD 自己的收藏
DROP POLICY IF EXISTS "users_crud_own_favorites" ON public.favorites;
CREATE POLICY "users_crud_own_favorites"
  ON public.favorites FOR ALL
  USING (auth.uid() = user_id);

-- wrong_book: 用户只能 CRUD 自己的错题
DROP POLICY IF EXISTS "users_crud_own_wrong_book" ON public.wrong_book;
CREATE POLICY "users_crud_own_wrong_book"
  ON public.wrong_book FOR ALL
  USING (auth.uid() = user_id);

-- posts: published 公开可读, 作者可改自己的, admin 可管理全部
DROP POLICY IF EXISTS "posts_published_readable" ON public.posts;
CREATE POLICY "posts_published_readable"
  ON public.posts FOR SELECT
  USING (status = 'published' OR auth.uid() = author_id OR public.is_admin());

DROP POLICY IF EXISTS "users_insert_own_posts" ON public.posts;
CREATE POLICY "users_insert_own_posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "users_update_own_posts" ON public.posts;
CREATE POLICY "users_update_own_posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = author_id OR public.is_admin());

DROP POLICY IF EXISTS "admin_delete_posts" ON public.posts;
CREATE POLICY "admin_delete_posts"
  ON public.posts FOR DELETE
  USING (auth.uid() = author_id OR public.is_admin());

-- post_favorites: 用户只能 CRUD 自己的文章收藏
DROP POLICY IF EXISTS "users_crud_own_post_favorites" ON public.post_favorites;
CREATE POLICY "users_crud_own_post_favorites"
  ON public.post_favorites FOR ALL
  USING (auth.uid() = user_id);

-- my_papers: 用户只能 CRUD 自己的试卷
DROP POLICY IF EXISTS "users_crud_own_my_papers" ON public.my_papers;
CREATE POLICY "users_crud_own_my_papers"
  ON public.my_papers FOR ALL
  USING (auth.uid() = user_id);

-- practice_records: 用户只能 CRUD 自己的刷题记录
DROP POLICY IF EXISTS "users_crud_own_practice_records" ON public.practice_records;
CREATE POLICY "users_crud_own_practice_records"
  ON public.practice_records FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- 10. 索引
-- ============================================================

-- 错题库: 复习队列查询 (用户 + 到期时间)
CREATE INDEX IF NOT EXISTS idx_wrong_book_user_next_review
  ON public.wrong_book (user_id, next_review_at)
  WHERE status != '已掌握';

-- 错题库: 按学科筛选
CREATE INDEX IF NOT EXISTS idx_wrong_book_user_subject
  ON public.wrong_book (user_id, subject_id);

-- 收藏: 按类型筛选
CREATE INDEX IF NOT EXISTS idx_favorites_user_type
  ON public.favorites (user_id, ref_type);

-- 文章: 列表查询 (已发布, 按时间倒序)
CREATE INDEX IF NOT EXISTS idx_posts_status_created
  ON public.posts (status, created_at DESC);

-- 文章: 按分类筛选
CREATE INDEX IF NOT EXISTS idx_posts_category
  ON public.posts (category)
  WHERE status = 'published';

-- 我的试卷: 用户列表
CREATE INDEX IF NOT EXISTS idx_my_papers_user
  ON public.my_papers (user_id);

-- 刷题记录: 用户列表 (按时间倒序)
CREATE INDEX IF NOT EXISTS idx_practice_records_user_created
  ON public.practice_records (user_id, created_at DESC);

-- 刷题记录: 排行榜聚合 (按用户统计)
CREATE INDEX IF NOT EXISTS idx_practice_records_user
  ON public.practice_records (user_id);

-- ============================================================
-- 11. updated_at 自动更新触发器
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_wrong_book_updated ON public.wrong_book;
CREATE TRIGGER trg_wrong_book_updated
  BEFORE UPDATE ON public.wrong_book
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_posts_updated ON public.posts;
CREATE TRIGGER trg_posts_updated
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_my_papers_updated ON public.my_papers;
CREATE TRIGGER trg_my_papers_updated
  BEFORE UPDATE ON public.my_papers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 12. 排行榜聚合视图（4 个独立榜: 试卷数/题量/正确率/耗时）
-- ============================================================
CREATE OR REPLACE VIEW public.leaderboard_view AS
SELECT
  r.user_id,
  p.display_name,
  p.avatar_url,
  COUNT(DISTINCT CASE WHEN r.mode = 'exam' THEN r.source_id END) AS exam_count,
  SUM(r.total) AS total_questions,
  ROUND(AVG(r.accuracy), 1) AS avg_accuracy,
  ROUND(SUM(r.duration_seconds) / 3600.0, 1) AS total_hours
FROM public.practice_records r
LEFT JOIN public.profiles p ON p.id = r.user_id
GROUP BY r.user_id, p.display_name, p.avatar_url;

COMMENT ON VIEW public.leaderboard_view IS '排行榜聚合视图: 4个独立榜(试卷数/题量/正确率/耗时), 前端按维度排序';

-- ============================================================
-- 13. 排行榜 RPC（返回全部用户，0 刷题也参与排序）
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  exam_count bigint,
  total_questions bigint,
  avg_accuracy numeric,
  total_hours numeric,
  created_at timestamptz
) LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT
    u.id AS user_id,
    p.display_name,
    p.avatar_url,
    COUNT(DISTINCT CASE WHEN r.mode = 'exam' THEN r.source_id END) AS exam_count,
    COALESCE(SUM(r.total), 0) AS total_questions,
    COALESCE(ROUND(AVG(r.accuracy), 1), 0) AS avg_accuracy,
    COALESCE(ROUND(SUM(r.duration_seconds) / 3600.0, 1), 0) AS total_hours,
    u.created_at
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  LEFT JOIN public.practice_records r ON r.user_id = u.id
  GROUP BY u.id, p.display_name, p.avatar_url, u.created_at
  ORDER BY u.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO public;

COMMENT ON FUNCTION public.get_leaderboard() IS '排行榜: 返回全部注册用户（含 0 刷题），按注册时间升序，前端再按指标排序';

-- ============================================================
-- 迁移完成
-- 验证: SELECT * FROM information_schema.tables WHERE table_name IN ('favorites','wrong_book','posts','post_favorites','my_papers','practice_records');
-- ============================================================
