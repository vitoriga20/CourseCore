-- 错题薄弱点由单选升级为多选；保留 reason 兼容旧客户端和历史数据。
ALTER TABLE public.wrong_book
  ADD COLUMN IF NOT EXISTS reasons TEXT[] NOT NULL DEFAULT '{}'::TEXT[];

UPDATE public.wrong_book
SET reasons = CASE reason
  WHEN '概念不清' THEN ARRAY['概念 / 定义没掌握']::TEXT[]
  WHEN '计算失误' THEN ARRAY['计算过程出错']::TEXT[]
  WHEN '审题错误' THEN ARRAY['审题遗漏条件']::TEXT[]
  WHEN '方法不熟' THEN ARRAY['解题方法不会']::TEXT[]
  ELSE reasons
END
WHERE cardinality(reasons) = 0
  AND reason IN ('概念不清', '计算失误', '审题错误', '方法不熟');

ALTER TABLE public.wrong_book
  DROP CONSTRAINT IF EXISTS wrong_book_reasons_allowed;

ALTER TABLE public.wrong_book
  ADD CONSTRAINT wrong_book_reasons_allowed
  CHECK (reasons <@ ARRAY[
    '概念 / 定义没掌握',
    '公式 / 定理记不住',
    '解题方法不会',
    '题型不熟',
    '计算过程出错',
    '审题遗漏条件'
  ]::TEXT[]);
