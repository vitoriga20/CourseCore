import { Hono } from 'hono';
import type { Bindings } from '../env';
import { SupabaseRest } from '../lib/supabase';

const content = new Hono<{ Bindings: Bindings }>();

// ---- 字段投影：默认绝不返回 answer / answers / solution / test_string ----
// 答案/解析只在 Phase 2 的「判分 / 已发布解析」gated 接口中按需返回。
// 过渡期（Phase 1 前端切换 C）：前端刷题仍需客户端判分，可带 `?includeAnswer=true`
// 显式请求答案列；Phase 2 把判分与服务端化后，此参数随前端判分移除一并删掉。
const PAPER_FIELDS = 'id,school,college,subject,term,duration,created_at,updated_at';
const SECTION_FIELDS = 'id,exam_id,title,order_index';
const QUESTION_BASE =
  'id,exam_id,section_id,question_type,title,content,options,hint,image,difficulty,tags,source,order_index,answer_reveal';
const QUESTION_ANSWERS = 'answer,answers,blanks,tolerance,unit,solution,test_string';

function questionFields(includeAnswer: boolean): string {
  return includeAnswer ? `${QUESTION_BASE},${QUESTION_ANSWERS}` : QUESTION_BASE;
}

function jsonError(c: any, status: number, code: string, message: string) {
  return c.json({ error: message, code }, status);
}

function parsePageParams(c: any) {
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(c.req.query('pageSize') || '20', 10) || 20));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

// GET /api/v1/papers —— 试卷列表（分页 + 过滤）
content.get('/papers', async (c) => {
  try {
    const sb = new SupabaseRest(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
    const { page, pageSize, offset } = parsePageParams(c);

    // 说明：exam_papers 表无 is_active 列（schema 核查确认），列表不过滤激活态
    const filters: Record<string, [any, any]> = {};
    const subject = c.req.query('subject');
    const school = c.req.query('school');
    const term = c.req.query('term');
    if (subject) filters.subject = ['eq', subject];
    if (school) filters.school = ['eq', school];
    if (term) filters.term = ['eq', term];

    // 过渡期：`includeQuestions=true` 时在 sections 内联题目，`includeAnswer=true` 时带答案列
    const includeQuestions = c.req.query('includeQuestions') === 'true';
    const includeAnswer = c.req.query('includeAnswer') === 'true';
    const secFields = includeQuestions
      ? `${SECTION_FIELDS},exam_questions(${questionFields(includeAnswer)})`
      : SECTION_FIELDS;

    const { data, total } = await sb.query('exam_papers', {
      select: `${PAPER_FIELDS},sections:exam_sections(${secFields})`,
      filters,
      order: 'created_at.desc',
      limit: pageSize,
      offset,
    });

    return c.json({
      data: data ?? [],
      meta: { page, pageSize, total: total ?? (data as unknown[])?.length ?? 0 },
    });
  } catch (e: any) {
    return jsonError(c, 502, 'UPSTREAM_ERROR', `[DBG] ${e?.message} || ${e?.stack?.slice(0, 500)}`);
  }
});

// GET /api/v1/papers/:id —— 试卷详情（含 section + 题目，无答案）
content.get('/papers/:id', async (c) => {
  try {
    const sb = new SupabaseRest(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
    const id = c.req.param('id');
    const includeAnswer = c.req.query('includeAnswer') === 'true';

    const { data } = await sb.query('exam_papers', {
      select: `${PAPER_FIELDS},sections:exam_sections(${SECTION_FIELDS},exam_questions(${questionFields(includeAnswer)}))`,
      filters: { id: ['eq', id] },
      single: true,
    });

    if (!data) return jsonError(c, 404, 'PAPER_NOT_FOUND', 'paper not found');
    return c.json({ data });
  } catch (e: any) {
    return jsonError(c, 502, 'UPSTREAM_ERROR', e?.message || 'supabase query failed');
  }
});

// GET /api/v1/papers/:id/questions —— 试卷题目分页（无答案）
content.get('/papers/:id/questions', async (c) => {
  try {
    const sb = new SupabaseRest(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
    const paperId = c.req.param('id');
    const { page, pageSize, offset } = parsePageParams(c);

    const filters: Record<string, [any, any]> = { exam_id: ['eq', paperId] };
    const sectionId = c.req.query('sectionId');
    const type = c.req.query('type'); // question_type
    if (sectionId) filters.section_id = ['eq', sectionId];
    if (type) filters.question_type = ['eq', type];

    const includeAnswer = c.req.query('includeAnswer') === 'true';
    const { data, total } = await sb.query('exam_questions', {
      select: questionFields(includeAnswer),
      filters,
      order: 'order_index.asc',
      limit: pageSize,
      offset,
    });

    return c.json({
      data: data ?? [],
      meta: { page, pageSize, total: total ?? (data as unknown[])?.length ?? 0 },
    });
  } catch (e: any) {
    return jsonError(c, 502, 'UPSTREAM_ERROR', e?.message || 'supabase query failed');
  }
});

// GET /api/v1/questions/:id —— 单题（无答案）
content.get('/questions/:id', async (c) => {
  try {
    const sb = new SupabaseRest(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
    const id = c.req.param('id');
    const includeAnswer = c.req.query('includeAnswer') === 'true';

    const { data } = await sb.query('exam_questions', {
      select: questionFields(includeAnswer),
      filters: { id: ['eq', id] },
      single: true,
    });

    if (!data) return jsonError(c, 404, 'QUESTION_NOT_FOUND', 'question not found');
    return c.json({ data });
  } catch (e: any) {
    return jsonError(c, 502, 'UPSTREAM_ERROR', e?.message || 'supabase query failed');
  }
});

// 答案/解析揭示由 judge 路由统一处理，避免同一路径存在多个实现。
export { content };
