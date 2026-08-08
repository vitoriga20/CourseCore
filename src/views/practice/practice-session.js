// 刷题会话（按试卷/按题型进入答题）
// 复用 quizSession 适配层 + review-engine
// 提交后调 processAnswer 更新错题本 + savePracticeRecord

import { startPracticeSession, renderQuizAdapter, initQuizAdapter, savePracticeRecord } from './quiz-adapter.js';
import { processAnswer } from '../../services/review-engine.js';
import { state, setLastSession } from '../../state.js';
import { mountWrongReasonSummary } from './wrong-reason-summary.js';

export function renderPracticeSession() {
  return `
    <section class="max-w-4xl mx-auto px-4 pt-8 pb-16" style="min-height: 70vh;">
      <div class="mb-4">
        <a href="/practice/exams" class="text-sm" style="color: var(--practice-muted);">← 返回刷题中心</a>
      </div>
      <div id="practice-session-container">
        <div class="card text-center py-12" style="background: var(--practice-card); border-color: var(--practice-border);">
          <div class="flex justify-center mb-3" style="opacity: 0.3; color: var(--practice-muted);"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></div>
          <p class="text-sm" style="color: var(--practice-muted);">加载题目中...</p>
        </div>
      </div>
    </section>
  `;
}

export async function initPracticeSession() {
  const userId = state.user?.id;
  const container = document.getElementById('practice-session-container');
  if (!container) return;

  // 读 sessionStorage 获取入参
  const raw = sessionStorage.getItem('practice-session');
  if (!raw) {
    container.innerHTML = `
      <div class="card text-center py-12" style="background: var(--practice-card); border-color: var(--practice-border);">
        <div class="flex justify-center mb-3" style="opacity: 0.3; color: var(--practice-muted);"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div>
        <p class="text-sm font-semibold mb-1" style="color: var(--practice-text);">未指定刷题来源</p>
        <a href="/practice/exams" class="btn-pill inline-block mt-4" style="background: var(--practice-accent); color: #fff; padding: 0.5rem 1.5rem;">去刷题中心</a>
      </div>
    `;
    return;
  }
  sessionStorage.removeItem('practice-session');
  const params = JSON.parse(raw);

  try {
    console.log('### practice-session start', params);
    const session = await startPracticeSession(params);
    console.log('### practice-session got', session.title, session.questions?.length);

    if (!session.questions || session.questions.length === 0) {
      container.innerHTML = `
        <div class="card text-center py-12" style="background: var(--practice-card); border-color: var(--practice-border);">
          <div class="flex justify-center mb-3" style="opacity: 0.3; color: var(--practice-muted);"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg></div>
          <p class="text-sm font-semibold mb-1" style="color: var(--practice-text);">该来源暂无题目</p>
          <a href="/practice/exams" class="btn-pill inline-block mt-4" style="background: var(--practice-accent); color: #fff; padding: 0.5rem 1.5rem;">换一套试卷</a>
        </div>
      `;
      return;
    }

    // 渲染答题容器
    container.innerHTML = `
      <div class="mb-4">
        <h1 class="text-2xl font-extrabold" style="color: var(--practice-text);">${session.title}</h1>
        <p class="text-sm mt-1" style="color: var(--practice-muted);">${session.questions.length} 题 · 提交后出成绩 + 错题自动收录</p>
      </div>
      ${renderQuizAdapter(session.virtualId)}
    `;

    // 初始化 quizSession
    const quizState = initQuizAdapter(session.virtualId, session.questions);
    if (quizState) {
      quizState.startTime = Date.now();
      const persistFinishedSession = async (s, selections) => {
        if (userId) {
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
            mode: session.mode,
            sourceId: session.sourceId,
            sourceName: session.title,
            subjectId: session.subjectId,
            state: s,
          });
        }

        const correctCount = s.allQuestions.filter(q => s.results[q.id]?.passed === true).length;
        const total = s.allQuestions.length;
        setLastSession({
          itemId: session.sourceId,
          title: session.title,
          lastIndex: 0,
          total,
          correct: correctCount,
        });

        const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
        const finishMsg = document.createElement('div');
        finishMsg.className = 'card mt-4 text-center';
        finishMsg.style.cssText = 'background: var(--practice-card); border-color: var(--practice-accent); padding: 1.5rem;';
        finishMsg.innerHTML = `
          <div class="text-3xl font-extrabold mb-2" style="color: var(--practice-accent);">${accuracy}%</div>
          <p class="text-sm font-semibold mb-1" style="color: var(--practice-text);">正确 ${correctCount} / ${total}</p>
          <p class="text-xs" style="color: var(--practice-muted);">${userId ? '练习记录与错题薄弱点已保存' : '登录后错题可自动收录'}</p>
          <div class="flex gap-2 justify-center mt-4">
            <a href="/practice/exams" class="btn-pill text-sm" style="background: var(--practice-accent); color: #fff; padding: 0.5rem 1.5rem;">继续刷题</a>
            ${userId && correctCount < total ? `<a href="/kb" class="btn-pill text-sm" style="border: 1px solid var(--practice-border); color: var(--practice-text); padding: 0.5rem 1.5rem;">查看错题</a>` : ''}
          </div>
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
    console.warn('[practice-session] 初始化失败:', e);
    container.innerHTML = `
      <div class="card text-center py-12" style="background: var(--practice-card); border-color: var(--practice-border);">
        <div class="flex justify-center mb-3" style="opacity: 0.3; color: var(--practice-muted);"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div>
        <p class="text-sm" style="color: var(--practice-muted);">加载失败: ${e.message || '未知错误'}</p>
      </div>
    `;
  }
}
