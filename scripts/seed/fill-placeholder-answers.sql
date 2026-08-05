-- CourseCore 占位答案填充
-- 版本: 001 | 日期: 2026-08-03
-- 用途: exam_questions 表中大量 answer 为空串/NULL，刷题评判无法运行
-- 策略: 先用简单占位值（人类一看就知道是假的），架构完成后再补真答案
-- 在 Supabase Dashboard → SQL Editor 中运行

-- ============================================================
-- 1. 统计当前答案缺失情况
-- ============================================================
SELECT
  question_type,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE answer IS NULL OR answer = '') AS missing
FROM public.exam_questions
GROUP BY question_type
ORDER BY question_type;
-- 预期: 大量 missing，特别是解答题

-- ============================================================
-- 2. 填充占位答案
-- question_type: 0=单选 1=多选 2=填空 3=计算/解答 4=证明 5=判断
-- ============================================================
UPDATE public.exam_questions
SET answer = CASE
  -- 客观题(单选/多选/判断): 占位 '1' (选项A或第1个)
  WHEN question_type IN (0, 1, 5) THEN '1'
  -- 填空题: 占位 '1'
  WHEN question_type = 2 THEN '1'
  -- 计算/解答/证明: 占位文字
  WHEN question_type IN (3, 4) THEN '答案待补充'
  -- 兜底
  ELSE '1'
END
WHERE answer IS NULL OR answer = '';

-- ============================================================
-- 3. 多选题 answers JSONB 占位（如果 answers 为空数组）
-- ============================================================
UPDATE public.exam_questions
SET answers = '["1"]'::jsonb
WHERE question_type = 1
  AND (answers IS NULL OR answers = '[]'::jsonb);

-- ============================================================
-- 4. 验证：确认无空答案
-- ============================================================
SELECT
  question_type,
  COUNT(*) FILTER (WHERE answer IS NULL OR answer = '') AS still_missing
FROM public.exam_questions
GROUP BY question_type
ORDER BY question_type;
-- 预期: 所有 still_missing = 0

-- ============================================================
-- 注意: 这是临时占位，后续需补充真实答案
-- 补答案方式待定（脚本批量提取/AI生成/人工提供原稿）
-- 补充后重新 UPDATE answer 字段即可
-- ============================================================
