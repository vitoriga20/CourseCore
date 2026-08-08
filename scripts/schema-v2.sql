-- ============================================================
-- CourseCore Supabase 数据库初始化 v2 (统一题库数据模型)
-- 在 Supabase Dashboard → SQL Editor → New query 中粘贴并运行
--
-- 破坏性变更(相对 v1):
--   * questions 表删除 item_id/course_id/module_id 冗余列, id 全局唯一(TEXT)
--   * 删除 theory_contents 表(正文并入 items.content, 例题落 questions 真实行)
--   * 删除 exam_questions 表(试卷题并入 questions, 关联走 exam_paper_questions)
--   * 新增 item_questions / exam_paper_questions 关联表
--   * question_kp 删除 source 多态列, 单一 FK → questions.id
--   * answers.question_id / progress.item_id 补真实外键
-- ============================================================

-- 1. 用户扩展资料表
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role TEXT DEFAULT 'free' CHECK (role IN ('free', 'paid', 'admin')),
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 做题记录表
CREATE TABLE IF NOT EXISTS public.answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  answer JSONB,
  is_correct BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 小节学习进度表
CREATE TABLE IF NOT EXISTS public.progress (
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  score NUMERIC,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, item_id)
);

-- 4. 开启 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;

-- 5. RLS 策略：用户只能访问自己的数据
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can CRUD own answers" ON public.answers;
CREATE POLICY "Users can CRUD own answers"
  ON public.answers FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can CRUD own progress" ON public.progress;
CREATE POLICY "Users can CRUD own progress"
  ON public.progress FOR ALL
  USING (auth.uid() = user_id);

-- 6. 新用户注册时自动创建 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'free')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. 课程内容表
CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  requirements JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.modules (
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  title TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  PRIMARY KEY (course_id, module_id)
);

-- items.content 承接原 theory_contents.content (理论正文)
CREATE TABLE IF NOT EXISTS public.items (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'theory',
  order_index INTEGER DEFAULT 0,
  content TEXT,
  FOREIGN KEY (course_id, module_id) REFERENCES public.modules(course_id, module_id) ON DELETE CASCADE
);

-- 8. 统一题库：只存题目本体, id 全局唯一(TEXT)
--    平台题 id 形如 q-*, 理论例题 id 形如 {itemId}-ex{idx}, 试卷题沿用原 id
CREATE TABLE IF NOT EXISTS public.questions (
  id TEXT PRIMARY KEY,
  question_type INTEGER NOT NULL DEFAULT 0,
  title TEXT,
  content TEXT,
  options JSONB DEFAULT '[]'::jsonb,
  answer TEXT,
  answers JSONB DEFAULT '[]'::jsonb,
  blanks INTEGER,
  tolerance NUMERIC,
  unit TEXT,
  solution TEXT,
  hint TEXT,
  test_string TEXT,
  image TEXT,
  difficulty INTEGER DEFAULT 1,
  tags JSONB DEFAULT '[]'::jsonb,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. 小节-题目关联表：表达"某小节用了哪些题、是练习还是例题、顺序"
CREATE TABLE IF NOT EXISTS public.item_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id TEXT NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'practice' CHECK (role IN ('practice', 'theory_example')),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (item_id, question_id, role)
);

-- 10. 试卷
CREATE TABLE IF NOT EXISTS public.exam_papers (
  id TEXT PRIMARY KEY,
  name TEXT,
  state TEXT DEFAULT 'draft',         -- 'draft' | 'published'
  school TEXT,
  college TEXT,
  subject TEXT,
  term TEXT,
  duration TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exam_sections (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL REFERENCES public.exam_papers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER DEFAULT 0
);

-- 11. 试卷-题目关联表：试卷不复每题, 复用统一题库
CREATE TABLE IF NOT EXISTS public.exam_paper_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id TEXT NOT NULL REFERENCES public.exam_papers(id) ON DELETE CASCADE,
  section_id TEXT REFERENCES public.exam_sections(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  score NUMERIC DEFAULT 5,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (exam_id, question_id)
);

-- 12. 启用 RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_paper_questions ENABLE ROW LEVEL SECURITY;

-- 13. admin 辅助函数
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id uuid,
  email text,
  role text,
  display_name text,
  avatar_url text,
  created_at timestamptz,
  last_sign_in_at timestamptz
) AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    COALESCE(p.role, 'free')::text AS role,
    p.display_name,
    p.avatar_url,
    u.created_at,
    u.last_sign_in_at
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id uuid)
RETURNS void AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  DELETE FROM public.profiles WHERE id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. RLS 策略：内容表公开可读，admin 可写
DROP POLICY IF EXISTS "courses_readable_by_everyone" ON public.courses;
CREATE POLICY "courses_readable_by_everyone"
  ON public.courses FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "modules_readable_by_everyone" ON public.modules;
