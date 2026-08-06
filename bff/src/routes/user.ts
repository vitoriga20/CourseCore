import { Hono } from 'hono';
import type { Bindings } from '../env';
import { SupabaseRest } from '../lib/supabase';
import { verifyAuth, type AuthedContext } from '../middleware/auth';

const user = new Hono<{ Bindings: Bindings }>();

const WRONG_BOOK_FIELDS =
  'id,user_id,question_id,subject_id,curve_type,stage,wrong_count,right_count,streak_correct_count,status,reason,last_wrong_at,last_correct_at,last_reviewed_at,next_review_at,last_answer,created_at,updated_at';

const ANSWER_FIELDS = 'id,user_id,item_id,question_id,answer,is_correct,created_at';
const PROGRESS_FIELDS = 'id,user_id,item_id,status,score,updated_at';

const DAY_MS = 86400000;

function getNextReviewAt(stage: number, curveType: string, baseTime = Date.now()): string {
  const curves: Record<string, number[]> = {
    classic: [1, 2, 4, 7, 15],
    compact: [1, 2, 4],
  };
  const curve = curves[curveType] || curves.classic;
  const idx = Math.max(0, Math.min(stage, curve.length - 1));
  const days = curve[idx];
  return new Date(baseTime + days * DAY_MS).toISOString();
}

function isMastered(stage: number, streak: number, curveType: string): boolean {
  const curves: Record<string, number[]> = { classic: [1, 2, 4, 7, 15], compact: [1, 2, 4] };
  const curve = curves[curveType] || curves.classic;
  return stage >= curve.length || streak >= 2;
}

function jsonError(c: AuthedContext, status: number, code: string, message: string) {
  return c.json({ error: message, code }, status as any);
}

