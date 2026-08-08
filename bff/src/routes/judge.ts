import { Hono } from 'hono';
import type { Bindings } from '../env';
import { SupabaseRest } from '../lib/supabase';
import { parseWrongReasons } from '../lib/wrong-reasons';
import { verifyAuth, type AuthedContext } from '../middleware/auth';

const judge = new Hono<{ Bindings: Bindings }>();

function jsonError(c: AuthedContext, status: number, code: string, message: string) {
  return c.json({ error: message, code }, status as any);
}

// POST /api/v1/questions/:id/judge — 判分接口（gated）
// 提交用户答案 → 服务端判分 → 写答题记录 + 错题本 → 返回 is_correct + answer + solution
judge.post('/questions/:id/judge', verifyAuth, async (c) => {
  try {
    const userId = c.get('user').id;
    const questionId = c.req.param('id');
    if (!questionId) return jsonError(c, 400, 'VALIDATION_ERROR', 'question id is required');
    const body = await c.req.json();
    const { user_answer, subject_id, curve_type = 'classic', reasons } = body;

    if (!user_answer) return jsonError(c, 400, 'VALIDATION_ERROR', 'user_answer is required');

    const sb = new SupabaseRest(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data: question } = await sb.query('questions', {
      select: 'id,question_type,answer,answers,blanks,tolerance,unit,solution,content,options',
      filters: { id: ['eq', questionId] },
      single: true,
    });
    if (!question) return jsonError(c, 404, 'QUESTION_NOT_FOUND', 'question not found');

    const q = question as any;
    const userAns = user_answer;
    let isCorrect = false;

    switch (q.question_type) {
      case 0: // 单选
      case 1: // 多选
        isCorrect = String(userAns).trim().toLowerCase() === String(q.answer).trim().toLowerCase();
        break;
      case 2: { // 填空
        const blanks = q.blanks || 1;
        const tol = q.tolerance ?? 0;
        const answers = q.answers || [];
        if (Array.isArray(userAns)) {
          isCorrect = userAns.length === blanks && userAns.every((ua: string, i: number) => {
            const expected = answers[i] ?? q.answer;
            const uaNum = parseFloat(ua);
            const expNum = parseFloat(expected);
            if (!isNaN(uaNum) && !isNaN(expNum)) {
              return Math.abs(uaNum - expNum) <= (tol || 0);
            }
            return String(ua).trim() === String(expected).trim();
          });
        } else {
          isCorrect = String(userAns).trim() === String(q.answer).trim();
        }
        break;
      }
      case 3: { // 解答/计算
        isCorrect = String(userAns).trim() === String(q.answer).trim();
        break;
      }
      case 4:
        isCorrect = String(userAns).trim() === String(q.answer).trim();
        break;
      default:
        isCorrect = String(userAns).trim() === String(q.answer).trim();
    }

    const parsedReasons = parseWrongReasons(reasons, !isCorrect);
    if (!parsedReasons) return jsonError(c, 400, 'VALIDATION_ERROR', 'invalid wrong reasons');

    // 写答题记录
    await fetch(`${c.env.SUPABASE_URL}/rest/v1/answers`, {
      method: 'POST',
      headers: {
        apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        question_id: questionId,
        answer: userAns,
        is_correct: isCorrect,
        created_at: new Date().toISOString(),
      }),
    });

    // 错题本更新
    const existingWb = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/wrong_book?user_id=eq.${userId}&question_id=eq.${questionId}`,
      {
        headers: {
          apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      },
    );
    const wbData = await existingWb.json();
    const wbEntry = Array.isArray(wbData) ? wbData[0] : null;

    const DAY_MS = 86400000;
    const curves: Record<string, number[]> = { classic: [1, 2, 4, 7, 15], compact: [1, 2, 4] };
    const curve = curves[curve_type] || curves.classic;

    if (wbEntry) {
      if (isCorrect) {
        const newStreak = (wbEntry.streak_correct_count || 0) + 1;
        const newStage = (wbEntry.stage || 0) + 1;
        const mastered = newStage >= curve.length || newStreak >= 2;
        const days = mastered ? 0 : curve[Math.max(0, Math.min(newStage, curve.length - 1))];
        const update = {
          right_count: (wbEntry.right_count || 0) + 1,
          streak_correct_count: newStreak,
          stage: mastered ? Math.max(newStage, wbEntry.stage || 0) : newStage,
          status: mastered ? '已掌握' : '复习中',
          last_correct_at: new Date().toISOString(),
          last_reviewed_at: new Date().toISOString(),
          next_review_at: mastered ? null : new Date(Date.now() + days * DAY_MS).toISOString(),
          last_answer: userAns,
          updated_at: new Date().toISOString(),
        };
        await fetch(`${c.env.SUPABASE_URL}/rest/v1/wrong_book?id=eq.${wbEntry.id}`, {
          method: 'PATCH',
          headers: {
            apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(update),
        });
      } else {
        const days = curve[0];
        const update = {
          wrong_count: (wbEntry.wrong_count || 0) + 1,
          right_count: 0,
          streak_correct_count: 0,
          stage: 0,
          status: '未掌握',
          reasons: parsedReasons,
          last_wrong_at: new Date().toISOString(),
          last_reviewed_at: new Date().toISOString(),
          next_review_at: new Date(Date.now() + days * DAY_MS).toISOString(),
          last_answer: userAns,
          updated_at: new Date().toISOString(),
        };
        await fetch(`${c.env.SUPABASE_URL}/rest/v1/wrong_book?id=eq.${wbEntry.id}`, {
          method: 'PATCH',
          headers: {
            apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(update),
        });
      }
    } else if (!isCorrect) {
      const days = curve[0];
      await fetch(`${c.env.SUPABASE_URL}/rest/v1/wrong_book`, {
        method: 'POST',
        headers: {
          apikey: c.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${c.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          question_id: questionId,
          subject_id: subject_id ?? null,
          curve_type,
          stage: 0,
          wrong_count: 1,
          right_count: 0,
          streak_correct_count: 0,
          status: '未掌握',
          reasons: parsedReasons,
          last_wrong_at: new Date().toISOString(),
          last_reviewed_at: new Date().toISOString(),
          next_review_at: new Date(Date.now() + days * DAY_MS).toISOString(),
          last_answer: userAns,
        }),
      });
    }

    // v2: questions 无 answer_reveal 列，统一按 'after_submit' 揭示
    const shouldReveal = true;

    return c.json({
      data: {
        question_id: questionId,
        is_correct: isCorrect,
        user_answer: userAns,
        answer: shouldReveal ? q.answer : null,
        answers: shouldReveal ? q.answers : null,
        solution: shouldReveal ? q.solution : null,
        tolerance: shouldReveal ? q.tolerance : null,
        unit: shouldReveal ? q.unit : null,
      },
    });
  } catch (e: any) {
    return jsonError(c, 502, 'UPSTREAM_ERROR', e?.message || 'judge failed');
  }
});

// POST /api/v1/questions/:id/reveal — 答案揭示接口（Phase 2 实现）
// 需要已登录且已提交过答案（从 wrong_book 或 answers 判断）
judge.post('/questions/:id/reveal', verifyAuth, async (c) => {
  try {
    const userId = c.get('user').id;
    const questionId = c.req.param('id');
    if (!questionId) return jsonError(c, 400, 'VALIDATION_ERROR', 'question id is required');
    const sb = new SupabaseRest(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data: question } = await sb.query('questions', {
      select: 'id,answer,answers,blanks,tolerance,unit,solution',
      filters: { id: ['eq', questionId] },
      single: true,
    });
    if (!question) return jsonError(c, 404, 'QUESTION_NOT_FOUND', 'question not found');

    const q = question as any;
    // v2: questions 无 answer_reveal 列，统一按 'after_submit' 揭示
    // after_submit: 检查用户是否提交过
    const { data: attempts } = await sb.query('answers', {
      select: 'id',
      filters: { user_id: ['eq', userId], question_id: ['eq', questionId] },
      limit: 1,
    });

    if (attempts && (attempts as any[]).length > 0) {
      return c.json({
        data: {
          answer: q.answer,
          answers: q.answers,
          solution: q.solution,
          tolerance: q.tolerance,
          unit: q.unit,
        },
      });
    }

    return jsonError(c, 403, 'REVEAL_NOT_AUTHORIZED', 'submit an answer first to reveal');
  } catch (e: any) {
    return jsonError(c, 502, 'UPSTREAM_ERROR', e?.message || 'reveal failed');
  }
});

export { judge };