CREATE POLICY "modules_readable_by_everyone"
  ON public.modules FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "items_readable_by_everyone" ON public.items;
CREATE POLICY "items_readable_by_everyone"
  ON public.items FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "questions_readable_by_everyone" ON public.questions;
CREATE POLICY "questions_readable_by_everyone"
  ON public.questions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "item_questions_readable_by_everyone" ON public.item_questions;
CREATE POLICY "item_questions_readable_by_everyone"
  ON public.item_questions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "exam_papers_readable_by_everyone" ON public.exam_papers;
CREATE POLICY "exam_papers_readable_by_everyone"
  ON public.exam_papers FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "exam_sections_readable_by_everyone" ON public.exam_sections;
CREATE POLICY "exam_sections_readable_by_everyone"
  ON public.exam_sections FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "exam_paper_questions_readable_by_everyone" ON public.exam_paper_questions;
CREATE POLICY "exam_paper_questions_readable_by_everyone"
  ON public.exam_paper_questions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "admin_can_manage_courses" ON public.courses;
CREATE POLICY "admin_can_manage_courses"
  ON public.courses FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin_can_manage_modules" ON public.modules;
CREATE POLICY "admin_can_manage_modules"
  ON public.modules FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin_can_manage_items" ON public.items;
CREATE POLICY "admin_can_manage_items"
  ON public.items FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin_can_manage_questions" ON public.questions;
CREATE POLICY "admin_can_manage_questions"
  ON public.questions FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin_can_manage_item_questions" ON public.item_questions;
CREATE POLICY "admin_can_manage_item_questions"
  ON public.item_questions FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin_can_manage_exam_papers" ON public.exam_papers;
CREATE POLICY "admin_can_manage_exam_papers"
  ON public.exam_papers FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin_can_manage_exam_sections" ON public.exam_sections;
CREATE POLICY "admin_can_manage_exam_sections"
  ON public.exam_sections FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin_can_manage_exam_paper_questions" ON public.exam_paper_questions;
CREATE POLICY "admin_can_manage_exam_paper_questions"
  ON public.exam_paper_questions FOR ALL
  USING (public.is_admin());