// GET /api/v1/me/wrong-book — 我的错题本
user.get('/wrong-book', verifyAuth, async (c) => {
  try {
    const userId = c.get('user').id;
    const subjectId = c.req.query('subjectId');
    const status = c.req.query('status');

    const sb = new SupabaseRest(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
    const filters: Record<string, [any, any]> = { user_id: ['eq', userId] };
    if (subjectId) filters.subject_id = ['eq', subjectId];
    if (status) filters.status = ['eq', status];

    const includeQuestion = c.req.query('includeQuestion') === 'true';
    const select = includeQuestion
      ? `${WRONG_BOOK_FIELDS},exam_questions(id,question_type,title,content,options,tags)`
      : WRONG_BOOK_FIELDS;

    const { data, total } = await sb.query('wrong_book', {
      select,
      filters,
      order: 'next_review_at.asc',
      limit: 500,
    });

    return c.json({ data: data ?? [], meta: { total } });
  } catch (e: any) {
    return jsonError(c, 502, 'UPSTREAM_ERROR', e?.message || 'supabase query failed');
  }
});

// POST /api/v1/me/wrong-book — 新增/更新错题
user.post('/wrong-book', verifyAuth, async (c) => {
  try {
    const userId = c.get('user').id;
    const body = await c.req.json();
    const { question_id, subject_id, curve_type = 'classic', last_answer } = body;

    if (!question_id) return jsonError(c, 400, 'VALIDATION_ERROR', 'question_id is required');

    const sb = new SupabaseRest(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
    const now = new Date().toISOString();
    const nextReview = getNextReviewAt(0, curve_type);

    const { data: existing } = await sb.query('wrong_book', {
      select: '*',
      filters: { user_id: ['eq', userId], question_id: ['eq', question_id] },
      single: true,
    });

    if (existing) {
      const existingAny = existing as any;
      const { data } = await sb.query('wrong_book', {
        select: WRONG_BOOK_FIELDS,
        filters: { id: ['eq', existingAny.id as string] },
      });
      const current = (data as any[])[0];
      const update = {
        wrong_count: (current?.wrong_count || 0) + 1,
        right_count: 0,
        streak_correct_count: 0,
        stage: 0,
        status: '未掌握',
        last_wrong_at: now,
        last_reviewed_at: now,
        next_review_at: nextReview,
        last_answer: last_answer ?? null,
        updated_at: now,
      };
      const result = await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/wrong_book?id=eq.${existingAny.id}`,
        {
          method: 'PATCH',
          headers: {
            apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify(update),
        },
      );
      const updated = await result.json();
      return c.json({ data: Array.isArray(updated) ? updated[0] : updated });
    }

    const result = await fetch(`${c.env.SUPABASE_URL}/rest/v1/wrong_book`, {
      method: 'POST',
      headers: {
        apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        user_id: userId,
        question_id,
        subject_id: subject_id ?? null,
        curve_type,
        stage: 0,
        wrong_count: 1,
        right_count: 0,
        streak_correct_count: 0,
        status: '未掌握',
        last_wrong_at: now,
        last_reviewed_at: now,
        next_review_at: nextReview,
        last_answer: last_answer ?? null,
      }),
    });
    const created = await result.json();
    return c.json({ data: Array.isArray(created) ? created[0] : created });
  } catch (e: any) {
    return jsonError(c, 502, 'UPSTREAM_ERROR', e?.message || 'supabase query failed');
  }
});

// PATCH /api/v1/me/wrong-book/:id — 更新错题状态（答对推进）
user.patch('/wrong-book/:id', verifyAuth, async (c) => {
  try {
    const userId = c.get('user').id;
    const id = c.req.param('id');
    if (!id) return jsonError(c, 400, 'VALIDATION_ERROR', 'id is required');
    const body = await c.req.json();
    const { is_correct, last_answer, reason } = body;

    const sb = new SupabaseRest(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data: existingRaw } = await sb.query('wrong_book', {
      select: '*',
      filters: { id: ['eq', id], user_id: ['eq', userId] },
      single: true,
    });
    const existing = existingRaw as any;

    if (!existing) return jsonError(c, 404, 'NOT_FOUND', 'wrong_book entry not found');

    const now = new Date().toISOString();

    if (is_correct) {
      const newStreak = (existing.streak_correct_count || 0) + 1;
      const newStage = (existing.stage || 0) + 1;
      const mastered = isMastered(newStage, newStreak, existing.curve_type);
      const update = {
        right_count: (existing.right_count || 0) + 1,
        streak_correct_count: newStreak,
        stage: mastered ? Math.max(newStage, existing.stage || 0) : newStage,
        status: mastered ? '已掌握' : '复习中',
        last_correct_at: now,
        last_reviewed_at: now,
        next_review_at: mastered ? null : getNextReviewAt(newStage, existing.curve_type),
        last_answer: last_answer ?? null,
        updated_at: now,
      };
      const result = await fetch(
        `${c.env.SUPABASE_URL}/rest/v1/wrong_book?id=eq.${id}`,
        {
          method: 'PATCH',
          headers: {
            apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify(update),
        },
      );
      const updated = await result.json();
      return c.json({ data: Array.isArray(updated) ? updated[0] : updated });
    }

    const update = {
      wrong_count: (existing.wrong_count || 0) + 1,
      right_count: 0,
      streak_correct_count: 0,
      stage: 0,
      status: '未掌握',
      reason: reason ?? existing.reason,
      last_wrong_at: now,
      last_reviewed_at: now,
      next_review_at: getNextReviewAt(0, existing.curve_type),
      last_answer: last_answer ?? null,
      updated_at: now,
    };
    const result2 = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/wrong_book?id=eq.${id}`,
      {
        method: 'PATCH',
        headers: {
          apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(update),
      },
    );
    const updated2 = await result2.json();
    return c.json({ data: Array.isArray(updated2) ? updated2[0] : updated2 });
  } catch (e: any) {
    return jsonError(c, 502, 'UPSTREAM_ERROR', e?.message || 'supabase query failed');
  }
});

// DELETE /api/v1/me/wrong-book/:id — 删除错题（用户自己的）
user.delete('/wrong-book/:id', verifyAuth, async (c) => {
  try {
    const userId = c.get('user').id;
    const id = c.req.param('id');
    if (!id) return jsonError(c, 400, 'VALIDATION_ERROR', 'id is required');
    const sb = new SupabaseRest(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data: existingRaw } = await sb.query('wrong_book', {
      select: 'id,user_id',
      filters: { id: ['eq', id], user_id: ['eq', userId] },
      single: true,
    });
    const existing = existingRaw as any;
    if (!existing) return jsonError(c, 404, 'NOT_FOUND', 'entry not found or not owned by user');

    const res = await fetch(`${c.env.SUPABASE_URL}/rest/v1/wrong_book?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    if (!res.ok) return jsonError(c, 502, 'DELETE_FAILED', 'failed to delete');
    return c.json({ ok: true });
  } catch (e: any) {
    return jsonError(c, 502, 'UPSTREAM_ERROR', e?.message || 'supabase query failed');
  }
});

// GET /api/v1/me/practice-records — 练习记录
user.get('/practice-records', verifyAuth, async (c) => {
  try {
    const userId = c.get('user').id;
    const sb = new SupabaseRest(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
    const page = Math.max(1, parseInt(c.req.query('page') || '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(c.req.query('pageSize') || '20', 10) || 20));
    const subjectId = c.req.query('subjectId');
    const filters: Record<string, [any, any]> = { user_id: ['eq', userId] };
    if (subjectId) filters.subject_id = ['eq', subjectId];

    const { data, total } = await sb.query('practice_records', {
      select: '*',
      filters,
      order: 'created_at.desc',
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return c.json({ data: data ?? [], meta: { page, pageSize, total } });
  } catch (e: any) {
    return jsonError(c, 502, 'UPSTREAM_ERROR', e?.message || 'supabase query failed');
  }
});

// POST /api/v1/me/practice-records — 提交练习记录（含答题明细）
user.post('/practice-records', verifyAuth, async (c) => {
  try {
    const userId = c.get('user').id;
    const body = await c.req.json();
    const {
      mode,
      source_id,
      source_name,
      subject_id,
      total,
      answered,
      correct,
      wrong,
      duration_seconds,
      details,
    } = body;

    if (!mode) return jsonError(c, 400, 'VALIDATION_ERROR', 'mode is required');

    const payload = {
      user_id: userId,
      mode,
      source_id: source_id ?? null,
      source_name: source_name ?? null,
      subject_id: subject_id ?? null,
      total: total ?? 0,
      answered: answered ?? 0,
      correct: correct ?? 0,
      wrong: wrong ?? 0,
      duration_seconds: duration_seconds ?? 0,
      details: details ?? null,
      created_at: new Date().toISOString(),
    };

    const res = await fetch(`${c.env.SUPABASE_URL}/rest/v1/practice_records`, {
      method: 'POST',
      headers: {
        apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body2 = await res.text().catch(() => '');
      return jsonError(c, 502, 'UPSTREAM_ERROR', `insert failed: ${body2.slice(0, 300)}`);
    }
    const created = await res.json();
    return c.json({ data: Array.isArray(created) ? created[0] : created });
  } catch (e: any) {
    return jsonError(c, 502, 'UPSTREAM_ERROR', e?.message || 'supabase query failed');
  }
});

// GET /api/v1/me/progress — 用户进度
user.get('/progress', verifyAuth, async (c) => {
  try {
    const userId = c.get('user').id;
    const sb = new SupabaseRest(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);

    const [{ data: answers }, { data: progress }] = await Promise.all([
      sb.query('answers', {
        select: ANSWER_FIELDS,
        filters: { user_id: ['eq', userId] },
        order: 'created_at.desc',
        limit: 5000,
      }),
      sb.query('progress', {
        select: PROGRESS_FIELDS,
        filters: { user_id: ['eq', userId] },
      }),
    ]);

    return c.json({ data: { answers: answers ?? [], progress: progress ?? [] } });
  } catch (e: any) {
    return jsonError(c, 502, 'UPSTREAM_ERROR', e?.message || 'supabase query failed');
  }
});

// POST /api/v1/me/progress — 写入答题记录 + 进度
user.post('/progress', verifyAuth, async (c) => {
  try {
    const userId = c.get('user').id;
    const body = await c.req.json();
    const { answer_records = [], progress_updates = [] } = body;

    if (answer_records.length > 0) {
      const mapped = answer_records.map((r: any) => ({
        user_id: userId,
        item_id: r.item_id ?? null,
        question_id: r.question_id,
        answer: r.answer ?? null,
        is_correct: r.is_correct,
      }));
      await fetch(`${c.env.SUPABASE_URL}/rest/v1/answers`, {
        method: 'POST',
        headers: {
          apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mapped),
      });
    }

    if (progress_updates.length > 0) {
      const mapped = progress_updates.map((p: any) => ({
        user_id: userId,
        item_id: p.item_id,
        status: p.status,
        score: p.score ?? null,
        updated_at: new Date().toISOString(),
      }));
      await fetch(`${c.env.SUPABASE_URL}/rest/v1/progress?on_conflict=user_id,item_id`, {
        method: 'POST',
        headers: {
          apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify(mapped),
      });
    }

    return c.json({ ok: true, inserted_answers: answer_records.length, upserted_progress: progress_updates.length });
  } catch (e: any) {
    return jsonError(c, 502, 'UPSTREAM_ERROR', e?.message || 'supabase query failed');
  }
});

export { user };