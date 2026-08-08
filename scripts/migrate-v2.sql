-- ============================================================
-- CourseCore 旧库(v1) → 统一题库(v2) 数据迁移脚本
-- 在 Supabase Dashboard → SQL Editor 中对【已存在旧数据】的库执行
--
-- 前置: 旧库含 theory_contents / exam_questions / questions(item_id..) / question_kp(source..)
-- 产出: 统一 questions 表 + item_questions / exam_paper_questions 关联表 + 真实外键
-- 全新部署请直接跑 scripts/schema-v2.sql, 勿跑本脚本
-- ============================================================

BEGIN;

-- 0. items 补 content 列 (v1 items 无该列, 理论正文并入)
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS content TEXT;

-- ========== 1. 关联表 (旧库没有, 先建; 结构同 schema-v2) ==========
CREATE TABLE IF NOT EXISTS public.item_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id TEXT NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'practice' CHECK (role IN ('practice', 'theory_example')),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (item_id, question_id, role)
);

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

-- ========== 2. 理论正文并入 items.content ==========
UPDATE public.items i
SET content = tc.content
FROM public.theory_contents tc
WHERE tc.item_id = i.id
  AND (i.content IS NULL OR i.content = '');

-- ========== 3. 理论例题 → questions 真实行 + item_questions(theory_example) ==========
-- examples 数组元素分两种:
--   * jsonb object {text,options,answer,solution,image} → 落 questions 真实行 (id = {itemId}-ex{idx})
--   * jsonb string (训练题 id) → 已存在于 questions, 仅建关联
DO $$
DECLARE
  tc RECORD;
  elem jsonb;
  idx INT;
  qid TEXT;
BEGIN
  FOR tc IN
    SELECT item_id, examples
    FROM public.theory_contents
    WHERE examples IS NOT NULL AND jsonb_typeof(examples) = 'array'
  LOOP
    idx := 0;
    qid := NULL;
    FOR elem IN SELECT * FROM jsonb_array_elements(tc.examples) LOOP
      IF jsonb_typeof(elem) = 'object' THEN
        qid := tc.item_id || '-ex' || idx;
        INSERT INTO public.questions
          (id, question_type, title, content, options, answer, solution, image, difficulty, tags, source)
        VALUES
          (qid, 0, '例题 ' || (idx + 1),
           COALESCE(elem->>'text', ''),
           COALESCE(elem->'options', '[]'::jsonb),
           COALESCE(elem->>'answer', '0'),
           COALESCE(elem->>'solution', ''),
           COALESCE(elem->>'image', ''),
           1, '[]'::jsonb, NULL)
        ON CONFLICT (id) DO NOTHING;
      ELSIF jsonb_typeof(elem) = 'string' THEN
        qid := elem #>> '{}';
      END IF;

      IF qid IS NOT NULL THEN
        INSERT INTO public.item_questions (item_id, question_id, role, order_index)
        VALUES (tc.item_id, qid, 'theory_example', idx)
        ON CONFLICT (item_id, question_id, role) DO NOTHING;
      END IF;

      idx := idx + 1;
      qid := NULL;
    END LOOP;
  END LOOP;
END $$;

-- ========== 4. 试卷题 → questions + exam_paper_questions ==========
INSERT INTO public.questions
  (id, question_type, title, content, options, answer, answers, blanks, tolerance, unit,
   solution, hint, test_string, image, difficulty, tags, source)
SELECT id, question_type, title, content, options, answer, answers, blanks, tolerance, unit,
       solution, hint, test_string, image, difficulty, tags, source
FROM public.exam_questions
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exam_paper_questions (exam_id, section_id, question_id, score, order_index)
SELECT exam_id, section_id, id, score, COALESCE(order_index, 0)
FROM public.exam_questions
ON CONFLICT (exam_id, question_id) DO NOTHING;

-- ========== 5. questions 去冗余列: 先建 practice 关联, 再删列 ==========
INSERT INTO public.item_questions (item_id, question_id, role, order_index)
SELECT item_id, id, 'practice', row_number() OVER (PARTITION BY item_id ORDER BY id)
FROM public.questions
WHERE item_id IS NOT NULL
ON CONFLICT (item_id, question_id, role) DO NOTHING;