-- 15. 考点系统
-- 15.1 考点字典表 (source 仍保留, 用于区分平台考点/试卷考点; 但题目关联不再依赖 source)
CREATE TABLE IF NOT EXISTS public.knowledge_points (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  course_id   TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  item_id     TEXT REFERENCES public.items(id) ON DELETE CASCADE,
  source      TEXT NOT NULL CHECK (source IN ('platform','exam')),
  parent_id   UUID REFERENCES public.knowledge_points(id) ON DELETE CASCADE,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.knowledge_points DROP CONSTRAINT IF EXISTS kp_platform_requires_item;
ALTER TABLE public.knowledge_points
  ADD CONSTRAINT kp_platform_requires_item
  CHECK (
    source <> 'platform' OR item_id IS NOT NULL
  );

-- 15.2 题-考点关联表：单一 FK → questions.id, 无多态 source
CREATE TABLE IF NOT EXISTS public.question_kp (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id  TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  kp_id        UUID NOT NULL REFERENCES public.knowledge_points(id) ON DELETE CASCADE,
  role         TEXT NOT NULL CHECK (role IN ('primary','secondary')),
  weight       NUMERIC DEFAULT 1.0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (question_id, kp_id)
);

-- 每题 primary 至多 1 个
CREATE UNIQUE INDEX IF NOT EXISTS UQ_question_kp_primary_once
  ON public.question_kp (question_id)
  WHERE role = 'primary';

-- 15.3 启用 RLS
ALTER TABLE public.knowledge_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_kp ENABLE ROW LEVEL SECURITY;

-- 15.4 RLS 策略
DROP POLICY IF EXISTS "knowledge_points_readable_by_everyone" ON public.knowledge_points;
CREATE POLICY "knowledge_points_readable_by_everyone"
  ON public.knowledge_points FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "question_kp_readable_by_everyone" ON public.question_kp;
CREATE POLICY "question_kp_readable_by_everyone"
  ON public.question_kp FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "admin_can_manage_knowledge_points" ON public.knowledge_points;
CREATE POLICY "admin_can_manage_knowledge_points"
  ON public.knowledge_points FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin_can_manage_question_kp" ON public.question_kp;
CREATE POLICY "admin_can_manage_question_kp"
  ON public.question_kp FOR ALL
  USING (public.is_admin());

-- 16. 索引
CREATE INDEX IF NOT EXISTS idx_items_course_module
  ON public.items(course_id, module_id);

CREATE INDEX IF NOT EXISTS idx_item_questions_item
  ON public.item_questions(item_id);

CREATE INDEX IF NOT EXISTS idx_item_questions_question
  ON public.item_questions(question_id);

CREATE INDEX IF NOT EXISTS idx_exam_sections_exam
  ON public.exam_sections(exam_id);

CREATE INDEX IF NOT EXISTS idx_exam_paper_questions_exam
  ON public.exam_paper_questions(exam_id);

CREATE INDEX IF NOT EXISTS idx_exam_paper_questions_section
  ON public.exam_paper_questions(section_id);

CREATE INDEX IF NOT EXISTS idx_exam_paper_questions_question
  ON public.exam_paper_questions(question_id);

CREATE INDEX IF NOT EXISTS idx_answers_user_item
  ON public.answers(user_id, item_id);

CREATE INDEX IF NOT EXISTS idx_answers_question
  ON public.answers(user_id, question_id);

CREATE INDEX IF NOT EXISTS idx_progress_user
  ON public.progress(user_id);

CREATE INDEX IF NOT EXISTS idx_kp_course
  ON public.knowledge_points(course_id);

CREATE INDEX IF NOT EXISTS idx_kp_item
  ON public.knowledge_points(item_id);

CREATE INDEX IF NOT EXISTS idx_kp_source
  ON public.knowledge_points(source);

CREATE INDEX IF NOT EXISTS idx_qk_question
  ON public.question_kp(question_id);

CREATE INDEX IF NOT EXISTS idx_qk_kp
  ON public.question_kp(kp_id);

-- ============================================================
-- 数据完整性外键 (answers/progress 依赖 items/questions, 故后置)
-- ============================================================
ALTER TABLE public.answers
  ADD CONSTRAINT fk_answers_item FOREIGN KEY (item_id)
    REFERENCES public.items(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_answers_question FOREIGN KEY (question_id)
    REFERENCES public.questions(id) ON DELETE CASCADE;

ALTER TABLE public.progress
  ADD CONSTRAINT fk_progress_item FOREIGN KEY (item_id)
    REFERENCES public.items(id) ON DELETE CASCADE;

-- ============================================================
-- 级联删除说明 (v2)
--   modules.course_id → courses.id            CASCADE
--   items.course_id → courses.id              CASCADE
--   items.(course_id,module_id) → modules     CASCADE
--   item_questions.item_id → items.id         CASCADE
--   item_questions.question_id → questions.id CASCADE
--   exam_sections.exam_id → exam_papers.id    CASCADE
--   exam_paper_questions.exam_id → exam_papers.id     CASCADE
--   exam_paper_questions.section_id → exam_sections.id CASCADE
--   exam_paper_questions.question_id → questions.id   CASCADE
--   question_kp.question_id → questions.id    CASCADE
--   question_kp.kp_id → knowledge_points.id   CASCADE
-- 因此删除 course/module/item/question 时, DB 自动级联清理关联表,
-- 前端无需额外清理 question_kp / item_questions / exam_paper_questions。
-- ============================================================