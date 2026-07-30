-- CourseCore Supabase 数据库初始化
-- 在 Supabase Dashboard → SQL Editor → New query 中粘贴并运行

-- 1. 用户扩展资料表
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role TEXT DEFAULT 'free' CHECK (role IN ('free', 'paid', 'admin')),
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

-- 7. 可选：创建索引加速查询
CREATE INDEX IF NOT EXISTS idx_answers_user_item
  ON public.answers (user_id, item_id);

CREATE INDEX IF NOT EXISTS idx_answers_question
  ON public.answers (user_id, question_id);

CREATE INDEX IF NOT EXISTS idx_progress_user
  ON public.progress (user_id);

-- 8. 课程内容表
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

CREATE TABLE IF NOT EXISTS public.questions (
  id TEXT PRIMARY KEY,
  item_id TEXT REFERENCES public.items(id) ON DELETE CASCADE,
  course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id TEXT,
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

CREATE TABLE IF NOT EXISTS public.theory_contents (
  item_id TEXT PRIMARY KEY REFERENCES public.items(id) ON DELETE CASCADE,
  course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id TEXT,
  content TEXT NOT NULL DEFAULT '',
  examples JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS public.exam_papers (
  id TEXT PRIMARY KEY,
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

CREATE TABLE IF NOT EXISTS public.exam_questions (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL REFERENCES public.exam_papers(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL REFERENCES public.exam_sections(id) ON DELETE CASCADE,
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
  order_index INTEGER DEFAULT 0
);

-- 9. 启用 RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theory_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;

-- 10. admin 辅助函数
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. RLS 策略：内容表公开可读，admin 可写
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

DROP POLICY IF EXISTS "theory_contents_readable_by_everyone" ON public.theory_contents;
CREATE POLICY "theory_contents_readable_by_everyone"
  ON public.theory_contents FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "exam_papers_readable_by_everyone" ON public.exam_papers;
CREATE POLICY "exam_papers_readable_by_everyone"
  ON public.exam_papers FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "exam_sections_readable_by_everyone" ON public.exam_sections;
CREATE POLICY "exam_sections_readable_by_everyone"
  ON public.exam_sections FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "exam_questions_readable_by_everyone" ON public.exam_questions;
CREATE POLICY "exam_questions_readable_by_everyone"
  ON public.exam_questions FOR SELECT
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

DROP POLICY IF EXISTS "admin_can_manage_theory_contents" ON public.theory_contents;
CREATE POLICY "admin_can_manage_theory_contents"
  ON public.theory_contents FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin_can_manage_exam_papers" ON public.exam_papers;
CREATE POLICY "admin_can_manage_exam_papers"
  ON public.exam_papers FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin_can_manage_exam_sections" ON public.exam_sections;
CREATE POLICY "admin_can_manage_exam_sections"
  ON public.exam_sections FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin_can_manage_exam_questions" ON public.exam_questions;
CREATE POLICY "admin_can_manage_exam_questions"
  ON public.exam_questions FOR ALL
  USING (public.is_admin());

-- 12. 索引
CREATE INDEX IF NOT EXISTS idx_items_course_module
  ON public.items(course_id, module_id);

CREATE INDEX IF NOT EXISTS idx_questions_item
  ON public.questions(item_id);

CREATE INDEX IF NOT EXISTS idx_questions_course_module
  ON public.questions(course_id, module_id);

CREATE INDEX IF NOT EXISTS idx_exam_sections_exam
  ON public.exam_sections(exam_id);

CREATE INDEX IF NOT EXISTS idx_exam_questions_section
  ON public.exam_questions(section_id);

CREATE INDEX IF NOT EXISTS idx_exam_questions_exam
  ON public.exam_questions(exam_id);
