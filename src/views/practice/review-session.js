// Screen 5: 错题复盘会话
// 复用 quizSession 适配层渲染答题界面
// 固定交互: 自动评判 + 解析点击展开（不受 answer_reveal 影响）
// 提交后调用 review-engine.processAnswer 更新错题本 + savePracticeRecord

import { startPracticeSession, renderQuizAdapter, initQuizAdapter, savePracticeRecord } from './quiz-adapter.js';
import { getReviewQueue, processAnswer } from '../../services/review-engine.js';
import { state } from '../../state.js';
import { mountWrongReasonSummary } from './wrong-reason-summary.js';

export function renderReviewSession() {
  return `
    <section class="max-w-4xl mx-auto px-4 pt-8 pb-16" style="min-height: 70vh;">
      <div class="mb-4">
        <a href="/kb" class="text-sm" style="color: var(--practice-muted);">← 返回错题库</a>
      </div>
      <div id="review-container">
        <div class="card text-center py-12" style="background: var(--practice-card); border-color: var(--practice-border);">
          <div class="flex justify-center mb-3" style="opacity: 0.3; color: var(--practice-muted);"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></div>
          <p class="text-sm" style="color: var(--practice-muted);">加载复盘题目中...</p>
        </div>
      </div>
    </section>
  `;
}

export async function initReviewSession() {
  const userId = state.user?.id;
  const container = document.getElementById('review-container');
  if (!container) return;

  // 未登录
  if (!userId) {
    container.innerHTML = `
      <div class="card text-center py-12" style="background: var(--practice-card); border-color: var(--practice-border);">
        <div class="flex justify-center mb-3" style="opacity: 0.3; color: var(--practice-muted);"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></div>
        <p class="text-sm font-semibold mb-1" style="color: var(--practice-text);">请登录后开始复盘</p>
        <p class="text-xs" style="color: var(--practice-muted);">登录后可查看错题并开始复习</p>
      </div>
    `;
    return;
  }

  try {
    // 优先用 sessionStorage 传入的选中错题，否则复习完整的未掌握错题队列
    let entries;
    const selectedIds = JSON.parse(sessionStorage.getItem('review-selected') || '[]');
    if (selectedIds.length > 0) {
      const all = await getReviewQueue(userId);
      entries = all.filter(e => selectedIds.includes(e.id));
      sessionStorage.removeItem('review-selected'); // 用完清除
    } else {
      entries = await getReviewQueue(userId);
    }

    // 无错题
    if (!entries || entries.length === 0) {
      container.innerHTML = `
        <div class="card text-center py-12" style="background: var(--practice-card); border-color: var(--practice-border);">
          <div class="text-4xl mb-3">🎉</div>
          <p class="text-sm font-semibold mb-1" style="color: var(--practice-text);">还没有待复习错题</p>
          <p class="text-xs" style="color: var(--practice-muted);">先去刷题建立你的复习计划</p>
          <a href="/practice/exams" class="btn-pill inline-block mt-4" style="background: var(--practice-accent); color: #fff; padding: 0.5rem 1.5rem;">去刷题</a>
        </div>
      `;
      return;
    }

    // 启动刷题会话
    const session = await startPracticeSession({ wrongEntries: entries });

    // 渲染答题容器
    container.innerHTML = `
      <div class="mb-4">
        <h1 class="text-2xl font-extrabold" style="color: var(--practice-text);">今日复习</h1>
        <p class="text-sm mt-1" style="color: var(--practice-muted);">${entries.length} 题 · 自动评判 · 解析点击「查看答案」展开</p>
      </div>
      ${renderQuizAdapter(session.virtualId)}
    `;

    // 初始化 quizSession（注入外部题目列表）
    const quizState = initQuizAdapter(session.virtualId, session.questions);
    if (quizState) {
      quizState.startTime = Date.now();
      const persistFinishedSession = async (s, selections) => {
        for (const q of s.allQuestions) {
          const result = s.results[q.id];
          if (!result || result.manual) continue;
          const isCorrect = result.passed === true;
          const userAnswer = s.userAnswers[q.id];
          const reasons = isCorrect ? [] : (selections[q.id] || []);
          await processAnswer(userId, q.id, session.subjectId, isCorrect, userAnswer, 'classic', reasons);
        }
        await savePracticeRecord({
          userId,
          mode: 'wrong_review',
          sourceId: 'wrong',
          sourceName: session.title,
          subjectId: session.subjectId,
          state: s,
        });

        const finishMsg = document.createElement('div');
        finishMsg.className = 'card mt-4 text-center';
        finishMsg.style.cssText = 'background: var(--practice-card); border-color: var(--practice-accent); padding: 1rem;';
        finishMsg.innerHTML = `
          <p class="text-sm font-semibold" style="color: var(--practice-accent);">✓ 复盘完成，错题本已更新</p>
          <a href="/kb" class="text-xs mt-2 inline-block" style="color: var(--practice-muted);">返回错题库查看更新</a>
        `;
        container.appendChild(finishMsg);
      };

      quizState.onFinish = async (s) => {
        const wrongQuestions = s.allQuestions.filter((q) => {
          const result = s.results[q.id];
          return result && !result.passed && !result.manual;
        });
        if (wrongQuestions.length === 0) {
          await persistFinishedSession(s, {});
          return;
        }
        mountWrongReasonSummary(container, wrongQuestions, async (selections) => {
          await persistFinishedSession(s, selections);
        });
      };
    }
  } catch (e) {
    console.warn('[review-session] 初始化失败:', e);
    container.innerHTML = `
      <div class="card text-center py-12" style="background: var(--practice-card); border-color: var(--practice-border);">
        <div class="flex justify-center mb-3" style="opacity: 0.3; color: var(--practice-muted);"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div>
        <p class="text-sm" style="color: var(--practice-muted);">复盘加载失败: ${e.message || '未知错误'}</p>
      </div>
    `;
  }
}