ALTER TABLE public.questions DROP COLUMN IF EXISTS item_id;
ALTER TABLE public.questions DROP COLUMN IF EXISTS course_id;
ALTER TABLE public.questions DROP COLUMN IF EXISTS module_id;

-- ========== 6. question_kp 去 source, 重建为单一 FK ==========
CREATE TABLE public._question_kp_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  kp_id UUID NOT NULL REFERENCES public.knowledge_points(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('primary','secondary')),
  weight NUMERIC DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (question_id, kp_id)
);

-- platform 优先, exam 冲突则跳过 (实际两套 id 前缀不同, 冲突罕见)
INSERT INTO public._question_kp_v2 (question_id, kp_id, role, weight, created_at)
SELECT question_id, kp_id, role, weight, created_at
FROM public.question_kp
WHERE source = 'platform'
ON CONFLICT (question_id, kp_id) DO NOTHING;

INSERT INTO public._question_kp_v2 (question_id, kp_id, role, weight, created_at)
SELECT question_id, kp_id, role, weight, created_at
FROM public.question_kp
WHERE source = 'exam'
ON CONFLICT (question_id, kp_id) DO NOTHING;

DROP TABLE public.question_kp;
ALTER TABLE public._question_kp_v2 RENAME TO question_kp;

CREATE UNIQUE INDEX IF NOT EXISTS UQ_question_kp_primary_once
  ON public.question_kp (question_id) WHERE role = 'primary';
CREATE INDEX IF NOT EXISTS idx_qk_question ON public.question_kp(question_id);
CREATE INDEX IF NOT EXISTS idx_qk_kp ON public.question_kp(kp_id);

-- ========== 7. 清洗悬空 id 后补真实外键 ==========
DELETE FROM public.answers a
WHERE NOT EXISTS (SELECT 1 FROM public.questions q WHERE q.id = a.question_id)
   OR NOT EXISTS (SELECT 1 FROM public.items i WHERE i.id = a.item_id);

DELETE FROM public.progress p
WHERE NOT EXISTS (SELECT 1 FROM public.items i WHERE i.id = p.item_id);

ALTER TABLE public.answers ADD CONSTRAINT fk_answers_item
  FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;
ALTER TABLE public.answers ADD CONSTRAINT fk_answers_question
  FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;
ALTER TABLE public.progress ADD CONSTRAINT fk_progress_item
  FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;

-- ========== 8. 删除旧表 ==========
DROP TABLE IF EXISTS public.theory_contents;
DROP TABLE IF EXISTS public.exam_questions;

-- ========== 9. 新表 / 重建表 RLS 与策略 ==========
ALTER TABLE public.item_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_paper_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_kp ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "item_questions_readable_by_everyone" ON public.item_questions;
CREATE POLICY "item_questions_readable_by_everyone"
  ON public.item_questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_can_manage_item_questions" ON public.item_questions;
CREATE POLICY "admin_can_manage_item_questions"
  ON public.item_questions FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "exam_paper_questions_readable_by_everyone" ON public.exam_paper_questions;
CREATE POLICY "exam_paper_questions_readable_by_everyone"
  ON public.exam_paper_questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_can_manage_exam_paper_questions" ON public.exam_paper_questions;
CREATE POLICY "admin_can_manage_exam_paper_questions"
  ON public.exam_paper_questions FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "question_kp_readable_by_everyone" ON public.question_kp;
CREATE POLICY "question_kp_readable_by_everyone"
  ON public.question_kp FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_can_manage_question_kp" ON public.question_kp;
CREATE POLICY "admin_can_manage_question_kp"
  ON public.question_kp FOR ALL USING (public.is_admin());

-- ========== 10. 新表索引 ==========
CREATE INDEX IF NOT EXISTS idx_item_questions_item ON public.item_questions(item_id);
CREATE INDEX IF NOT EXISTS idx_item_questions_question ON public.item_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_exam_paper_questions_exam ON public.exam_paper_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_paper_questions_section ON public.exam_paper_questions(section_id);
CREATE INDEX IF NOT EXISTS idx_exam_paper_questions_question ON public.exam_paper_questions(question_id);

COMMIT;